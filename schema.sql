-- Well-Known Token Registry Database Schema
-- D1 Database (SQLite) schema for token registry

CREATE TABLE IF NOT EXISTS tokens (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	blockchain TEXT NOT NULL,
	network TEXT NOT NULL,
	chain_id INTEGER DEFAULT NULL,
	testnet BOOLEAN NOT NULL DEFAULT 0,
	enabled BOOLEAN NOT NULL DEFAULT 1,
	genesis TIMESTAMPTZ DEFAULT NULL,
	expiration TIMESTAMPTZ DEFAULT NULL,
	upcoming TIMESTAMPTZ DEFAULT NULL,
	updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	address TEXT NOT NULL UNIQUE,
	ticker TEXT NOT NULL,
	name TEXT NOT NULL,
	symbol TEXT NOT NULL,
	alt_symbol TEXT DEFAULT NULL,
	flag TEXT DEFAULT NULL,
	type TEXT NOT NULL,
	decimals INTEGER NOT NULL CHECK (decimals >= 0 AND decimals <= 255),
	alt_counting BOOLEAN NOT NULL DEFAULT 0,
	total_supply TEXT DEFAULT NULL,
	categories TEXT DEFAULT NULL, -- JSON array stored as text
	url TEXT DEFAULT NULL,
	logos TEXT DEFAULT NULL, -- JSON object stored as text
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_network ON tokens(network);
CREATE INDEX IF NOT EXISTS idx_tokens_testnet ON tokens(testnet);
CREATE INDEX IF NOT EXISTS idx_tokens_enabled ON tokens(enabled);
CREATE INDEX IF NOT EXISTS idx_tokens_ticker ON tokens(ticker);
CREATE INDEX IF NOT EXISTS idx_tokens_address ON tokens(address);
CREATE INDEX IF NOT EXISTS idx_tokens_blockchain ON tokens(blockchain);
CREATE INDEX IF NOT EXISTS idx_tokens_expiration ON tokens(expiration);
CREATE INDEX IF NOT EXISTS idx_tokens_upcoming ON tokens(upcoming);
CREATE INDEX IF NOT EXISTS idx_tokens_network_enabled ON tokens(network, enabled, testnet);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_tokens_active ON tokens(network, enabled, expiration, upcoming, testnet);
