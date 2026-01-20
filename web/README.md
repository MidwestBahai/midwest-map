# Midwest Map - Web Application

Next.js 15 application for visualizing Bahá'í [clusters](https://bahaipedia.org/Cluster) (geographic areas for systematic growth) and their milestone advancement in the Midwest Region.

## Features

**Interactive Map**
- Colored cluster polygons showing current milestone status
- Timeline slider to view historical milestone advancement
- Toggle between cluster overlay and reference map views
- Hover/click for cluster details

**Print Export**
- Dedicated print view (`/print`) optimized for high-quality output
- Draggable per-region legends (positions persist across sessions)
- Historical snapshots via date parameter (`/print?date=2023-01-01`)
- PNG export service for poster-size prints (Letter, Tabloid, 24×36" poster)

See `docs/PRINT-ROADMAP.md` for planned enhancements.

## Development

```bash
pnpm install  # Install dependencies
pnpm dev      # Start development server at http://localhost:3000
pnpm build    # Production build
```

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
- **Input:** `data-sources/shapefiles/clusters-2025.shp` - Geographic boundaries
- **Input:** `data-sources/advancement-dates.tsv` - Milestone advancement dates and populations
- **Intermediate:** `src/data/clusters-static.geo.json` - Pure geographic data
- **Output:** `src/data/clusters-timeline.geo.json` - Complete data with timeline

The final data includes for each cluster:
- Geographic boundaries (polygons)
- Population data
- Current milestone status
- Timeline of milestone advancements with dates
- First and latest advancement dates for filtering

## Tech Stack

- **Framework:** Next.js 15 with React
- **Map:** react-map-gl / Mapbox GL JS
- **Styling:** Tailwind CSS v4
- **Font:** PT Sans (Google Fonts)