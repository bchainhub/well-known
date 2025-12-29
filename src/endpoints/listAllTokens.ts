import type { AppContext, PaginatedResponse, Token } from "../types";
import { isTestnetNetwork, normalizeNetwork } from "../utils/network";
import { cleanTokenData } from "../utils/response";

export const listAllTokens = async (c: AppContext): Promise<Response> => {
	try {
		// Parse query parameters
		const prefix = (c.req.query("prefix") || "").toLowerCase();
		const limitParam = parseInt(c.req.query("limit") || "1000");
		const cursor = c.req.query("cursor") || "";
		const category = c.req.query("category") || "";
		const tickerParam = c.req.query("ticker") || "";
		const addressParam = c.req.query("address") || "";
		const order = (c.req.query("order") || "asc").toLowerCase();
		const full = c.req.query("full") === "true";
		const networkParam = c.req.param("network");
		const hasNetwork = networkParam && networkParam.trim() !== "";
		const network = hasNetwork ? normalizeNetwork(networkParam, "xcb") : "";
		const testnet = hasNetwork ? (isTestnetNetwork(network) || c.env.TESTNET === "true") : false;

		if (limitParam < 1 || limitParam > 1000) {
			return c.json({ error: "Limit must be between 1 and 1000" }, 400);
		}

		if (order !== "asc" && order !== "desc") {
			return c.json({ error: "Order must be 'asc' or 'desc'" }, 400);
		}

		const storage = (c.env.STORAGE || "kv").toLowerCase();

		if (storage === "d1") {
			return await listAllTokensD1(c, {
				network,
				hasNetwork,
				testnet,
				prefix,
				category,
				ticker: tickerParam,
				address: addressParam,
				limit: limitParam,
				order: order as "asc" | "desc",
				cursor,
				full
			});
		} else {
			return await listAllTokensKV(c, {
				network,
				hasNetwork,
				testnet,
				prefix,
				limit: limitParam,
				cursor,
				full
			});
		}
	} catch (error) {
		console.error("Error in listAllTokens:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
};

async function listAllTokensKV(
	c: AppContext,
	options: {
		network: string;
		hasNetwork: boolean;
		testnet: boolean;
		prefix: string;
		limit: number;
		cursor: string;
		full: boolean;
	}
): Promise<Response> {
	const { hasNetwork, testnet, prefix, limit, cursor, full } = options;

	// When no network is specified, use mainnet KV (all non-testnet networks)
	// Note: KV storage doesn't support cross-namespace queries, so we return mainnet only

	// Get KV store
	const kv = testnet ? c.env.KV_WELL_KNOWN_REGISTRY_TESTNET : c.env.KV_WELL_KNOWN_REGISTRY;

	// List keys with prefix filter and cursor pagination
	const listOptions: any = {
		prefix: prefix,
		limit: limit.toString()
	};

	if (cursor) {
		listOptions.cursor = cursor;
	}

	const result = await kv.list(listOptions);
	const { keys, list_complete } = result;
	const nextCursor = (result as any).cursor;

	// If no keys found, return not found
	if (!keys || keys.length === 0) {
		return c.json({ error: "No tokens found" }, 404);
	}

	if (full) {
		// Fetch full token data for each address
		const tokenPromises = keys.map(key => kv.get(key.name, "json"));
		const tokenData = await Promise.all(tokenPromises);
		const tokens = tokenData
			.filter(token => token !== null)
			.map(token => cleanTokenData(token));

		const response = {
			tokens: tokens,
			pagination: {
				limit: limit,
				hasNext: !list_complete,
				cursor: nextCursor
			}
		};

		return c.json(response, 200);
	} else {
		// Return just the keys without fetching token data
		const tokenKeys = keys.map(key => key.name);

		const response = {
			tokens: tokenKeys,
			pagination: {
				limit: limit,
				hasNext: !list_complete,
				cursor: nextCursor
			}
		};

		return c.json(response, 200);
	}
}

async function listAllTokensD1(
	c: AppContext,
	options: {
		network: string;
		hasNetwork: boolean;
		testnet: boolean;
		prefix: string;
		category: string;
		ticker: string;
		address: string;
		limit: number;
		order: "asc" | "desc";
		cursor: string;
		full: boolean;
	}
): Promise<Response> {
	const { network, hasNetwork, testnet, prefix, category, ticker, address, limit, order, cursor, full } = options;
	const db = c.env.D1_WELL_KNOWN_REGISTRY;

	// Build WHERE conditions
	const conditions: string[] = [];
	const params: any[] = [];

	// Filter by network (only if network is specified)
	if (hasNetwork) {
		conditions.push(`network = ?`);
		params.push(network);
	}

	// Filter by testnet
	// When no network is specified, return all non-testnet networks (testnet = 0)
	// When network is specified, use the testnet flag for that network
	conditions.push(`testnet = ?`);
	params.push(testnet ? 1 : 0);

	// Filter enabled tokens
	conditions.push(`enabled = 1`);

	// Filter out expired tokens
	conditions.push(`(expiration IS NULL OR expiration > datetime('now'))`);

	// Filter out upcoming tokens (only show if upcoming is NULL or in the past)
	conditions.push(`(upcoming IS NULL OR upcoming <= datetime('now'))`);

	// Filter by prefix (address prefix)
	if (prefix) {
		conditions.push(`address LIKE ?`);
		params.push(`${prefix}%`);
	}

	// Filter by category (comma-separated, exact match)
	if (category) {
		const categories = category.split(',').map(c => c.trim()).filter(c => c);
		if (categories.length > 0) {
			// Use JSON functions to check if any of the categories exist in the categories array
			const categoryPlaceholders = categories.map(() => '?').join(',');
			conditions.push(`EXISTS (
				SELECT 1 FROM json_each(categories)
				WHERE json_each.value IN (${categoryPlaceholders})
			)`);
			params.push(...categories);
		}
	}

	// Filter by ticker (comma-separated)
	if (ticker) {
		const tickers = ticker.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
		if (tickers.length > 0) {
			const placeholders = tickers.map(() => '?').join(',');
			conditions.push(`UPPER(ticker) IN (${placeholders})`);
			params.push(...tickers);
		}
	}

	// Filter by address (comma-separated)
	if (address) {
		const addresses = address.split(',').map(a => a.trim()).filter(a => a);
		if (addresses.length > 0) {
			const placeholders = addresses.map(() => '?').join(',');
			conditions.push(`address IN (${placeholders})`);
			params.push(...addresses);
		}
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

	// Calculate offset from cursor
	let offset = 0;
	if (cursor) {
		const parsedOffset = parseInt(cursor, 10);
		if (!isNaN(parsedOffset) && parsedOffset >= 0) {
			offset = parsedOffset;
		}
	}

	// Get total count for pagination
	const countQuery = `SELECT COUNT(*) as total FROM tokens ${whereClause}`;
	const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
	const total = countResult?.total || 0;

	// Get tokens with ordering and pagination
	const orderClause = `ORDER BY ticker ${order.toUpperCase()}`;
	const limitClause = `LIMIT ? OFFSET ?`;

	if (full) {
		// Select all fields for full token objects
		const query = `
			SELECT
				blockchain,
				network,
				chain_id as chainId,
				testnet,
				genesis,
				expiration,
				address,
				ticker,
				name,
				symbol,
				alt_symbol as altSymbol,
				flag,
				type,
				decimals,
				alt_counting as altCounting,
				total_supply as totalSupply,
				categories,
				url,
				logos
			FROM tokens ${whereClause} ${orderClause} ${limitClause}
		`;
		params.push(limit, offset);

		const result = await db.prepare(query).bind(...params).all<any>();

		if (!result.results || result.results.length === 0) {
			return c.json({ error: "No tokens found" }, 404);
		}

		// Format token objects
		const tokens = result.results.map(row => {
			const tokenData: any = {
				blockchain: row.blockchain,
				network: row.network,
				chainId: row.chainId,
				testnet: row.testnet === 1,
				genesis: row.genesis,
				expiration: row.expiration,
				address: row.address,
				ticker: row.ticker,
				name: row.name,
				symbol: row.symbol,
				altSymbol: row.altSymbol,
				flag: row.flag,
				type: row.type,
				decimals: row.decimals,
				altCounting: row.altCounting === 1,
				totalSupply: row.totalSupply,
				url: row.url
			};

			// Parse categories JSON
			if (row.categories) {
				try {
					tokenData.categories = JSON.parse(row.categories);
				} catch {
					tokenData.categories = [];
				}
			} else {
				tokenData.categories = [];
			}

			// Parse logos JSON
			if (row.logos) {
				try {
					tokenData.logos = JSON.parse(row.logos);
				} catch {
					tokenData.logos = {};
				}
			} else {
				tokenData.logos = {};
			}

			// Clean up null/undefined/false values
			return cleanTokenData(tokenData);
		});

		const hasNext = offset + limit < total;
		const nextCursor = hasNext ? String(offset + limit) : undefined;

		const response = {
			tokens: tokens,
			pagination: {
				limit: limit,
				hasNext: hasNext,
				cursor: nextCursor
			}
		};

		return c.json(response, 200);
	} else {
		// Select only address for simple list
		const query = `SELECT address FROM tokens ${whereClause} ${orderClause} ${limitClause}`;
		params.push(limit, offset);

		const result = await db.prepare(query).bind(...params).all<{ address: string }>();

		if (!result.results || result.results.length === 0) {
			return c.json({ error: "No tokens found" }, 404);
		}

		const tokenKeys = result.results.map(row => row.address);
		const hasNext = offset + limit < total;
		const nextCursor = hasNext ? String(offset + limit) : undefined;

		const response = {
			tokens: tokenKeys,
			pagination: {
				limit: limit,
				hasNext: hasNext,
				cursor: nextCursor
			}
		};

		return c.json(response, 200);
	}
}
