import type { AppContext } from "../types";
import { validateWalletAddress } from "blockchain-wallet-validator";
import { isTestnetNetwork, normalizeNetwork } from "../utils/network";
import { cleanTokenData } from "../utils/response";

export const getToken = async (c: AppContext): Promise<Response> => {
	try {
		// Get the token parameter from the route
		const tokenParam = c.req.param("token");

		// Validate tokenParam exists
		if (!tokenParam) {
			return c.json({ error: "Token parameter is required" }, 400);
		}

		// Remove .json extension if present
		const tokenAddress = tokenParam.endsWith('.json')
			? tokenParam.slice(0, -5)
			: tokenParam;

		// Use network and validate wallet address
		const network = normalizeNetwork(c.req.param("network"), "xcb");
		const testnet = isTestnetNetwork(network) || c.env.TESTNET === "true";

		const validationResult = validateWalletAddress(tokenAddress, {
			network: [network],
			testnet,
			enabledLegacy: false
		});

		if (!validationResult.isValid) {
			return c.json({ error: "Invalid wallet address" }, 400);
		}

		const storage = (c.env.STORAGE || "kv").toLowerCase();

		if (storage === "d1") {
			return await getTokenD1(c, tokenAddress, network, testnet);
		} else {
			return await getTokenKV(c, tokenAddress, testnet);
		}
	} catch (error) {
		console.error("Error in getToken:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
};

async function getTokenKV(
	c: AppContext,
	tokenAddress: string,
	testnet: boolean
): Promise<Response> {
	// Get token data from KV store using token address as key
	const kv = testnet ? c.env.KV_WELL_KNOWN_REGISTRY_TESTNET : c.env.KV_WELL_KNOWN_REGISTRY;

	try {
		const tokenData = await kv.get(tokenAddress, "json");

		if (!tokenData) {
			return c.json({ error: "Token not found" }, 404);
		}

		// Return the token data as-is from KV store
		return c.json(tokenData, 200);
	} catch (kvError) {
		console.error(`Error fetching token ${tokenAddress}:`, kvError);
		return c.json({ error: "Error retrieving token data" }, 500);
	}
}

async function getTokenD1(
	c: AppContext,
	tokenAddress: string,
	network: string,
	testnet: boolean
): Promise<Response> {
	const db = c.env.D1_WELL_KNOWN_REGISTRY;

	try {
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
			FROM tokens
			WHERE address = ?
				AND network = ?
				AND testnet = ?
				AND enabled = 1
				AND (expiration IS NULL OR expiration > datetime('now'))
				AND (upcoming IS NULL OR upcoming <= datetime('now'))
		`;

		const result = await db.prepare(query).bind(tokenAddress, network, testnet ? 1 : 0).first<any>();

		if (!result) {
			return c.json({ error: "Token not found" }, 404);
		}

		// Parse JSON fields
		const tokenData: any = {
			blockchain: result.blockchain,
			network: result.network,
			chainId: result.chainId,
			testnet: result.testnet === 1,
			genesis: result.genesis,
			expiration: result.expiration,
			address: result.address,
			ticker: result.ticker,
			name: result.name,
			symbol: result.symbol,
			altSymbol: result.altSymbol,
			flag: result.flag,
			type: result.type,
			decimals: result.decimals,
			altCounting: result.altCounting === 1,
			totalSupply: result.totalSupply,
			url: result.url,
			logos: result.logos
		};

		// Parse categories JSON
		if (result.categories) {
			try {
				tokenData.categories = JSON.parse(result.categories);
			} catch {
				tokenData.categories = [];
			}
		} else {
			tokenData.categories = [];
		}

		// Parse logos JSON
		if (result.logos) {
			try {
				tokenData.logos = JSON.parse(result.logos);
			} catch {
				tokenData.logos = {};
			}
		} else {
			tokenData.logos = {};
		}

		// Clean up null/undefined/false values
		const cleanedTokenData = cleanTokenData(tokenData);

		return c.json(cleanedTokenData, 200);
	} catch (dbError) {
		console.error(`Error fetching token ${tokenAddress} from D1:`, dbError);
		return c.json({ error: "Error retrieving token data" }, 500);
	}
}
