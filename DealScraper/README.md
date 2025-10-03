# DealHunter

A modern web application that aggregates and displays discount deals from multiple e-commerce platforms (Amazon, Flipkart, Myntra, Meesho).

![DealHunter Screenshot](https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800)

## Features

- 🎯 **Multi-Platform Aggregation**: Displays deals from Amazon, Flipkart, Myntra, and Meesho
- 🔍 **Advanced Filtering**: Filter by platform, category, price range, and discount percentage
- 📊 **Real-time Statistics**: View total deals, average discount, best deals, and active platforms
- 🎨 **Modern UI**: Built with React, Tailwind CSS, and shadcn/ui components
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance**: Powered by Vite for lightning-fast development and builds

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack Query** for data fetching
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** for data persistence
- **Neon** serverless database

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL database (optional for development)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd DealScraper

# Install dependencies
npm install

# Run in development mode (uses in-memory storage)
npm run dev

# Run with database
DATABASE_URL="postgresql://..." npm run dev
```

The application will be available at http://localhost:5000

### Database Setup

If you want to use a real database:

```bash
# Generate migrations
npm run db:generate

# Run migrations
DATABASE_URL="postgresql://..." npm run db:migrate
```

## Deployment

### Deploy to Vercel

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

Quick steps:
1. Push your code to GitHub
2. Import to Vercel
3. Set up PostgreSQL database (Vercel Postgres or external)
4. Add `DATABASE_URL` environment variable
5. Deploy!

## API Endpoints

- `GET /api/deals` - List all deals with filtering
  - Query params: `platforms`, `categories`, `minDiscount`, `minPrice`, `maxPrice`, `sortBy`, `page`, `limit`
- `GET /api/deals/stats` - Get deal statistics
- `GET /api/deals/:id` - Get single deal details
- `POST /api/deals/refresh` - Trigger deal scraping
- `DELETE /api/deals/expired` - Clear expired deals

## Project Structure

```
DealScraper/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities
│   │   └── hooks/         # Custom React hooks
│   └── index.html
├── server/                 # Backend Express server
│   ├── services/          # Business logic
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database layer
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema
├── migrations/             # Database migrations
├── package.json
├── vite.config.ts
└── vercel.json            # Vercel configuration
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes directly to database

### Adding New Features

1. **Frontend Components**: Add to `client/src/components/`
2. **API Endpoints**: Add to `server/routes.ts`
3. **Database Models**: Update `shared/schema.ts` and generate migrations
4. **Business Logic**: Add to `server/services/`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Built with [Replit](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
