import type { AppContext } from "../types";

export const Version = async (c: AppContext) => {
	const packageJson = await import("../../package.json");
	const environment = c.env.ENVIRONMENT === "production" ? "prod" : "dev";

	return c.json({
		version: packageJson.version,
		environment: environment
	});
};
