import type { AppContext } from "../types";
import { normalizeNetwork } from "../utils/network";

const IDENTIFIER_ADDRESS_MIN_LENGTH = 11;

/**
 * Lookup token by name (ticker) or address.
 * - network: specific network (xcb, btc, eth, etc.) or "all" to search all networks
 * - identifier: token name (e.g. ctn) if length <= 10, otherwise token address
 * - ?testnet=1 to include testnet tokens (default: mainnet only)
 */
export const lookupToken = async (c: AppContext): Promise<Response> => {
	try {
		const networkParam = c.req.param("network");
		const identifier = (c.req.param("identifier") || "").trim();

		if (!identifier) {
			return c.json({ error: "Token identifier is required", exists: false }, 400);
		}

		const includeTestnet = c.req.query("testnet") === "1";
		const network = networkParam ? normalizeNetwork(networkParam) : "";
		const isAllNetworks = network === "all";

		// > 10 chars = address, otherwise = token name (ticker)
		const isAddressLookup = identifier.length > IDENTIFIER_ADDRESS_MIN_LENGTH;

		const storage = (c.env.STORAGE || "kv").toLowerCase();

		if (storage === "d1") {
			return await lookupD1(c, {
				identifier,
				isAddressLookup,
				network: isAllNetworks ? null : network,
				includeTestnet,
			});
		}

		return await lookupKV(c, {
			identifier,
			isAddressLookup,
			network: isAllNetworks ? null : network,
			includeTestnet,
		});
	} catch (error) {
		console.error("Error in lookupToken:", error);
		return c.json({ error: "Internal server error", exists: false }, 500);
	}
};

type LookupOptions = {
	identifier: string;
	isAddressLookup: boolean;
	network: string | null;
	includeTestnet: boolean;
};

async function lookupKV(
	c: AppContext,
	options: LookupOptions
): Promise<Response> {
	const { identifier, isAddressLookup, network, includeTestnet } = options;

	// KV is keyed by address only; ticker lookup would require scanning all keys
	if (!isAddressLookup) {
		return c.json({
			error: "Lookup by token name is not supported with KV storage. Use D1 or lookup by address.",
			exists: false,
		}, 404);
	}

	const address = identifier;
	const results: { network: string; testnet: boolean }[] = [];

	// Check mainnet KV
	const kvMain = c.env.KV_WELL_KNOWN_REGISTRY;
	const mainData = await kvMain.get(address, "json");
	if (mainData) {
		const token = mainData as { network?: string };
		results.push({ network: token.network || "xcb", testnet: false });
	}

	// Check testnet KV if enabled
	if (includeTestnet) {
		const kvTest = c.env.KV_WELL_KNOWN_REGISTRY_TESTNET;
		const testData = await kvTest.get(address, "json");
		if (testData) {
			const token = testData as { network?: string };
			results.push({ network: token.network || "xab", testnet: true });
		}
	}

	// Filter by network if specific
	const filtered = network
		? results.filter((r) => r.network === network)
		: results;

	if (filtered.length === 0) {
		return c.json({
			error: "Token not found",
			exists: false,
			amount: 0,
		}, 404);
	}

	const networks = [...new Set(filtered.map((r) => r.network))];
	const response: Record<string, unknown> = {
		exists: true,
		amount: filtered.length,
	};
	if (network === null) {
		response.networks = networks;
	}

	return c.json(response, 200);
}

async function lookupD1(
	c: AppContext,
	options: LookupOptions
): Promise<Response> {
	const { identifier, isAddressLookup, network, includeTestnet } = options;
	const db = c.env.D1_WELL_KNOWN_REGISTRY;

	const conditions: string[] = [];
	const params: (string | number)[] = [];

	// Base filters
	conditions.push("enabled = 1");
	conditions.push("(expiration IS NULL OR expiration > datetime('now'))");
	conditions.push("(upcoming IS NULL OR upcoming <= datetime('now'))");

	// Testnet: default mainnet only; ?testnet=1 includes testnet tokens too
	if (!includeTestnet) {
		conditions.push("testnet = 0");
	}

	// Identifier: by address or by ticker (case-insensitive)
	if (isAddressLookup) {
		conditions.push("address = ?");
		params.push(identifier);
	} else {
		conditions.push("UPPER(ticker) = ?");
		params.push(identifier.toUpperCase());
	}

	// Network filter (when not "all")
	if (network !== null && network !== "") {
		conditions.push("network = ?");
		params.push(network);
	}

	const whereClause = conditions.join(" AND ");
	const query = `SELECT network, address FROM tokens WHERE ${whereClause}`;

	const result = await db.prepare(query).bind(...params).all<{ network: string; address: string }>();

	if (!result.results || result.results.length === 0) {
		return c.json({
			error: "Token not found",
			exists: false,
			amount: 0,
		}, 404);
	}

	const networks = [...new Set(result.results.map((r) => r.network))];
	const response: Record<string, unknown> = {
		exists: true,
		amount: result.results.length,
	};
	if (network === null) {
		response.networks = networks;
	}

	return c.json(response, 200);
}
