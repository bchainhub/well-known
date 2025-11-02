import type { AppContext } from "../types";
import { validateWalletAddress } from "blockchain-wallet-validator";

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
        const network = (c.req.param("network") || "").toLowerCase() || "xcb";
        const testnet = network === "xab" || network === "testnet" || c.env.TESTNET === "true";

        const validationResult = validateWalletAddress(tokenAddress, {
            network: [network],
            testnet,
            enabledLegacy: false
        });

        if (!validationResult.isValid) {
            return c.json({ error: "Invalid wallet address" }, 400);
        }

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
    } catch (error) {
        console.error("Error in getToken:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
};
