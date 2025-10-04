import { scrapingService } from "../server/services/scraper";

async function main() {
  try {
    console.log("Starting scraping test...");
    await scrapingService.scrapeAllPlatforms();
    console.log("Scraping completed!");
    process.exit(0);
  } catch (error) {
    console.error("Scraping failed:", error);
    process.exit(1);
  }
}

main();
