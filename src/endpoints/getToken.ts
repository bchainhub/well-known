import type { AppContext } from "../types";
import { validateWalletAddress } from "blockchain-wallet-validator";

export const getToken = async (c: AppContext): Promise<Response> => {
    try {
        // Get the token parameter from the route
        const tokenAddress = c.req.param("token");

        // Validate tokenAddress exists
        if (!tokenAddress) {
            return c.json({ error: "Token parameter is required" }, 400);
        }

        // Validate wallet address using blockchain-wallet-validator
        const isProduction = c.env.ENVIRONMENT === "production";
        const testnet = !isProduction;

        const validationResult = validateWalletAddress(tokenAddress, {
            network: isProduction ? ["xcb"] : ["xab"],
            testnet,
            enabledLegacy: false
        });

        if (!validationResult.isValid) {
            return c.json({ error: "Invalid wallet address" }, 400);
        }

        // Get token data from KV store using token address as key
        const kv = c.env.KV_WELL_KNOWN_REGISTRY;

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
