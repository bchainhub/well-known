// Network utility functions

// Testnet network prefixes
const TESTNET_PREFIXES = ['xab', 'tbtc', 'tltc', 'bchtest', 'teth', 'tsol', 'txmr', 'tdot'];

/**
 * Determines if a network is a testnet based on its prefix
 */
export function isTestnetNetwork(network: string | null | undefined): boolean {
	if (!network) {
		return false;
	}
	const normalizedNetwork = network.toLowerCase();
	return TESTNET_PREFIXES.includes(normalizedNetwork) || normalizedNetwork === 'testnet';
}

/**
 * Normalizes network name
 */
export function normalizeNetwork(network: string | null | undefined, defaultNetwork: string = 'xcb'): string {
	if (!network) {
		return defaultNetwork;
	}
	return network.toLowerCase();
}
