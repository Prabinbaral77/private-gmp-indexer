CREATE TABLE "scanned_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"block_height" integer NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scanned_blocks_block_height_unique" UNIQUE("block_height")
);

CREATE TABLE "error_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"block_height" integer NOT NULL,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "error_blocks_block_height_unique" UNIQUE("block_height")
);
