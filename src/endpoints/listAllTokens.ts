import type { AppContext, PaginatedResponse, Token } from "../types";

export const listAllTokens = async (c: AppContext): Promise<Response> => {
    try {
        // Parse query parameters
        const prefix = (c.req.query("prefix") || "").toLowerCase();
        const limitParam = parseInt(c.req.query("limit") || "1000");
        const cursor = c.req.query("cursor") || "";
        const network = (c.req.param("network") || "").toLowerCase() || "xcb";
        const testnet = network === "xab" || network === "testnet" || c.env.TESTNET === "true";

        if (limitParam < 1 || limitParam > 1000) {
            return c.json({ error: "Limit must be between 1 and 100" }, 400);
        }

        // Get KV store
        const kv = testnet ? c.env.KV_WELL_KNOWN_REGISTRY_TESTNET : c.env.KV_WELL_KNOWN_REGISTRY;

        // List keys with prefix filter and cursor pagination
        const listOptions: any = {
            prefix: prefix,
            limit: limitParam.toString()
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

        // Return just the keys without fetching token data
        const tokenKeys = keys.map(key => key.name);

        const response = {
            tokens: tokenKeys,
            pagination: {
                limit: limitParam,
                hasNext: !list_complete,
                cursor: nextCursor
            }
        };

        return c.json(response, 200);
    } catch (error) {
        console.error("Error in listAllTokens:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
};
