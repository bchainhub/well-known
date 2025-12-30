/**
 * Removes null, undefined, and false values from an object
 * Specifically handles:
 * - testnet: only included if true
 * - chainId, expiration, and other optional fields: only included if not null/undefined
 */
export function cleanTokenData(tokenData: any): any {
	const cleaned: any = {};

	// Always include required fields
	if (tokenData.blockchain !== undefined && tokenData.blockchain !== null) {
		cleaned.blockchain = tokenData.blockchain;
	}
	if (tokenData.network !== undefined && tokenData.network !== null) {
		cleaned.network = tokenData.network;
	}
	if (tokenData.address !== undefined && tokenData.address !== null) {
		cleaned.address = tokenData.address;
	}
	if (tokenData.ticker !== undefined && tokenData.ticker !== null) {
		cleaned.ticker = tokenData.ticker;
	}
	if (tokenData.name !== undefined && tokenData.name !== null) {
		cleaned.name = tokenData.name;
	}
	if (tokenData.symbol !== undefined && tokenData.symbol !== null) {
		cleaned.symbol = tokenData.symbol;
	}
	if (tokenData.type !== undefined && tokenData.type !== null) {
		cleaned.type = tokenData.type;
	}
	if (tokenData.decimals !== undefined && tokenData.decimals !== null) {
		cleaned.decimals = tokenData.decimals;
	}

	// Optional fields - only include if not null/undefined
	if (tokenData.chainId !== undefined && tokenData.chainId !== null) {
		cleaned.chainId = tokenData.chainId;
	}
	if (tokenData.genesis !== undefined && tokenData.genesis !== null) {
		cleaned.genesis = tokenData.genesis;
	}
	if (tokenData.expiration !== undefined && tokenData.expiration !== null) {
		cleaned.expiration = tokenData.expiration;
	}
	if (tokenData.altSymbol !== undefined && tokenData.altSymbol !== null) {
		cleaned.altSymbol = tokenData.altSymbol;
	}
	if (tokenData.flag !== undefined && tokenData.flag !== null) {
		cleaned.flag = tokenData.flag;
	}
	if (tokenData.totalSupply !== undefined && tokenData.totalSupply !== null) {
		cleaned.totalSupply = tokenData.totalSupply;
	}
	if (tokenData.url !== undefined && tokenData.url !== null) {
		cleaned.url = tokenData.url;
	}

	// testnet: only include if true
	if (tokenData.testnet === true) {
		cleaned.testnet = true;
	}

	// altCounting: only include if true
	if (tokenData.altCounting === true) {
		cleaned.altCounting = true;
	}

	// categories: include if it exists (even if empty array)
	if (tokenData.categories !== undefined) {
		cleaned.categories = tokenData.categories;
	}

	// logos: include if it exists (even if empty object)
	if (tokenData.logos !== undefined) {
		cleaned.logos = tokenData.logos;
	}

	return cleaned;
}

