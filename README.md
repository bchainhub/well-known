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
    "environment": "prod"
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

Lists all registered tokens with pagination support.

**Query Parameters:**

- `prefix` (optional): Filter tokens by address prefix
- `limit` (optional): Number of tokens per page (1-100, default: 100)
- `cursor` (optional): Cursor for pagination

**Example:**

```bash
GET https://coreblockchain.net/.well-known/tokens.json?prefix=cb&limit=50
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

Retrieves detailed information for a specific token.

**Parameters:**

- `token`: The token address (without .json extension)

**Example:**

```bash
GET https://coreblockchain.net/.well-known/tokens/cb19c7acc4c292d2943ba23c2eaa5d9c5a6652a8710c.json
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

## Token Validation

All token addresses are validated using the `blockchain-wallet-validator` library to ensure they are valid wallet addresses for the appropriate network:

- **Production**: XCB network validation
- **Development**: XAB network validation (testnet)

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
