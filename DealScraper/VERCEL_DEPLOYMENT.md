# Deploying DealHunter to Vercel

This guide will help you deploy the DealHunter application to Vercel with a PostgreSQL database.

## Prerequisites

- A Vercel account (sign up at https://vercel.com)
- A GitHub account (to connect your repository)

## Step 1: Set up a PostgreSQL Database

You have several options for the database:

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to the Storage tab
3. Click "Create Database" and select "Postgres"
4. Follow the setup wizard
5. Vercel will automatically provide the `DATABASE_URL` environment variable

### Option B: External Database (Neon, Supabase, Railway, etc.)

1. Sign up for a database provider:
   - Neon: https://neon.tech (Free tier available)
   - Supabase: https://supabase.com (Free tier available)
   - Railway: https://railway.app
2. Create a new PostgreSQL database
3. Copy the connection string (DATABASE_URL)

## Step 2: Push Your Code to GitHub

```bash
cd DealScraper
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Step 3: Import Project to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `DealScraper`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

## Step 4: Configure Environment Variables

In the Vercel project settings, add the following environment variable:

- `DATABASE_URL`: Your PostgreSQL connection string
  - Example: `postgresql://user:password@host:5432/database?sslmode=require`

## Step 5: Run Database Migrations

After your first deployment, you need to run migrations:

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link to your project
vercel login
vercel link

# Pull environment variables
vercel env pull .env

# Run migrations
npm run db:migrate
```

## Step 6: Seed the Database

Your database is now empty. Add sample deals using one of these methods:

### Option A: Run Seed Script (Recommended)

```bash
# Using the environment variables from Step 5
npm run db:seed
```

### Option B: Trigger via API (Quick)

Visit this URL once in your browser:
```
https://your-app.vercel.app/api/deals/refresh
```

This will generate 10 sample deals in your database.

## Step 7: Deploy

Click "Deploy" in Vercel. Your application will be built and deployed automatically.

**Important**: After your first deployment, remember to seed your database (see Step 6) so deals will appear!

## Project Structure

```
DealScraper/
├── client/              # React frontend (Vite)
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── migrations/          # Database migrations
├── package.json
├── vite.config.ts
└── vercel.json         # Vercel configuration
```

## How the Application Works

### Database Storage

The application uses Drizzle ORM with PostgreSQL for data persistence:

- **Production**: Uses PostgreSQL when `DATABASE_URL` is set
- **Development**: Falls back to in-memory storage when `DATABASE_URL` is not set

### Mock Data

The scraper service currently uses mock data. To implement real web scraping:

1. Install Puppeteer: `npm install puppeteer`
2. Implement scraping logic in `server/services/scraper.ts`
3. Update the platform-specific methods (scrapeAmazon, scrapeFlipkart, etc.)

### API Endpoints

- `GET /api/deals` - Get all deals with filtering and pagination
- `GET /api/deals/stats` - Get deal statistics
- `GET /api/deals/:id` - Get a single deal
- `POST /api/deals/refresh` - Trigger deal scraping
- `DELETE /api/deals/expired` - Clear expired deals

## Troubleshooting

### Database Connection Errors

- Ensure your `DATABASE_URL` is correct
- Check if your database allows connections from Vercel IPs
- For Neon/Supabase, make sure SSL mode is enabled: `?sslmode=require`

### Build Errors

- Make sure all dependencies are in `package.json` (not devDependencies if needed in production)
- Check that TypeScript compiles without errors: `npm run check`

### Frontend Not Loading

- Verify the build output directory is correct: `dist/public`
- Check browser console for errors
- Ensure API routes are accessible

## Local Development

To run the project locally:

```bash
cd DealScraper
npm install

# Without database (uses in-memory storage)
npm run dev

# With database
DATABASE_URL="your-database-url" npm run dev
```

The application will be available at http://localhost:5000

## Performance Optimization

For production, consider:

1. **Caching**: Implement Redis for API response caching
2. **CDN**: Use Vercel's Edge Network for static assets
3. **Database Indexing**: Add indexes to frequently queried fields
4. **Rate Limiting**: Implement rate limiting for API endpoints

## Security

- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Implement proper authentication before enabling scraping endpoints
- Validate and sanitize all user inputs

## Support

For issues or questions:
- Check the Vercel documentation: https://vercel.com/docs
- Review database provider documentation
- Check application logs in Vercel dashboard
