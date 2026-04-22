import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { waitlistSignups } from "../db/schema.js";
import { logger } from "../logger.js";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  source: z.string().max(64).optional(),
  referrer: z.string().max(512).optional(),
});

// Simple in-memory IP rate limiter: 5 requests / 60s per IP.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const prev = hits.get(ip) ?? [];
  const kept = prev.filter((t) => t > windowStart);
  if (kept.length >= MAX_PER_WINDOW) {
    hits.set(ip, kept);
    return true;
  }
  kept.push(now);
  hits.set(ip, kept);
  return false;
}

export const waitlistRouter = Router();

waitlistRouter.post("/", async (req: Request, res: Response) => {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0] ||
    req.ip ||
    "unknown";

  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in a minute." });
  }

  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    await db
      .insert(waitlistSignups)
      .values({
        email: parsed.data.email,
        source: parsed.data.source ?? null,
        referrer: parsed.data.referrer ?? null,
        createdAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: waitlistSignups.email,
        set: { createdAt: sql`excluded.created_at` },
      });
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err: (err as Error).message }, "waitlist insert failed");
    return res.status(500).json({ error: "Could not save signup" });
  }
});
