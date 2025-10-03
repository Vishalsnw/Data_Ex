import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { deals } from "../shared/schema";

const mockDeals = [
  {
    title: "Premium Wireless Noise-Canceling Headphones",
    platform: "amazon",
    category: "electronics",
    originalPrice: 9999,
    discountedPrice: 2799,
    discountPercentage: 72,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://amazon.in/deal/123",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "5G Smartphone with 128GB Storage & Triple Camera",
    platform: "flipkart",
    category: "electronics",
    originalPrice: 39999,
    discountedPrice: 13999,
    discountPercentage: 65,
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://flipkart.com/deal/456",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "Men's Premium Running Shoes - Multiple Colors",
    platform: "myntra",
    category: "fashion",
    originalPrice: 4999,
    discountedPrice: 999,
    discountPercentage: 80,
    imageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://myntra.com/deal/789",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "Women's Cotton Printed Maxi Dress - Summer Collection",
    platform: "meesho",
    category: "fashion",
    originalPrice: 2999,
    discountedPrice: 349,
    discountPercentage: 88,
    imageUrl: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://meesho.com/deal/101",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "Smart Watch with Heart Rate Monitor & GPS",
    platform: "amazon",
    category: "electronics",
    originalPrice: 9999,
    discountedPrice: 3199,
    discountPercentage: 68,
    imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://amazon.in/deal/102",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "DSLR Camera with 18-55mm Lens & Camera Bag",
    platform: "flipkart",
    category: "electronics",
    originalPrice: 59999,
    discountedPrice: 26999,
    discountPercentage: 55,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://flipkart.com/deal/103",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "Women's Premium Leather Handbag - Designer Collection",
    platform: "myntra",
    category: "fashion",
    originalPrice: 5999,
    discountedPrice: 1499,
    discountPercentage: 75,
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://myntra.com/deal/104",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "Set of 3 Canvas Wall Art Paintings - Living Room Decor",
    platform: "meesho",
    category: "home",
    originalPrice: 3299,
    discountedPrice: 599,
    discountPercentage: 82,
    imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://meesho.com/deal/105",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "Mechanical Gaming Keyboard RGB Backlit - Programmable",
    platform: "amazon",
    category: "electronics",
    originalPrice: 5999,
    discountedPrice: 2399,
    discountPercentage: 60,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://amazon.in/deal/106",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  {
    title: "Premium Anti-Slip Yoga Mat with Carrying Bag - 6mm Thick",
    platform: "flipkart",
    category: "sports",
    originalPrice: 1499,
    discountedPrice: 449,
    discountPercentage: 70,
    imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    dealUrl: "https://flipkart.com/deal/107",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("🌱 Seeding database...");

  try {
    await db.insert(deals).values(mockDeals);
    console.log(`✅ Successfully seeded ${mockDeals.length} deals`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }

  process.exit(0);
}

seed();
