import type { Context } from "hono";

// Extend the Env interface to include KV bindings
declare global {
  interface Env {
    KV_WELL_KNOWN_REGISTRY: KVNamespace;
    ENVIRONMENT?: string;
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
  data: T[];
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
