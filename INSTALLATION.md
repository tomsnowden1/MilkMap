# Installation Guide for MilkMap

## ⚠️ Current Issue: NPM Cache Permissions

You may encounter an npm cache permission error when running `npm install`. This is a known issue with npm cache containing root-owned files.

## Solution

### Step 1: Fix NPM Cache Permissions

Run one of the following commands:

**Option A (Recommended):**
```bash
sudo chown -R $(whoami) "/Users/jess/.npm"
```

**Option B (If Option A doesn't work):**
```bash
sudo rm -rf ~/.npm
```

### Step 2: Install Dependencies

```bash
cd /Users/jess/MilkMap
npm install --legacy-peer-deps
```

**Why `--legacy-peer-deps`?**
- `react-leaflet@4.2.1` officially supports React 18
- We're using React 19 (latest)
- The library works fine despite the peer dependency warning
- This flag tells npm to ignore peer dependency mismatches

### Step 3: Verify Installation

```bash
# Check that node_modules was created
ls -la node_modules

# Validate data
npm run data:validate

# Try building
npm run build
```

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Expected Output

When you run `npm run data:validate`, you should see:

```
📋 Validating locations.json...

✅ Validation passed!
📍 Total locations: 3
🔄 Last updated: 2026-02-09T00:00:00Z

📊 Status breakdown:
   - Sample entries: 3
   - Active: 2
   - Unverified: 1

🏢 Venue types:
   - Malls: 1
   - Attractions: 2

✨ Data is valid and ready to use!
```

## Optional: GitHub API Configuration

To enable automated GitHub Issue creation (instead of opening prefilled URLs), create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your_username
GITHUB_REPO=MilkMap
```

To create a GitHub token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `repo` (full control of private repositories)
4. Generate and copy the token

**Note**: The app works fine without this - it will just open prefilled GitHub Issue URLs in the browser instead.

## Troubleshooting

### Issue: "Cannot find module 'next'"

**Solution**: Dependencies not installed. Follow Step 1 and 2 above.

### Issue: "Module not found: Can't resolve 'leaflet'"

**Solution**: Run `npm install --legacy-peer-deps` again.

### Issue: Port 3000 already in use

**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# OR run on different port
PORT=3001 npm run dev
```

### Issue: Map not showing

**Solution**: 
1. Check browser console for errors
2. Ensure Leaflet CSS is loaded (check Network tab)
3. Clear browser cache

## All Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Data management
npm run data:validate              # Validate locations.json
npm run data:scrape:all           # Run all scrapers (placeholders)
npm run data:scrape:sgnursingrooms # Run sgnursingrooms scraper
npm run data:scrape:momspumphere   # Run momspumphere scraper
npm run data:scrape:nparks         # Run nparks scraper
npm run data:merge                 # Merge candidate locations
```

## Deployment

Once the app builds successfully, you can deploy to:

- **Vercel** (recommended): `vercel deploy`
- **Netlify**: Link GitHub repo in Netlify dashboard
- **Any Node.js host**: Build and run with `npm run build && npm start`

Set environment variables in your deployment platform's dashboard if using GitHub API integration.
