import type { Context } from "hono";

// Extend the Env interface to include KV bindings and D1
declare global {
	interface Env {
		KV_WELL_KNOWN_REGISTRY: KVNamespace;
		KV_WELL_KNOWN_REGISTRY_TESTNET: KVNamespace;
		D1_WELL_KNOWN_REGISTRY: D1Database;
		ENVIRONMENT?: string;
		TESTNET?: string;
		STORAGE?: string;
	}
}

export type AppContext = Context<{ Bindings: Env }>;

// Pagination types
export interface PaginationParams {
	prefix?: string;
	limit?: number;
	cursor?: string;
}

export interface PaginatedResponse<T> {
	tokens: T[];
	pagination: {
		limit: number;
		hasNext: boolean;
		cursor?: string;
	};
}

export interface Token {
	address: string;
	name?: string;
	symbol?: string;
	decimals?: number;
	[key: string]: any;
}
