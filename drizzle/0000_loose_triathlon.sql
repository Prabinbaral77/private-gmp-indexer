CREATE TABLE "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_hash" text NOT NULL,
	"encrypted_record" text NOT NULL,
	"commitment_hash" text NOT NULL,
	"program_id" text,
	"transition_type" text NOT NULL,
	"network" text NOT NULL,
	"is_spent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "records_tx_hash_unique" UNIQUE("tx_hash")
);
