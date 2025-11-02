import { Hono } from "hono";
import { cors } from "hono/cors";
import { Ping } from "./endpoints/ping";
import { Version } from "./endpoints/version";
import { Health } from "./endpoints/health";
import { listAllTokens } from "./endpoints/listAllTokens";
import { getToken } from "./endpoints/getToken";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Apply CORS middleware globally
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["*"],
    maxAge: 86400,
  })
);

// Status endpoints
app.get("/.well-known/tokens/status/ping", Ping);
app.get("/.well-known/tokens/status/version", Version);
app.get("/.well-known/tokens/status/health", Health);

// Token endpoints
app.get("/.well-known/tokens.json", listAllTokens);
app.get("/.well-known/tokens/:network/tokens.json", listAllTokens);
app.get("/.well-known/tokens/:token", getToken);
app.get("/.well-known/tokens/:network/:token", getToken);

// Export the Hono app
export default app;
