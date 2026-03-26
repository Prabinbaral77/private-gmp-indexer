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
