import { type InsertDeal } from "@shared/schema";
import { storage } from "../storage";

interface AmazonItem {
  ASIN: string;
  ItemInfo: {
    Title: { DisplayValue: string };
  };
  Offers: {
    Listings: Array<{
      Price: { Amount: number; DisplayAmount: string };
      SavingBasis: { Amount: number };
      ViolatesMAP?: boolean;
    }>;
    Summaries: Array<{
      LowestPrice: { Amount: number };
      HighestPrice: { Amount: number };
    }>;
  };
  Images: {
    Primary: {
      Large: { URL: string };
    };
  };
  DetailPageURL: string;
  BrowseNodeInfo?: {
    BrowseNodes: Array<{ DisplayName: string }>;
  };
}

interface FlipkartProduct {
  productId: string;
  title: string;
  mrp: { amount: number };
  sellingPrice: { amount: number };
  productUrl: string;
  productBaseInfo?: {
    productImage: { url: string };
  };
  categoryPath?: string;
}

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
        this.scrapeAmazon(),
        this.scrapeFlipkart(),
      ]);
      
      let totalScraped = 0;
      results.forEach((result, index) => {
        const platform = index === 0 ? 'Amazon' : 'Flipkart';
        if (result.status === 'fulfilled') {
          totalScraped += result.value;
          console.log(`${platform}: Scraped ${result.value} deals`);
        } else {
          console.error(`${platform}: Failed -`, result.reason);
        }
      });
      
      console.log(`Total scraped: ${totalScraped} deals`);
    } finally {
      this.isRunning = false;
    }
  }
  
  private async scrapeAmazon(): Promise<number> {
    const amazonAccessKey = process.env.AMAZON_ACCESS_KEY;
    const amazonSecretKey = process.env.AMAZON_SECRET_KEY;
    const amazonPartnerTag = process.env.AMAZON_PARTNER_TAG;
    
    if (!amazonAccessKey || !amazonSecretKey || !amazonPartnerTag) {
      console.log('Amazon API credentials not configured. Skipping Amazon scraping.');
      return 0;
    }
    
    try {
      const searchKeywords = ['deals', 'discount', 'sale'];
      const keyword = searchKeywords[Math.floor(Math.random() * searchKeywords.length)];
      
      const timestamp = new Date().toISOString();
      const payload = {
        PartnerTag: amazonPartnerTag,
        PartnerType: "Associates",
        Marketplace: "www.amazon.in",
        Keywords: keyword,
        SearchIndex: "All",
        ItemCount: 10,
        Resources: [
          "ItemInfo.Title",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "Images.Primary.Large",
          "BrowseNodeInfo.BrowseNodes"
        ]
      };
      
      const response = await fetch('https://webservices.amazon.in/paapi5/searchitems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Date': timestamp,
          'X-Amz-Access-Key': amazonAccessKey,
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Amazon API error:', errorText);
        return 0;
      }
      
      const data = await response.json();
      const items: AmazonItem[] = data.SearchResult?.Items || [];
      
      let count = 0;
      for (const item of items) {
        if (!item.Offers?.Listings?.[0]) continue;
        
        const listing = item.Offers.Listings[0];
        const originalPrice = listing.SavingBasis?.Amount || listing.Price.Amount;
        const discountedPrice = listing.Price.Amount;
        const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        
        if (discountPercentage < 20) continue;
        
        const category = this.mapAmazonCategory(item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName);
        
        const deal: InsertDeal = {
          title: item.ItemInfo.Title.DisplayValue,
          platform: 'amazon',
          category,
          originalPrice: Math.round(originalPrice * 100),
          discountedPrice: Math.round(discountedPrice * 100),
          discountPercentage,
          imageUrl: item.Images?.Primary?.Large?.URL || null,
          dealUrl: item.DetailPageURL,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        
        await storage.createDeal(deal);
        count++;
      }
      
      return count;
    } catch (error) {
      console.error('Amazon scraping error:', error);
      throw error;
    }
  }
  
  private async scrapeFlipkart(): Promise<number> {
    const flipkartAffiliateId = process.env.FLIPKART_AFFILIATE_ID;
    const flipkartApiToken = process.env.FLIPKART_API_TOKEN;
    
    if (!flipkartAffiliateId || !flipkartApiToken) {
      console.log('Flipkart API credentials not configured. Skipping Flipkart scraping.');
      return 0;
    }
    
    try {
      const response = await fetch('https://affiliate-api.flipkart.net/affiliate/offers/v1/dotd/json', {
        headers: {
          'Fk-Affiliate-Id': flipkartAffiliateId,
          'Fk-Affiliate-Token': flipkartApiToken,
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flipkart API error:', errorText);
        return 0;
      }
      
      const data = await response.json();
      const products: FlipkartProduct[] = data.allOffersList || [];
      
      let count = 0;
      for (const product of products.slice(0, 20)) {
        const originalPrice = product.mrp.amount;
        const discountedPrice = product.sellingPrice.amount;
        const discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        
        if (discountPercentage < 20) continue;
        
        const category = this.mapFlipkartCategory(product.categoryPath);
        
        const deal: InsertDeal = {
          title: product.title,
          platform: 'flipkart',
          category,
          originalPrice: Math.round(originalPrice * 100),
          discountedPrice: Math.round(discountedPrice * 100),
          discountPercentage,
          imageUrl: product.productBaseInfo?.productImage?.url || null,
          dealUrl: product.productUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        
        await storage.createDeal(deal);
        count++;
      }
      
      return count;
    } catch (error) {
      console.error('Flipkart scraping error:', error);
      throw error;
    }
  }
  
  private mapAmazonCategory(amazonCategory?: string): string {
    if (!amazonCategory) return 'electronics';
    
    const lower = amazonCategory.toLowerCase();
    if (lower.includes('electronic') || lower.includes('computer')) return 'electronics';
    if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('shoe')) return 'fashion';
    if (lower.includes('home') || lower.includes('kitchen') || lower.includes('furniture')) return 'home';
    if (lower.includes('beauty') || lower.includes('cosmetic')) return 'beauty';
    if (lower.includes('sport') || lower.includes('fitness')) return 'sports';
    if (lower.includes('book')) return 'books';
    
    return 'electronics';
  }
  
  private mapFlipkartCategory(categoryPath?: string): string {
    if (!categoryPath) return 'electronics';
    
    const lower = categoryPath.toLowerCase();
    if (lower.includes('electronic') || lower.includes('mobile') || lower.includes('laptop')) return 'electronics';
    if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('apparel')) return 'fashion';
    if (lower.includes('home') || lower.includes('kitchen') || lower.includes('furniture')) return 'home';
    if (lower.includes('beauty') || lower.includes('personal care')) return 'beauty';
    if (lower.includes('sport')) return 'sports';
    if (lower.includes('book')) return 'books';
    
    return 'electronics';
  }
}

export const scrapingService = new ScrapingService();
