import type { AppContext } from "../types";

export const Health = async (c: AppContext) => {
    return c.json({
        currentTime: new Date().toISOString(),
        health: "ok"
    });
};
