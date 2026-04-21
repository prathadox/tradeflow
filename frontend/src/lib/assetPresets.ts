export interface AssetPreset {
  id: string;
  label: string;
  code: string;
  issuer: string;
  network: "testnet" | "public" | "any";
  binance: boolean;
  note?: string;
}

export const ASSET_PRESETS: AssetPreset[] = [
  {
    id: "xlm-native",
    label: "XLM · native",
    code: "XLM",
    issuer: "",
    network: "any",
    binance: true,
  },
  {
    id: "usdc-testnet",
    label: "USDC · Circle (Testnet)",
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    network: "testnet",
    binance: true,
  },
  {
    id: "usdc-mainnet",
    label: "USDC · Circle (Mainnet)",
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    network: "public",
    binance: true,
  },
  {
    id: "eurc-mainnet",
    label: "EURC · Circle (Mainnet)",
    code: "EURC",
    issuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2",
    network: "public",
    binance: false,
    note: "Stellar-only; no Binance ticker",
  },
  {
    id: "aqua-mainnet",
    label: "AQUA · Aquarius (Mainnet)",
    code: "AQUA",
    issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    network: "public",
    binance: false,
    note: "Stellar-only; no Binance ticker",
  },
  {
    id: "yxlm-mainnet",
    label: "yXLM · UltraStellar (Mainnet)",
    code: "yXLM",
    issuer: "GARDNV3Q7YGT4AKSDF25LT32YSCCW2EV4OKMLIUWO5B4FVU2ORCM7VPS",
    network: "public",
    binance: false,
    note: "Stellar-only; no Binance ticker",
  },
];

export function findPresetMatch(
  code: string,
  issuer: string
): AssetPreset | null {
  const normCode = code.trim().toUpperCase();
  const normIssuer = issuer.trim();
  if (!normCode) return null;
  for (const p of ASSET_PRESETS) {
    if (p.code.toUpperCase() !== normCode) continue;
    if (p.issuer === normIssuer) return p;
  }
  return null;
}

export function presetsForNetwork(
  network: "TESTNET" | "PUBLIC" | null
): AssetPreset[] {
  if (!network) return ASSET_PRESETS;
  const want = network === "PUBLIC" ? "public" : "testnet";
  return ASSET_PRESETS.filter((p) => p.network === "any" || p.network === want);
}

// Pairs with both a Stellar DEX orderbook and a Binance ticker — usable by
// the arbitrage strategy without any custom wiring. The backend's
// pairToBinanceSymbol already translates the quote side (USDC→USDT).
export interface PairPreset {
  value: string;
  label: string;
}

export const PAIR_PRESETS: PairPreset[] = [
  { value: "XLM/USDC", label: "XLM / USDC" },
  { value: "BTC/USDC", label: "BTC / USDC" },
  { value: "ETH/USDC", label: "ETH / USDC" },
  { value: "XLM/USDT", label: "XLM / USDT" },
  { value: "BTC/USDT", label: "BTC / USDT" },
  { value: "ETH/USDT", label: "ETH / USDT" },
];
