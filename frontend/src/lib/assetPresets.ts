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
  id: string;
  label: string;
  baseCode: string;
  quoteCode: string;
}

export const PAIR_PRESETS: PairPreset[] = [
  { id: "xlm-usdc", label: "XLM / USDC", baseCode: "XLM", quoteCode: "USDC" },
];

function findIssuerForCode(
  code: string,
  network: "TESTNET" | "PUBLIC" | null
): string {
  const want = network === "PUBLIC" ? "public" : "testnet";
  const upper = code.toUpperCase();
  if (upper === "XLM" || upper === "NATIVE") return "";
  const candidates = ASSET_PRESETS.filter(
    (p) => p.code.toUpperCase() === upper
  );
  const preferred =
    candidates.find((p) => p.network === want) ??
    candidates.find((p) => p.network === "any") ??
    candidates[0];
  return preferred?.issuer ?? "";
}

function token(code: string, issuer: string): string {
  const upper = code.toUpperCase();
  if (upper === "XLM" || upper === "NATIVE") return "XLM";
  if (!issuer) return code;
  return `${code}:${issuer}`;
}

// Turn a PairPreset into a backend-ready pair string, filling in the
// correct issuer for the connected wallet network. Defaults to testnet
// when no wallet is connected.
export function resolvePairPreset(
  preset: PairPreset,
  network: "TESTNET" | "PUBLIC" | null
): string {
  const baseIssuer = findIssuerForCode(preset.baseCode, network);
  const quoteIssuer = findIssuerForCode(preset.quoteCode, network);
  return `${token(preset.baseCode, baseIssuer)}/${token(
    preset.quoteCode,
    quoteIssuer
  )}`;
}

// Reverse mapping: given an already-resolved pair string, find the matching
// preset (if any). Used to highlight the active preset in the dropdown.
export function findPairPresetMatch(pair: string): PairPreset | null {
  if (!pair) return null;
  const [baseRaw, quoteRaw] = pair.split("/");
  if (!baseRaw || !quoteRaw) return null;
  const baseCode = baseRaw.split(":")[0].trim().toUpperCase();
  const quoteCode = quoteRaw.split(":")[0].trim().toUpperCase();
  return (
    PAIR_PRESETS.find(
      (p) =>
        p.baseCode.toUpperCase() === baseCode &&
        p.quoteCode.toUpperCase() === quoteCode
    ) ?? null
  );
}
