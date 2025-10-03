import { type Deal, type InsertDeal, type DealFilters } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Deal operations
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

export class MemStorage implements IStorage {
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
    
    // Filter expired deals
    const now = new Date();
    deals = deals.filter(deal => !deal.expiresAt || deal.expiresAt > now);
    
    if (filters) {
      // Filter by platforms
      if (filters.platforms && filters.platforms.length > 0) {
        deals = deals.filter(deal => filters.platforms!.includes(deal.platform));
      }
      
      // Filter by categories
      if (filters.categories && filters.categories.length > 0) {
        deals = deals.filter(deal => filters.categories!.includes(deal.category));
      }
      
      // Filter by minimum discount
      if (filters.minDiscount) {
        deals = deals.filter(deal => deal.discountPercentage >= filters.minDiscount!);
      }
      
      // Filter by price range
      if (filters.minPrice) {
        deals = deals.filter(deal => deal.discountedPrice >= filters.minPrice!);
      }
      
      if (filters.maxPrice) {
        deals = deals.filter(deal => deal.discountedPrice <= filters.maxPrice!);
      }
      
      // Sort deals
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
    
    // Pagination
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

export const storage = new MemStorage();
