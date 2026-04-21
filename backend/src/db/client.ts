import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "../config.js";
import { logger } from "../logger.js";
import * as schema from "./schema.js";

const queryClient = postgres(config.DATABASE_URL, {
  prepare: false,
  max: 10,
});

export const db = drizzle(queryClient, { schema });
export const rawSql = queryClient;

export async function pingDb(): Promise<void> {
  try {
    await queryClient`select 1`;
    logger.info("database reachable");
  } catch (err) {
    logger.error({ err: (err as Error).message }, "database ping failed");
    throw err;
  }
}
