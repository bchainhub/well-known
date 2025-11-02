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

Lists all registered tokens from the main network with pagination support.

**Query Parameters:**

- `prefix` (optional): Filter tokens by address prefix
- `limit` (optional): Number of tokens per page (1-1000, default: 1000)
- `cursor` (optional): Cursor for pagination

**Example:**

```bash
GET https://coreblockchain.net/.well-known/tokens.json?prefix=cb&limit=50
```

#### `GET https://coreblockchain.net/.well-known/tokens/:network/tokens.json`

Lists all registered tokens from a specific network with pagination support.

**Parameters:**

- `network`: The network identifier (e.g., `xcb`, `xab`, `testnet`)

**Query Parameters:**

- `prefix` (optional): Filter tokens by address prefix
- `limit` (optional): Number of tokens per page (1-1000, default: 1000)
- `cursor` (optional): Cursor for pagination

**Examples:**

```bash
GET https://coreblockchain.net/.well-known/tokens/xcb/tokens.json?prefix=cb&limit=50
GET https://coreblockchain.net/.well-known/tokens/testnet/tokens.json
GET https://coreblockchain.net/.well-known/tokens/xab/tokens.json
```

**Response:**

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
  "ticker": "CTN",
  "name": "CoreToken",
  "decimals": 18,
  "symbol": "Ƈ",
  "type": "CBC20",
  "url": "https://coretoken.net",
  "creation": "2023-11-17T17:23:50.000Z",
  "logos": [
    {
      "size": 16,
      "type": "image/svg+xml",
      "url": "https://corecdn.info/mark/16/coretoken.svg"
    },
    {
      "size": 32,
      "type": "image/svg+xml",
      "url": "https://corecdn.info/mark/32/coretoken.svg"
    },
    {
      "size": 48,
      "type": "image/svg+xml",
      "url": "https://corecdn.info/mark/48/coretoken.svg"
    },
    {
      "size": 64,
      "type": "image/svg+xml",
      "url": "https://corecdn.info/mark/64/coretoken.svg"
    },
    {
      "size": 128,
      "type": "image/svg+xml",
      "url": "https://corecdn.info/mark/128/coretoken.svg"
    },
    {
      "size": 256,
      "type": "image/svg+xml",
      "url": "https://corecdn.info/mark/256/coretoken.svg"
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request`: Invalid token address format
- `404 Not Found`: Token not found in registry
- `500 Internal Server Error`: Error retrieving token data

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

The registry uses separate KV storage namespaces:

- `KV_WELL_KNOWN_REGISTRY`: Main network (XCB) tokens
- `KV_WELL_KNOWN_REGISTRY_TESTNET`: Test network (XAB) tokens

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
