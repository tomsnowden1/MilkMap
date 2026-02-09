# MilkMap 🍼

A simple, functional web app for finding free nursing and baby-care rooms in Singapore malls and public attractions.

## Features

- **Interactive Map**: Browse nursing rooms on a Singapore-centered map with OpenStreetMap
- **Search & Filter**: Find rooms by venue name, address, or specific amenities
- **Detailed Information**: View floor locations, amenities, sources, and verification status
- **Community Feedback**: Report issues or confirm locations via GitHub Issues
- **Submit New Locations**: Contribute new nursing rooms for review

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **Map**: Leaflet + OpenStreetMap tiles
- **Data Validation**: Zod schemas
- **Updates**: GitHub Issues/PRs (moderated)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- (Optional) GitHub Personal Access Token for automated Issue creation

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/MilkMap.git
cd MilkMap

# Install dependencies (use --legacy-peer-deps if needed)
npm install --legacy-peer-deps

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables (Optional)

For automated GitHub Issue creation via API routes, create a `.env.local` file:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your credentials:

```
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=MilkMap
```

**Note**: If these variables are not set, the app will fallback to opening prefilled GitHub Issue URLs in the browser.

## How to Add Locations

### Option 1: Via the Web App

1. Click **"+ Add Room"** button
2. Fill in the form with venue details
3. Submit - this creates a GitHub Issue for review
4. Maintainers will verify and add to `data/locations.json`

### Option 2: Via GitHub PR

1. Edit `data/locations.json`
2. Add your location following the schema in `data/locations.schema.ts`
3. Run `npm run data:validate` to check your changes
4. Submit a Pull Request with your addition

## Data Validation

```bash
npm run data:validate
```

This validates `data/locations.json` against the Zod schema and shows statistics.

## Data Scraping (Advanced)

Placeholder scripts are provided for automated data collection:

```bash
# Run all scrapers
npm run data:scrape:all

# Run individual scrapers
npm run data:scrape:sgnursingrooms
npm run data:scrape:momspumphere
npm run data:scrape:nparks

# Merge and deduplicate candidates
npm run data:merge
```

**Note**: Scraper scripts are placeholders. Implement actual scraping logic by editing files in `scripts/`.

## Feedback System

Users can provide feedback on locations:

- **👍 Still there**: Confirms location is active
- **👎 Issue**: Reports problems (closed, incorrect info, etc.)

Feedback creates GitHub Issues with the `feedback` label for maintainers to review.

## Project Structure

```
MilkMap/
├── app/
│   ├── api/
│   │   ├── feedback/route.ts      # Feedback API endpoint
│   │   └── submit/route.ts        # New location submission endpoint
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── globals.css                # Global styles
├── components/
│   ├── AddRoomForm.tsx            # Add location form modal
│   ├── FeedbackButtons.tsx        # Feedback UI
│   ├── FilterChips.tsx            # Amenity filter chips
│   ├── LocationDetail.tsx         # Location detail drawer
│   ├── LocationList.tsx           # Location list sidebar
│   ├── MapView.tsx                # Leaflet map component
│   └── SearchBar.tsx              # Search input
├── data/
│   ├── locations.schema.ts        # Zod schemas
│   └── locations.json             # Location data (source of truth)
├── scripts/
│   ├── validate-data.ts           # Data validation script
│   ├── merge-candidates.ts        # Merge scraped candidates
│   ├── scrape-sgnursingrooms.ts   # Scraper placeholder
│   ├── scrape-momspumphere.ts     # Scraper placeholder
│   └── scrape-nparks.ts           # Scraper placeholder
└── .github/
    └── ISSUE_TEMPLATE/
        ├── feedback.yml           # Feedback issue template
        └── submission.yml         # Submission issue template
```

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Deployment**: Can be deployed to Vercel, Netlify, or any platform supporting Next.js.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run data:validate` and `npm run build` to verify
5. Submit a Pull Request

## License

MIT

## Acknowledgments

- Map tiles by [OpenStreetMap](https://www.openstreetmap.org/copyright)
- Built with [Next.js](https://nextjs.org/), [Leaflet](https://leafletjs.com/), and [Tailwind CSS](https://tailwindcss.com/)
