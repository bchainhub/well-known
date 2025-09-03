import type { AppContext } from "../types";

export const Ping = async (c: AppContext) => {
    return c.text("pong", 200);
};
