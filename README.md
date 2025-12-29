# Well-Known Token Registry

A token registry service that provides standardized access to token information through well-known URIs.

## Why .well-known?

According to the [Well-known URI specification](https://en.wikipedia.org/wiki/Well-known_URI), well-known URIs are standardized URL path prefixes that start with `/.well-known/`. They provide:

- **Consistent locations** across different servers for well-known services
- **Standardized discovery** of services and information
- **Interoperability** between different applications and services
- **Predictable endpoints** that clients can rely on

Our token registry follows this standard by providing token information at predictable, well-known locations, making it easy for wallets, exchanges, and other applications to discover and validate token metadata.

## Endpoints

### Status Endpoints

#### `GET https://coreblockchain.net/.well-known/tokens/status/ping`

Simple health check endpoint.

- **Response**: `"pong"`
- **Status**: 200

#### `GET https://coreblockchain.net/.well-known/tokens/status/version`

Returns the current version and environment information.

- **Response**:

  ```json
  {
    "version": "0.1.0",
    "environment": "production"
  }
  ```

- **Status**: 200

#### `GET https://coreblockchain.net/.well-known/tokens/status/health`

Returns detailed health information.

- **Response**:

  ```json
  {
    "currentTime": "2024-01-15T10:30:00.000Z",
    "health": "ok"
  }
  ```

- **Status**: 200

### Token Endpoints

#### `GET https://coreblockchain.net/.well-known/tokens.json`

Lists all registered tokens from all non-testnet networks with pagination support. When no network is specified, returns tokens from all mainnet networks (all networks where `testnet=false`).

**Query Parameters:**

- `prefix` (optional): Filter tokens by address prefix (e.g., `cb` matches addresses starting with `cb`)
- `limit` (optional): Number of tokens per page (1-1000, default: 1000)
- `cursor` (optional): Cursor for pagination (used to fetch the next page)
- `full` (optional): When set to `true`, returns full token objects instead of just addresses. Default: `false` (returns addresses only)
- `category` (optional): Filter tokens by category name (e.g., `rwa`, `stable`). Returns all tokens within the specified category
- `ticker` (optional): Filter by ticker symbol(s). Can be a single ticker or comma-separated list (e.g., `CTN` or `CTN,BTC,ETH`)
- `address` (optional): Filter by token address(es). Can be a single address or comma-separated list
- `order` (optional): Sort order by ticker name. Valid values: `asc` (ascending, default) or `desc` (descending)

**Note:** The `category`, `ticker`, `address`, and `order` parameters are only available when using D1 storage. When using KV storage, only `prefix`, `limit`, `cursor`, and `full` are supported.

**Examples:**

```bash
# Basic listing with prefix filter (returns addresses only)
GET https://coreblockchain.net/.well-known/tokens.json?prefix=cb&limit=50

# Get full token objects instead of addresses
GET https://coreblockchain.net/.well-known/tokens.json?full=true&limit=50

# Filter by category with full objects
GET https://coreblockchain.net/.well-known/tokens.json?category=rwa&full=true&limit=100

# Filter by multiple tickers with full objects
GET https://coreblockchain.net/.well-known/tokens.json?ticker=CTN,BTC,ETH&full=true

# Filter by address
GET https://coreblockchain.net/.well-known/tokens.json?address=cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c

# Combine filters with ordering and full objects
GET https://coreblockchain.net/.well-known/tokens.json?category=stable&order=desc&full=true&limit=50

# Combine ticker and address filters with full objects
GET https://coreblockchain.net/.well-known/tokens.json?ticker=CTN&address=cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c&full=true
```

#### `GET https://coreblockchain.net/.well-known/tokens/:network/tokens.json`

Lists all registered tokens from a specific network with pagination support.

**Parameters:**

- `network`: The network identifier (e.g., `xcb`, `xab`, `testnet`). If not provided, defaults to mainnet (XCB).

**Query Parameters:**

Same as above - `prefix`, `limit`, `cursor`, `full`, `category`, `ticker`, `address`, `order`

**Network Detection:**

The registry automatically detects testnet networks based on prefixes:

- Testnet prefixes: `xab`, `tbtc`, `tltc`, `bchtest`, `teth`, `tsol`, `txmr`, `tdot`
- If a network matches one of these prefixes or is explicitly `testnet`, it's treated as a testnet
- If network is not defined, defaults to mainnet with `testnet=false`

**Examples:**

```bash
# Mainnet tokens
GET https://coreblockchain.net/.well-known/tokens/xcb/tokens.json?prefix=cb&limit=50

# Testnet tokens
GET https://coreblockchain.net/.well-known/tokens/testnet/tokens.json

# Testnet with category filter
GET https://coreblockchain.net/.well-known/tokens/xab/tokens.json?category=stable

# Filter by network and ticker
GET https://coreblockchain.net/.well-known/tokens/xcb/tokens.json?ticker=CTN&order=asc
```

**Response (default - addresses only):**

```json
{
  "tokens": [
    "cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c"
  ],
  "pagination": {
    "limit": 50,
    "hasNext": true,
    "cursor": "6Ck1la0VxJ0djhidm1MdX2FyD"
  }
}
```

**Response (with `full=true` - full token objects):**

```json
{
  "tokens": [
    {
      "blockchain": "core",
      "network": "xcb",
      "chainId": null,
      "testnet": false,
      "expiration": null,
      "address": "cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c",
      "ticker": "CTN",
      "name": "CoreToken",
      "symbol": "Ƈ",
      "altSymbol": "C",
      "flag": "🇺🇸",
      "type": "CBC20",
      "decimals": 18,
      "altCounting": false,
      "totalSupply": "1000000000000000000000000",
      "categories": ["rwa", "stable"],
      "url": "https://coretoken.net",
      "logos": {
        "png": {
          "16": "https://corecdn.info/mark/16/corecoin.png",
          "32": "https://corecdn.info/mark/32/corecoin.png"
        },
        "svg": {
          "16": "https://corecdn.info/mark/16/corecoin.svg",
          "32": "https://corecdn.info/mark/32/corecoin.svg"
        }
      }
    }
  ],
  "pagination": {
    "limit": 50,
    "hasNext": true,
    "cursor": "50"
  }
}
```

**Filtering Behavior:**

The registry automatically filters out:

- **Disabled tokens**: Tokens with `enabled=false` are never returned
- **Expired tokens**: Tokens with an `expiration` timestamp in the past are excluded
- **Upcoming tokens**: Tokens with an `upcoming` timestamp in the future are excluded (only shown after the `upcoming` date)

This ensures that only active, valid tokens are returned in listings.

#### `GET https://coreblockchain.net/.well-known/tokens/:token.json`

Retrieves detailed information for a specific token from the main network.

**Parameters:**

- `token`: The token address (without .json extension)

**Example:**

```bash
GET https://coreblockchain.net/.well-known/tokens/cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c.json
```

#### `GET https://coreblockchain.net/.well-known/tokens/:network/:token.json`

Retrieves detailed information for a specific token from a specific network.

**Parameters:**

- `network`: The network identifier (e.g., `xcb`, `xab`, `testnet`)
- `token`: The token address (without .json extension)

**Examples:**

```bash
GET https://coreblockchain.net/.well-known/tokens/xcb/cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c.json
GET https://coreblockchain.net/.well-known/tokens/testnet/cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c.json
```

**Response:**

```json
{
  "blockchain": "core",
  "network": "xcb",
  "chainId": null,
  "testnet": false,
  "genesis": "2023-11-17T17:23:50.000Z",
  "expiration": null,
  "address": "cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c",
  "ticker": "CTN",
  "name": "CoreToken",
  "symbol": "Ƈ",
  "altSymbol": "C",
  "flag": "🏴‍☠️",
  "type": "CBC20",
  "decimals": 18,
  "totalSupply": "1000000000000000000000000",
  "categories": ["rwa", "stable"],
  "url": "https://coretoken.net",
  "logos": {
    "png": {
      "16": "https://corecdn.info/mark/16/coretoken.png",
      "32": "https://corecdn.info/mark/32/coretoken.png",
      "48": "https://corecdn.info/mark/48/coretoken.png",
      "64": "https://corecdn.info/mark/64/coretoken.png",
      "128": "https://corecdn.info/mark/128/coretoken.png",
      "256": "https://corecdn.info/mark/256/coretoken.png"
    },
    "svg": {
      "16": "https://corecdn.info/mark/16/coretoken.svg",
      "32": "https://corecdn.info/mark/32/coretoken.svg",
      "48": "https://corecdn.info/mark/48/coretoken.svg",
      "64": "https://corecdn.info/mark/64/coretoken.svg",
      "128": "https://corecdn.info/mark/128/coretoken.svg",
      "256": "https://corecdn.info/mark/256/coretoken.svg"
    }
  }
}
```

**Response Fields:**

- `blockchain`: Name of the blockchain (e.g., "core", "ethereum", "bitcoin")
- `network`: Network identifier (e.g., "xcb", "xab")
- `chainId`: Chain ID number (null if not specified)
- `testnet`: Boolean indicating if this is a testnet token
- `genesis`: ISO 8601 timestamp when the token was first released/created (null if not specified)
- `expiration`: ISO 8601 timestamp when the token expires (null if never expires)
- `address`: Blockchain address of the token contract
- `ticker`: Trading symbol (e.g., "CTN", "BTC", "ETH")
- `name`: Full name of the token (e.g., "CoreToken")
- `symbol`: Display symbol (e.g., "Ƈ")
- `altSymbol`: Alternative symbol (e.g., "C")
- `flag`: Emoji flag representing the token's origin (optional)
- `type`: Token type (e.g., "CBC20", "CBC721")
- `decimals`: Number of decimal places (0-255)
- `totalSupply`: Total supply of tokens as a string (optional)
- `categories`: Array of category strings (e.g., ["rwa", "stable"])
- `url`: Project website URL (optional)
- `logos`: Object containing logo URLs organized by format (png/svg) and size (16, 32, 48, 64, 128, 256)

**Error Responses:**

- `400 Bad Request`: Invalid token address format
- `404 Not Found`: Token not found in registry
- `500 Internal Server Error`: Error retrieving token data

## Query Parameters Reference

### List Tokens Endpoint Parameters

The following query parameters are available for token listing endpoints:

#### Basic Parameters

- **`prefix`** (string, optional): Filter tokens by address prefix
  - Example: `prefix=cb` matches all addresses starting with `cb`
  - Works with both KV and D1 storage

- **`limit`** (integer, optional): Number of tokens per page
  - Range: 1-1000
  - Default: 1000
  - Works with both KV and D1 storage

- **`cursor`** (string, optional): Pagination cursor for fetching next page
  - For KV: Returns cursor from previous response
  - For D1: Offset-based cursor (numeric string)
  - Works with both KV and D1 storage

- **`full`** (boolean, optional): Return full token objects instead of just addresses
  - When `true`: Returns complete token objects with all fields (blockchain, network, ticker, name, symbol, logos, etc.)
  - When `false` or omitted: Returns only token addresses as strings (default)
  - Example: `full=true` returns full token data
  - Works with both KV and D1 storage

#### Advanced Parameters (D1 Only)

These parameters are only available when using D1 storage (`STORAGE=d1`):

- **`category`** (string, optional): Filter tokens by category name
  - Returns all tokens within the specified category
  - Example: `category=rwa` returns all Real World Asset tokens
  - Example: `category=stable` returns all stablecoin tokens
  - Categories are case-sensitive

- **`ticker`** (string, optional): Filter by ticker symbol(s)
  - Single ticker: `ticker=CTN`
  - Multiple tickers (comma-separated): `ticker=CTN,BTC,ETH`
  - Case-insensitive matching
  - Returns tokens matching any of the provided tickers

- **`address`** (string, optional): Filter by token address(es)
  - Single address: `address=cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c`
  - Multiple addresses (comma-separated): `address=addr1,addr2,addr3`
  - Returns tokens matching any of the provided addresses

- **`order`** (string, optional): Sort order by ticker name
  - Valid values: `asc` (ascending, default) or `desc` (descending)
  - Example: `order=desc` sorts tokens by ticker in descending order

#### Parameter Combinations

You can combine multiple parameters for advanced filtering:

```bash
# Filter by category and sort descending
GET /tokens.json?category=stable&order=desc&limit=50

# Filter by multiple tickers with prefix
GET /tokens.json?ticker=CTN,BTC&prefix=cb&limit=100

# Combine ticker and address filters
GET /tokens.json?ticker=CTN&address=cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c

# Network-specific filtering
GET /tokens/xcb/tokens.json?category=rwa&order=asc&limit=25
```

#### Filtering Behavior

The registry automatically applies the following filters to all queries:

1. **Enabled tokens only**: Disabled tokens (`enabled=false`) are never returned
2. **Non-expired tokens**: Tokens with `expiration` timestamp in the past are excluded
3. **Available tokens**: Tokens with `upcoming` timestamp in the future are excluded (only shown after the `upcoming` date)
4. **Network filtering**: When a network is specified in the URL path, only tokens from that network are returned

## Network Separation and Security

### Why Separate Testnet and Mainnet?

This registry maintains separate storage and endpoints for testnet and mainnet tokens for several critical reasons:

1. **Data Integrity**: Testnet tokens can be created, destroyed, and manipulated freely for testing purposes. Keeping them separate prevents contamination of production token data.

2. **Security**: Mixing testnet and mainnet data could lead to serious security vulnerabilities, including:
   - Accidentally using testnet tokens in production transactions
   - Confusion about which network a token belongs to
   - Malicious actors potentially creating testnet tokens with the same address as mainnet tokens

3. **Performance**: Separating datasets allows for independent optimization and scaling. Testnet data can grow freely without impacting mainnet query performance.

4. **Compliance**: Production and testing environments should be isolated. Many regulatory frameworks require clear separation between test and production data.

### Storage Backends

The registry supports two storage backends, configurable via the `STORAGE` environment variable:

#### KV Storage (Default)

When `STORAGE=kv` or not set, the registry uses Cloudflare KV for storage:

- `KV_WELL_KNOWN_REGISTRY`: Main network (XCB) tokens
- `KV_WELL_KNOWN_REGISTRY_TESTNET`: Test network (XAB) tokens

**KV Features:**

- Fast key-value lookups
- Cursor-based pagination
- Prefix filtering
- Simple address-based queries

#### D1 Database

When `STORAGE=d1`, the registry uses Cloudflare D1 (SQLite) for storage:

- `D1_WELL_KNOWN_REGISTRY`: Single database for all networks (filtered by network and testnet flags)

**D1 Features:**

- Advanced querying with SQL
- Category-based filtering
- Multi-ticker and multi-address filtering
- Sorting by ticker (ascending/descending)
- Offset-based pagination
- Complex filtering with expiration and upcoming date handling

**Storage Selection:**

The registry automatically selects the appropriate storage backend based on the `STORAGE` environment variable. D1 provides more advanced filtering capabilities, while KV offers simpler, faster lookups for basic use cases.

### Why Validate Token Addresses?

All token addresses are validated using the `blockchain-wallet-validator` library for the following reasons:

1. **Prevent Invalid Addresses**: Ensures all registered tokens have valid blockchain addresses, preventing typos and malformed data from entering the registry.

2. **Network Safety**: Validates that addresses are appropriate for the specified network (e.g., XCB vs XAB) to prevent cross-network confusion.

3. **Trust and Reliability**: Applications consuming this registry need to trust that all addresses are valid. Validation provides this guarantee.

4. **Prevent Abuse**: Without validation, malicious actors could register invalid or fake addresses, potentially causing applications to fail or behave unexpectedly.

5. **Early Error Detection**: Catching invalid addresses during registration prevents downstream errors when wallets, exchanges, or other applications try to use these addresses.

The validation rules:

- **Main Network**: XCB network validation
- **Test Network**: XAB network validation
- Legacy address formats are disabled for security

## Adding New Tokens

To request the addition of a new token to the registry, please create a GitHub issue using our [token request template](.github/ISSUE_TEMPLATE/token-request.yml).

## License

This project is licensed under the CORE License. See the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For questions or support, please open an issue in this repository.
