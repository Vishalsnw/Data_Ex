import { type InsertDeal } from "@shared/schema";
import { storage } from "../storage";
import { spawn } from "child_process";
import path from "path";

export class ScrapingService {
  private isRunning = false;
  
  async scrapeAllPlatforms(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Scraping is already in progress");
    }
    
    this.isRunning = true;
    try {
      console.log('Starting deal scraping...');
      
      const cleared = await storage.clearExpiredDeals();
      console.log(`Cleared ${cleared} expired deals`);
      
      const results = await Promise.allSettled([
        this.scrapePlatform('amazon'),
        this.scrapePlatform('flipkart'),
        this.scrapePlatform('myntra'),
        this.scrapePlatform('meesho'),
      ]);
      
      let totalScraped = 0;
      const platforms = ['Amazon', 'Flipkart', 'Myntra', 'Meesho'];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalScraped += result.value;
          console.log(`${platforms[index]}: Scraped ${result.value} deals`);
        } else {
          console.error(`${platforms[index]}: Failed -`, result.reason?.message || result.reason);
        }
      });
      
      console.log(`Total scraped: ${totalScraped} deals`);
      
      if (totalScraped === 0) {
        throw new Error('Failed to scrape any deals from any platform');
      }
    } finally {
      this.isRunning = false;
    }
  }
  
  private async scrapePlatform(platform: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'scripts', `scrape_${platform}.py`);
      
      const pythonProcess = spawn('python3', [scriptPath]);
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          console.error(`${platform} scraper error:`, stderr);
          resolve(0);
          return;
        }
        
        try {
          const deals: InsertDeal[] = JSON.parse(stdout);
          
          let count = 0;
          for (const deal of deals) {
            if (deal.discountPercentage >= 20) {
              await storage.createDeal(deal);
              count++;
            }
          }
          
          resolve(count);
        } catch (error) {
          console.error(`${platform} parse error:`, error);
          console.error('stdout:', stdout);
          resolve(0);
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error(`${platform} spawn error:`, error);
        resolve(0);
      });
    });
  }
}

export const scrapingService = new ScrapingService();
