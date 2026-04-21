import { config } from "../config.js";

const PAIR_TO_SYMBOL: Record<string, string> = {
  "XLM/USDC": "XLMUSDT",
  "XLM/USDT": "XLMUSDT",
  "BTC/USDC": "BTCUSDT",
  "BTC/USDT": "BTCUSDT",
  "ETH/USDC": "ETHUSDT",
  "ETH/USDT": "ETHUSDT",
};

export function pairToBinanceSymbol(pair: string): string {
  const [baseRaw, quoteRaw] = pair.split("/");
  if (!baseRaw || !quoteRaw) {
    throw new Error(`Cannot map pair "${pair}" to a Binance symbol`);
  }
  const base = baseRaw.split(":")[0].trim().toUpperCase();
  const quote = quoteRaw.split(":")[0].trim().toUpperCase();
  const key = `${base}/${quote}`;
  const mapped = PAIR_TO_SYMBOL[key];
  if (mapped) return mapped;
  const mappedQuote = quote === "USDC" ? "USDT" : quote;
  return `${base}${mappedQuote}`;
}

export async function getTicker(symbol: string): Promise<number> {
  const url = `${config.BINANCE_API_URL}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Binance ticker ${symbol} failed: HTTP ${res.status}`);
  }
  const body = (await res.json()) as { price?: string };
  if (!body?.price) {
    throw new Error(`Binance ticker ${symbol} returned no price`);
  }
  const n = Number(body.price);
  if (!Number.isFinite(n)) {
    throw new Error(`Binance ticker ${symbol} returned non-numeric price`);
  }
  return n;
}
