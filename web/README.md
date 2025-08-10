# Midwest Map

The current status of [Bahá’í](https://bahai.org) communities by [cluster](https://bahaipedia.org/Cluster) in the [Midwest Region](https://midwestbahai.org) of the United States.

This is a [Next.js 15 rc](https://nextjs.org/blog/next-15-rc) bootstrapped via [`pnpx create-next-app@rc --usepnpm next-15-rc`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Development

Run the development server (requires [pnpm](https://pnpm.io)):

```bash
pnpm install  # first time only
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Data Pipeline

The map data goes through a two-stage pipeline to combine geographic boundaries with timeline data:

### Stage 1: Import Shapefiles
Converts shapefile data to GeoJSON format:
```bash
pnpm compile-importer  # Compile TypeScript scripts
pnpm import-shapefiles # Convert clusters-2025.shp → clusters-static.geo.json
```

### Stage 2: Merge Timeline Data
Combines the static GeoJSON with advancement dates:
```bash
pnpm merge-timeline    # Merge clusters-static.geo.json + advancement-dates.tsv → clusters-timeline.geo.json
```

### Run Complete Pipeline
```bash
pnpm prepare-data      # Runs all steps: compile, import, merge
```

### Data Files
- **Input:** `public/shapefiles/clusters-2025.shp` - Geographic boundaries
- **Input:** `public/advancement-dates.tsv` - Milestone advancement dates and populations
- **Intermediate:** `src/data/clusters-static.geo.json` - Pure geographic data
- **Output:** `src/data/clusters-timeline.geo.json` - Complete data with timeline

The final data includes for each cluster:
- Geographic boundaries (polygons)
- Population data
- Current milestone status
- Timeline of milestone advancements with dates
- First and latest advancement dates for filtering

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load PT Sans, a custom Google Font

## More about Next.js

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- Deploy on the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) — [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.