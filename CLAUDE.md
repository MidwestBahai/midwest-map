# Midwest Map - AI Assistant Context

This document provides context for AI assistants working on the Midwest Map project.

## Project Overview
Interactive map showing Bahá'í clusters (geographic areas for systematic growth) in the US Midwest region with milestone advancement tracking over time.

## Architecture
- **Framework:** Next.js 15 with React
- **Map:** react-map-gl/mapbox
- **Styling:** Tailwind CSS v4
- **Package Manager:** pnpm
- **Language:** TypeScript

## Data Pipeline

### Multi-Stage Process
1. **ImportShapefiles.ts**: Converts cluster shapefiles to GeoJSON (`clusters-static.geo.json`)
2. **ImportCounties.ts**: Converts county shapefiles to GeoJSON (`counties.geo.json`)
3. **MergeAdvancementData.ts**: Merges timeline data (`clusters-timeline.geo.json`)
4. **MapCountiesToClusters.ts**: Enriches counties with cluster associations (adds `clusterCode`, `clusterState`, `clusterGroup` to each county)

### Key Data Structure
```typescript
interface ClusterProperties {
  // From shapefile
  Cluster: string       // e.g., "IN-01"
  Group: string        // e.g., "INDY"
  M: string           // Original milestone marker
  
  // From timeline merge
  population: number
  currentMilestone: string  // e.g., "M3"
  timeline: Array<{
    milestone: string
    date: string      // e.g., "2011-11-11"
  }>
  firstAdvancement: string | null
  latestAdvancement: string | null
}
```

## Key Components
- `web/src/map/regionMap.tsx` - Main map component
- `web/src/map/clusterLayers.tsx` - Renders cluster polygons
- `web/src/map/floatingMapKey.tsx` - Map legend
- `web/src/components/FloatingTimelineButton.tsx` - Timeline slider for viewing historical milestones
- `web/src/components/FloatingLayerToggle.tsx` - Toggle between cluster overlay and reference map
- `web/src/data/milestoneLabels.ts` - Milestone definitions (M1, M2, M3, etc.)

## Commands
Run from the `web/` directory:
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm prepare-data # Rebuild all data files
```

## Data Sources
- Shapefiles: `web/data-sources/shapefiles/clusters-YYYY.shp`
- Timeline: `web/data-sources/advancement-dates.tsv`

## Important Notes
- Cluster IDs are unique (IN-01N and IN-01S are separate from IN-01)
- Some clusters have no advancement data (OK, haven't advanced)
- Timeline spans 2011-2025
- Population data is static per cluster
- Each county belongs to exactly one cluster; clusters are composed of whole counties
- Counties have `clusterState` (IN/MI/OH) and `clusterGroup` (INDY/CLV/etc.) for filtering

## Current Status
- Timeline data structure is implemented
- Map displays current milestone status with colored polygons and labels
- Timeline slider (FloatingTimelineButton) allows viewing historical milestone states
- Layer toggle allows switching to reference map view with cluster boundaries only
- Print mode (`/print`) for generating printable maps

## Print Mode

Access via `/print` route. Features:

### Print Controls (`web/src/app/print/PrintToolbar.tsx`)
- **Label options**: Toggle which elements appear in cluster labels (codes, milestones, names, dates)
- **Scope/Area filter**: Filter visible clusters and county boundaries by state (IN, MI, OH) or cluster group (INDY, CLV, etc.)
- **Paper size**: Select target paper dimensions (affects @page CSS)
- **Timeline**: Optional historical date selection

### Key Components
- `web/src/app/print/PrintClient.tsx` - Main print page with state management
- `web/src/app/print/PrintToolbar.tsx` - Bottom toolbar with controls
- `web/src/app/print/DraggableLegend.tsx` - Draggable per-group legends
- `web/src/app/print/DraggableBox.tsx` - Draggable title box
- `web/src/app/print/types.ts` - Shared types (LabelOptions)
- `web/src/map/countyBoundaries.tsx` - County boundary lines (filtered by scope)

### Architecture Notes
- Layers use Mapbox `visibility` and opacity transitions (not React mount/unmount) to preserve layer ordering
- All clusters render always; scope filtering controls visibility via opacity
- Two-pass rendering: fills first, then symbols, ensures labels stay above fills
- Draggable element positions persist to localStorage

## Deployment

Static export (`next build` produces `out/`). Configure host cache headers:
- `index.html`: `max-age=0, must-revalidate` (always check for updates)
- `/_next/static/*`: `max-age=31536000, immutable` (fingerprinted, cache forever)

## TypeScript Compilation for Scripts
The import scripts use a separate TypeScript config: `web/tsconfig-import-shapefiles.json`