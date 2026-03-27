CREATE TABLE "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_hash" text NOT NULL,
	"encrypted_record" text NOT NULL,
	"commitment_hash" text NOT NULL,
	"program_id" text,
	"transition_type" text NOT NULL,
	"network" text NOT NULL,
	"is_spent" boolean DEFAULT false NOT NULL,
	"block_height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "records_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE "error_blocks" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"block_height" integer NOT NULL,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scanned_blocks" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"block_height" integer NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL
);
