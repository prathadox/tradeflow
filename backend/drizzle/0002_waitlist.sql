CREATE TABLE IF NOT EXISTS "waitlist_signups" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "source" text,
  "referrer" text,
  "created_at" bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS "waitlist_signups_created_at_idx"
  ON "waitlist_signups" ("created_at");
