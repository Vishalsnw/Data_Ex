import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapingService } from "./services/scraper";
import { dealFiltersSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get deals with filtering and pagination
  app.get("/api/deals", async (req, res) => {
    try {
      const filters = dealFiltersSchema.parse(req.query);
      const result = await storage.getDeals(filters);
      res.json(result);
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid filters", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get deal statistics
  app.get("/api/deals/stats", async (req, res) => {
    try {
      const stats = await storage.getDealStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get deal statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get single deal by ID
  app.get("/api/deals/:id", async (req, res) => {
    try {
      const deal = await storage.getDealById(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get deal",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Refresh deals - trigger scraping
  app.post("/api/deals/refresh", async (req, res) => {
    try {
      await scrapingService.scrapeAllPlatforms();
      const stats = await storage.getDealStats();
      res.json({ 
        message: "Deals refreshed successfully", 
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to refresh deals",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Clear expired deals
  app.delete("/api/deals/expired", async (req, res) => {
    try {
      const cleared = await storage.clearExpiredDeals();
      res.json({ message: `Cleared ${cleared} expired deals` });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to clear expired deals",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
