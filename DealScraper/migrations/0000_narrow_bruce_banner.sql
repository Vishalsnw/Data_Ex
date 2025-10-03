CREATE TABLE "deals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"platform" text NOT NULL,
	"category" text NOT NULL,
	"original_price" integer NOT NULL,
	"discounted_price" integer NOT NULL,
	"discount_percentage" integer NOT NULL,
	"image_url" text,
	"deal_url" text NOT NULL,
	"expires_at" timestamp,
	"scraped_at" timestamp DEFAULT now()
);
