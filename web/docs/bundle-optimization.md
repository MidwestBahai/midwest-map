# Bundle Optimization

## Current State

Build output (Next.js static export):

| Route | First Load JS | Route-specific JS |
|-------|--------------|-------------------|
| `/` | 313 kB | 18 kB (`app/page` + `323` chunk) |
| `/print` | 301 kB | 6 kB (`app/print/page`) |
| Shared | 101 kB | — |

Both routes load nearly identical JS because they share the same heavy dependencies.

### Chunk Breakdown

| Chunk | Raw | Gzipped | Contents | Loaded by |
|-------|-----|---------|----------|-----------|
| `d6076c4a` | 1.6 MB | 432 kB | mapbox-gl (already lazy-loaded via webpack) | Both |
| `687` | 601 kB | 174 kB | App components + GeoJSON data | Both |
| `74b57a87` | 169 kB | 53 kB | react-map-gl / supporting libs | Both |
| `445` | 168 kB | 44 kB | Radix UI, other shared deps | Both |
| `831` | 51 kB | 16 kB | Smaller shared deps | Both |
| `323` | 36 kB | 12 kB | Home-specific code | `/` only |

The dominant cost is chunk `687` (174 kB gzipped), which bundles all app components and GeoJSON data into a single shared chunk.

---

## Opportunity 1: Runtime GeoJSON Loading (Highest Impact)

Two GeoJSON files are statically imported, embedding ~1.1 MB of raw JSON into the JS bundle:

| File | Size | Imported by |
|------|------|-------------|
| `clusters-timeline.geo.json` | 523 KB | `regionMap.tsx`, `PrintClient.tsx`, `FloatingControls.tsx`, `useMilestoneEvents.ts` |
| `counties.geo.json` | 635 KB | `countyBoundaries.tsx` |

### Proposed Change

Move both files to `public/data/` and fetch at runtime instead of importing at build time.

- Create shared hooks (`useClusterData`, `useCountyData`) that fetch and cache the data
- Components show a loading state until data arrives
- GeoJSON compresses better as a standalone file than when wrapped in JS module boilerplate
- Files get independent browser caching with `immutable` headers

### Expected Impact

Chunk `687` would shrink from ~601 kB to ~100-150 kB raw. The GeoJSON files load in parallel as separate cacheable assets.

---

## Opportunity 2: Route-Specific Dynamic Imports (Moderate Impact)

Currently both routes pull all components into the shared `687` chunk. Using `next/dynamic` would let webpack create separate chunks per route.

**Print-only components:** `PrintToolbar`, `DraggableLegend`, `DraggableBox`, `HorizontalTimeline`

**Home-only components:** `FloatingControls`, `FloatingMapKey`, `FullScreenLinkButton`

Estimated savings: 30-50 kB per route.

---

## What Won't Help Much

Further splitting `/print` from `/` at the route level has limited value — they genuinely share mapbox-gl, react-map-gl, and the core map rendering code. The route-specific JS is already small (6-18 kB each). The "First Load JS" numbers overlap heavily because both routes need the map.
