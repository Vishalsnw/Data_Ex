import { type Deal, type InsertDeal, type DealFilters, deals } from "@shared/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDeals(filters?: DealFilters): Promise<{ deals: Deal[]; total: number }>;
  getDealById(id: string): Promise<Deal | undefined>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<boolean>;
  clearExpiredDeals(): Promise<number>;
  getDealStats(): Promise<{
    totalDeals: number;
    avgDiscount: number;
    bestDiscount: number;
    platforms: number;
  }>;
}

class PostgresStorage implements IStorage {
  private db: any;
  private dbPromise: Promise<any>;

  constructor() {
    this.dbPromise = import("./db").then((module) => {
      this.db = module.db;
      return this.db;
    });
  }
  
  private async ensureDb() {
    if (!this.db) {
      await this.dbPromise;
    }
    return this.db;
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const db = await this.ensureDb();
    const [deal] = await db.insert(deals).values(insertDeal).returning();
    return deal;
  }

  async getDeals(filters?: DealFilters): Promise<{ deals: Deal[]; total: number }> {
    const db = await this.ensureDb();
    const now = new Date();
    const conditions = [];

    conditions.push(
      sql`(${deals.expiresAt} IS NULL OR ${deals.expiresAt} > ${now})`
    );

    if (filters?.platforms && filters.platforms.length > 0) {
      conditions.push(sql`${deals.platform} = ANY(${filters.platforms})`);
    }

    if (filters?.categories && filters.categories.length > 0) {
      conditions.push(sql`${deals.category} = ANY(${filters.categories})`);
    }

    if (filters?.minDiscount) {
      conditions.push(gte(deals.discountPercentage, filters.minDiscount));
    }

    if (filters?.minPrice) {
      conditions.push(gte(deals.discountedPrice, filters.minPrice));
    }

    if (filters?.maxPrice) {
      conditions.push(lte(deals.discountedPrice, filters.maxPrice));
    }

    let query = db.select().from(deals).where(and(...conditions));

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case "discount_desc":
          query = query.orderBy(desc(deals.discountPercentage));
          break;
        case "discount_asc":
          query = query.orderBy(asc(deals.discountPercentage));
          break;
        case "price_asc":
          query = query.orderBy(asc(deals.discountedPrice));
          break;
        case "price_desc":
          query = query.orderBy(desc(deals.discountedPrice));
          break;
        case "platform":
          query = query.orderBy(asc(deals.platform));
          break;
        case "newest":
          query = query.orderBy(desc(deals.scrapedAt));
          break;
      }
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const [dealsResult, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(deals).where(and(...conditions))
    ]);

    return {
      deals: dealsResult,
      total: totalResult[0]?.count || 0
    };
  }

  async getDealById(id: string): Promise<Deal | undefined> {
    const db = await this.ensureDb();
    const [deal] = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
    return deal;
  }

  async updateDeal(id: string, updateData: Partial<InsertDeal>): Promise<Deal | undefined> {
    const db = await this.ensureDb();
    const [updated] = await db
      .update(deals)
      .set(updateData)
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  async deleteDeal(id: string): Promise<boolean> {
    const db = await this.ensureDb();
    const result = await db.delete(deals).where(eq(deals.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async clearExpiredDeals(): Promise<number> {
    const db = await this.ensureDb();
    const now = new Date();
    const result = await db
      .delete(deals)
      .where(
        and(
          sql`${deals.expiresAt} IS NOT NULL`,
          lte(deals.expiresAt, now)
        )
      );
    return result.rowCount || 0;
  }

  async getDealStats(): Promise<{
    totalDeals: number;
    avgDiscount: number;
    bestDiscount: number;
    platforms: number;
  }> {
    const db = await this.ensureDb();
    const now = new Date();
    
    const [stats] = await db
      .select({
        totalDeals: sql<number>`count(*)::int`,
        avgDiscount: sql<number>`COALESCE(round(avg(${deals.discountPercentage})), 0)::int`,
        bestDiscount: sql<number>`COALESCE(max(${deals.discountPercentage}), 0)::int`,
        platforms: sql<number>`count(DISTINCT ${deals.platform})::int`
      })
      .from(deals)
      .where(
        sql`(${deals.expiresAt} IS NULL OR ${deals.expiresAt} > ${now})`
      );

    return stats || { totalDeals: 0, avgDiscount: 0, bestDiscount: 0, platforms: 0 };
  }
}

class MemStorage implements IStorage {
  private deals: Map<string, Deal>;

  constructor() {
    this.deals = new Map();
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = randomUUID();
    const deal: Deal = { 
      ...insertDeal,
      imageUrl: insertDeal.imageUrl ?? null,
      expiresAt: insertDeal.expiresAt ? (insertDeal.expiresAt instanceof Date ? insertDeal.expiresAt : new Date(insertDeal.expiresAt)) : null,
      id, 
      scrapedAt: new Date()
    };
    this.deals.set(id, deal);
    return deal;
  }

  async getDeals(filters?: DealFilters): Promise<{ deals: Deal[]; total: number }> {
    let deals = Array.from(this.deals.values());
    
    const now = new Date();
    deals = deals.filter(deal => !deal.expiresAt || deal.expiresAt > now);
    
    if (filters) {
      if (filters.platforms && filters.platforms.length > 0) {
        deals = deals.filter(deal => filters.platforms!.includes(deal.platform));
      }
      
      if (filters.categories && filters.categories.length > 0) {
        deals = deals.filter(deal => filters.categories!.includes(deal.category));
      }
      
      if (filters.minDiscount) {
        deals = deals.filter(deal => deal.discountPercentage >= filters.minDiscount!);
      }
      
      if (filters.minPrice) {
        deals = deals.filter(deal => deal.discountedPrice >= filters.minPrice!);
      }
      
      if (filters.maxPrice) {
        deals = deals.filter(deal => deal.discountedPrice <= filters.maxPrice!);
      }
      
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case "discount_desc":
            deals.sort((a, b) => b.discountPercentage - a.discountPercentage);
            break;
          case "discount_asc":
            deals.sort((a, b) => a.discountPercentage - b.discountPercentage);
            break;
          case "price_asc":
            deals.sort((a, b) => a.discountedPrice - b.discountedPrice);
            break;
          case "price_desc":
            deals.sort((a, b) => b.discountedPrice - a.discountedPrice);
            break;
          case "platform":
            deals.sort((a, b) => a.platform.localeCompare(b.platform));
            break;
          case "newest":
            deals.sort((a, b) => (b.scrapedAt?.getTime() || 0) - (a.scrapedAt?.getTime() || 0));
            break;
        }
      }
    }
    
    const total = deals.length;
    
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const start = (page - 1) * limit;
    const paginatedDeals = deals.slice(start, start + limit);
    
    return { deals: paginatedDeals, total };
  }

  async getDealById(id: string): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async updateDeal(id: string, updateData: Partial<InsertDeal>): Promise<Deal | undefined> {
    const existing = this.deals.get(id);
    if (!existing) return undefined;
    
    const updated: Deal = { ...existing, ...updateData };
    this.deals.set(id, updated);
    return updated;
  }

  async deleteDeal(id: string): Promise<boolean> {
    return this.deals.delete(id);
  }

  async clearExpiredDeals(): Promise<number> {
    const now = new Date();
    let cleared = 0;
    
    const entries = Array.from(this.deals.entries());
    for (const [id, deal] of entries) {
      if (deal.expiresAt && deal.expiresAt <= now) {
        this.deals.delete(id);
        cleared++;
      }
    }
    
    return cleared;
  }

  async getDealStats(): Promise<{
    totalDeals: number;
    avgDiscount: number;
    bestDiscount: number;
    platforms: number;
  }> {
    const deals = Array.from(this.deals.values());
    const activeDeals = deals.filter(deal => !deal.expiresAt || deal.expiresAt > new Date());
    
    const totalDeals = activeDeals.length;
    const avgDiscount = totalDeals > 0 
      ? Math.round(activeDeals.reduce((sum, deal) => sum + deal.discountPercentage, 0) / totalDeals)
      : 0;
    const bestDiscount = totalDeals > 0
      ? Math.max(...activeDeals.map(deal => deal.discountPercentage))
      : 0;
    const platforms = new Set(activeDeals.map(deal => deal.platform)).size;
    
    return { totalDeals, avgDiscount, bestDiscount, platforms };
  }
}

function createStorage(): IStorage {
  const dbUrl = process.env.DATABASE_URL;
  console.log("Initializing storage. DATABASE_URL:", dbUrl ? `${dbUrl.substring(0, 20)}...` : "not set");
  
  if (dbUrl && !dbUrl.includes("placeholder") && dbUrl.startsWith("postgresql://") && dbUrl.length > 20) {
    console.log("Using PostgreSQL storage");
    return new PostgresStorage();
  } else {
    console.log("Using in-memory storage");
    return new MemStorage();
  }
}

export const storage: IStorage = createStorage();
