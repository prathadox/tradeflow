import type { Keypair } from "@stellar/stellar-sdk";
import type { Logger } from "pino";
import {
  getOrderbook,
  parsePair,
  placeBuyOffer,
} from "../services/stellar.js";
import { getTicker, pairToBinanceSymbol } from "../services/binance.js";

export interface ArbitrageParams {
  pair: string;
  threshold: number;
  feeBps?: number;
  slippageBps?: number;
  dryRun?: boolean;
  notional?: number;
}

export interface ArbitrageEvent {
  kind: "tick" | "decision" | "error" | "info";
  message: string;
  data?: Record<string, unknown>;
}

export interface ArbitrageContext {
  logger: Logger;
  keypair?: Keypair;
  onEvent?: (event: ArbitrageEvent) => void;
}

export async function runArbitrageTick(
  params: ArbitrageParams,
  ctx: ArbitrageContext
): Promise<void> {
  const {
    pair,
    threshold,
    feeBps = 10,
    slippageBps = 20,
    dryRun = true,
    notional = 100,
  } = params;
  const { logger } = ctx;
  const emit = (event: ArbitrageEvent) => ctx.onEvent?.(event);

  try {
    const { base, quote } = parsePair(pair);
    const symbol = pairToBinanceSymbol(pair);

    emit({ kind: "tick", message: `Checking arbitrage for ${pair}`, data: { pair } });

    const [book, binancePrice] = await Promise.all([
      getOrderbook({ selling: base, buying: quote }),
      getTicker(symbol),
    ]);

    if (book.bestAsk === null || book.bestBid === null) {
      logger.info(
        {
          pair,
          stellarBestAsk: book.bestAsk,
          stellarBestBid: book.bestBid,
          binancePrice,
          decision: "skip_empty_book",
        },
        "arbitrage tick: empty orderbook side"
      );
      emit({
        kind: "decision",
        message: "Empty orderbook side — skipping",
        data: { pair, bestAsk: book.bestAsk, bestBid: book.bestBid, binancePrice },
      });
      return;
    }

    const costBps = (feeBps + slippageBps) / 10_000;
    const buyStellarEdgeRaw = (binancePrice - book.bestAsk) / book.bestAsk;
    const sellStellarEdgeRaw = (book.bestBid - binancePrice) / binancePrice;
    const buyStellarNet = buyStellarEdgeRaw - costBps;
    const sellStellarNet = sellStellarEdgeRaw - costBps;

    const best =
      buyStellarNet >= sellStellarNet
        ? { direction: "buy_stellar_sell_binance" as const, edge: buyStellarNet }
        : { direction: "sell_stellar_buy_binance" as const, edge: sellStellarNet };

    const baseLog = {
      pair,
      stellarBestAsk: book.bestAsk,
      stellarBestBid: book.bestBid,
      binancePrice,
      buyStellarNet,
      sellStellarNet,
      threshold,
      direction: best.direction,
    };

    if (best.edge < threshold) {
      logger.info(
        { ...baseLog, decision: "no_opportunity", edge: best.edge },
        "arbitrage tick: no opportunity"
      );
      emit({
        kind: "decision",
        message: `No opportunity — net edge ${best.edge.toFixed(4)} < threshold ${threshold}`,
        data: { ...baseLog, edge: best.edge },
      });
      return;
    }

    if (dryRun) {
      logger.info(
        {
          ...baseLog,
          decision: "would_trade",
          wouldTrade: true,
          edge: best.edge,
          notional,
        },
        "arbitrage tick: dryRun would trade"
      );
      emit({
        kind: "decision",
        message: `Spread detected: +${best.edge.toFixed(4)} (> ${threshold}) — Trade would execute (dryRun)`,
        data: { ...baseLog, edge: best.edge, notional },
      });
      return;
    }

    if (!ctx.keypair) {
      throw new Error("No session keypair — authorize a session before live trading");
    }
    if (best.direction !== "buy_stellar_sell_binance") {
      logger.info(
        { ...baseLog, decision: "skip_unsupported_direction", edge: best.edge },
        "arbitrage tick: only buy-on-stellar direction is submitted"
      );
      emit({
        kind: "decision",
        message: "Skipping unsupported direction (sell on Stellar)",
        data: { direction: best.direction, edge: best.edge },
      });
      return;
    }
    const amount = (notional / book.bestAsk).toFixed(7);
    const price = book.bestAsk.toFixed(7);
    const hash = await placeBuyOffer({
      selling: quote,
      buying: base,
      amount,
      price,
      keypair: ctx.keypair,
    });
    logger.info(
      {
        ...baseLog,
        decision: "submitted",
        edge: best.edge,
        notional,
        amount,
        price,
        txHash: hash,
      },
      "arbitrage tick: offer submitted"
    );
    emit({
      kind: "decision",
      message: `Trade executed · tx: ${hash.slice(0, 8)}…`,
      data: { edge: best.edge, notional, amount, price, txHash: hash },
    });
  } catch (err) {
    const e = err as Error & {
      response?: { data?: { extras?: unknown; title?: string } };
    };
    ctx.logger.error(
      {
        pair: params.pair,
        err: e.message,
        extras: e.response?.data?.extras,
        title: e.response?.data?.title,
      },
      "arbitrage tick: error"
    );
    emit({
      kind: "error",
      message: `Error: ${e.message}`,
      data: { title: e.response?.data?.title },
    });
  }
}
