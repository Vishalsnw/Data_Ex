import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  platform: text("platform").notNull(), // amazon, flipkart, myntra, meesho
  category: text("category").notNull(),
  originalPrice: integer("original_price").notNull(),
  discountedPrice: integer("discounted_price").notNull(),
  discountPercentage: integer("discount_percentage").notNull(),
  imageUrl: text("image_url"),
  dealUrl: text("deal_url").notNull(),
  expiresAt: timestamp("expires_at"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  scrapedAt: true,
});

export const dealFiltersSchema = z.object({
  platforms: z.union([z.string(), z.array(z.string())]).optional().transform(val => 
    val ? (Array.isArray(val) ? val : [val]) : undefined
  ),
  categories: z.union([z.string(), z.array(z.string())]).optional().transform(val => 
    val ? (Array.isArray(val) ? val : [val]) : undefined
  ),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["discount_desc", "discount_asc", "price_asc", "price_desc", "platform", "newest"]).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type DealFilters = z.infer<typeof dealFiltersSchema>;

export const platforms = ["amazon", "flipkart", "myntra", "meesho"] as const;
export const categories = [
  "electronics",
  "fashion", 
  "home",
  "beauty",
  "sports",
  "books"
] as const;
