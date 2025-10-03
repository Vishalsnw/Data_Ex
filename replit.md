# DealHunter - Replit Configuration

## Overview

DealHunter is a web application that aggregates and displays discount deals from multiple e-commerce platforms (Amazon, Flipkart, Myntra, Meesho). The application scrapes deal information and presents it to users with advanced filtering, sorting, and view options. Users can browse deals by platform, category, discount percentage, and price range.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching

**UI Component Library**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component system built on Radix UI
- Tailwind CSS for utility-first styling with custom design tokens
- Custom CSS variables for theming (supports platform-specific colors for Amazon, Flipkart, Myntra, Meesho)

**State Management Strategy**
- React Query for server state (deals, stats, filters)
- Local React state for UI interactions (view modes, filter sidebar)
- No global state management library - relies on React Query's caching

**Component Structure**
- Page components in `client/src/pages/` (home, not-found)
- Reusable UI components in `client/src/components/` (deal-card, filter-sidebar, header, stats-overview)
- shadcn/ui primitives in `client/src/components/ui/`
- Path aliases configured (`@/` for client/src, `@shared/` for shared types)

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server
- TypeScript with ESM modules
- Custom Vite middleware integration for development mode
- Production build uses esbuild for server bundling

**API Design**
- RESTful API endpoints under `/api/*` prefix
- JSON request/response format
- Query parameter-based filtering for GET requests
- Endpoints:
  - `GET /api/deals` - List deals with filtering/pagination
  - `GET /api/deals/stats` - Deal statistics
  - `GET /api/deals/:id` - Single deal details
  - `POST /api/deals/scrape` - Trigger scraping

**Data Scraping Service**
- Mock scraping implementation in `server/services/scraper.ts`
- Placeholder for production web scraping (intended for Puppeteer/Cheerio)
- Scheduled scraping mechanism (currently manual trigger)
- Stores scraped deals in PostgreSQL database

**Storage Layer**
- Abstract `IStorage` interface in `server/storage.ts`
- PostgresStorage implementation using Drizzle ORM
- Methods for CRUD operations, filtering, and statistics
- Automatic cleanup of expired deals

### Database Architecture

**ORM & Schema**
- Drizzle ORM for type-safe database operations
- Neon serverless PostgreSQL driver (`@neondatabase/serverless`)
- Schema defined in `shared/schema.ts` for sharing between client/server

**Database Schema**
- Single `deals` table with columns:
  - id (UUID primary key)
  - title, platform, category
  - originalPrice, discountedPrice, discountPercentage
  - imageUrl, dealUrl
  - expiresAt (nullable timestamp)
  - scrapedAt (timestamp)

**Migrations**
- Drizzle Kit for schema migrations
- Migration files stored in `migrations/` directory
- Separate migrate script (`server/migrate.ts`) for deployment

**Filtering & Querying**
- Complex filtering with Drizzle's SQL builder
- Supports: platforms, categories, price range, discount percentage
- Multiple sort options (discount, price, platform, newest)
- Pagination support with page/limit parameters

### External Dependencies

**Database Provider**
- Designed for Neon PostgreSQL (serverless)
- Compatible with any PostgreSQL database via `DATABASE_URL` environment variable
- Alternative providers: Vercel Postgres, Supabase, Railway

**Development Tools**
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)
- Only loaded in development mode when `REPL_ID` is present

**Deployment Platform**
- Configured for Vercel deployment via `vercel.json`
- Build outputs to `dist/public` for static assets
- API routes handled via Vercel serverless functions
- Environment variable: `DATABASE_URL` required for production

**Third-Party UI Libraries**
- Radix UI component primitives (30+ components)
- Embla Carousel for carousel functionality
- date-fns for date formatting
- lucide-react for icons
- react-hook-form with Zod validation
- vaul for drawer components

**Font Resources**
- Google Fonts: Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono
- Loaded via CDN in `client/index.html`