import "dotenv/config";

type StellarNetwork = "testnet" | "public";

const network = (process.env.STELLAR_NETWORK ?? "testnet") as StellarNetwork;
if (network !== "testnet" && network !== "public") {
  throw new Error(`Invalid STELLAR_NETWORK: ${network}`);
}

const defaultHorizon =
  network === "testnet"
    ? "https://horizon-testnet.stellar.org"
    : "https://horizon.stellar.org";

const networkPassphrase =
  network === "testnet"
    ? "Test SDF Network ; September 2015"
    : "Public Global Stellar Network ; September 2015";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required (e.g. Supabase connection pooler URL, postgres://...)"
  );
}

const sessionEncryptionKey = process.env.SESSION_ENCRYPTION_KEY;
if (!sessionEncryptionKey || sessionEncryptionKey.length < 32) {
  throw new Error(
    "SESSION_ENCRYPTION_KEY must be set and at least 32 chars (used as AES-GCM key material)"
  );
}

export const config = {
  PORT: Number(process.env.PORT ?? 3001),
  STELLAR_NETWORK: network,
  HORIZON_URL: process.env.HORIZON_URL ?? defaultHorizon,
  NETWORK_PASSPHRASE: networkPassphrase,
  BINANCE_API_URL: process.env.BINANCE_API_URL ?? "https://api.binance.com",
  DATABASE_URL: databaseUrl,
  SESSION_ENCRYPTION_KEY: sessionEncryptionKey,
} as const;
