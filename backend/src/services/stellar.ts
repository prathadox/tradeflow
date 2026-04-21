import {
  Asset,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { config } from "../config.js";

export const networkPassphrase =
  config.STELLAR_NETWORK === "public" ? Networks.PUBLIC : Networks.TESTNET;

export const server = new Horizon.Server(config.HORIZON_URL);

export function parsePair(pair: string): { base: Asset; quote: Asset } {
  const [rawBase, rawQuote] = pair.split("/");
  if (!rawBase || !rawQuote) {
    throw new Error(`Invalid pair: "${pair}" — expected "BASE/QUOTE"`);
  }
  return { base: parseAsset(rawBase.trim()), quote: parseAsset(rawQuote.trim()) };
}

export function parseAsset(token: string): Asset {
  const [code, issuer] = token.split(":");
  const upper = code.toUpperCase();
  if (upper === "XLM" || upper === "NATIVE") {
    return Asset.native();
  }
  if (!issuer) {
    throw new Error(
      `Asset "${code}" requires an issuer (format "${code}:G..."); none provided`
    );
  }
  return new Asset(code, issuer);
}

export interface OrderbookQuote {
  bestAsk: number | null;
  bestBid: number | null;
}

export async function getOrderbook({
  selling,
  buying,
}: {
  selling: Asset;
  buying: Asset;
}): Promise<OrderbookQuote> {
  const book = await server.orderbook(selling, buying).call();
  const bestAsk = book.asks?.[0]?.price ? Number(book.asks[0].price) : null;
  const bestBid = book.bids?.[0]?.price ? Number(book.bids[0].price) : null;
  return { bestAsk, bestBid };
}

export async function placeBuyOffer({
  selling,
  buying,
  amount,
  price,
  keypair,
}: {
  selling: Asset;
  buying: Asset;
  amount: string;
  price: string;
  keypair: Keypair;
}): Promise<string> {
  const account = await server.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.manageBuyOffer({
        selling,
        buying,
        buyAmount: amount,
        price,
      })
    )
    .setTimeout(30)
    .build();
  tx.sign(keypair);
  const result = await server.submitTransaction(tx);
  return result.hash;
}

export function keypairFromSecret(secret: string): Keypair {
  return Keypair.fromSecret(secret);
}
