# Add Map Search with Mapbox Search JS

## Overview

Add a geocoding search box to the interactive map so users can type a place name (city, address, etc.) and fly the map to that location. Uses Mapbox's `@mapbox/search-js-react` package, which provides a drop-in `<SearchBox>` component that integrates directly with our existing Mapbox map and access token.

## Why Mapbox Search JS

- Uses the same Mapbox token we already have (no new API keys or billing accounts)
- Purpose-built React component with autocomplete, session-based billing, and built-in fly-to
- Compatible with our stack: React 19, mapbox-gl v3, react-map-gl v8
- Free tier of ~100 sessions/month is plenty for this app's usage level
- Purely client-side — works with our static export deployment, no server needed

## Package

```bash
pnpm add @mapbox/search-js-react
```

This pulls in `@mapbox/search-js-core` and `@mapbox/search-js-web` as transitive dependencies. No other installs needed.

## Bundle Size Impact

The full dependency chain adds **~50-60 KB gzipped** to the client bundle:

| Package | Gzipped | What it is |
|---|---|---|
| `@mapbox/search-js-react` | ~3 KB | Thin React wrapper |
| `@mapbox/search-js-web` | ~37 KB | Web Components UI (the heavy part) |
| `@mapbox/search-js-core` | ~7 KB | API client |
| Transitive deps (`@floating-ui/dom`, `focus-trap`, etc.) | ~5-10 KB | UI utilities |

For context, `mapbox-gl` itself is ~200+ KB gzipped, so this adds roughly 25% on top of the map library. Reasonable for a polished autocomplete experience.

### Lightweight alternative: DIY with Geocoding REST API

If bundle size becomes a concern, skip the package entirely and build a simple search input that calls the Mapbox Geocoding API directly:

```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token=...
```

Trade-offs:
- **0 KB** additional bundle size (just a `fetch` call + a dropdown)
- Lose the polished autocomplete UX, session-based billing, and Shadow DOM styling
- Individual geocoding requests cost more per-call than session-based Search Box pricing
- More code to write and maintain (debouncing, dropdown, keyboard nav, etc.)

## Deployment

**No changes needed.** This feature is purely client-side — the browser talks directly to the Mapbox Search API using the same token already exposed in the static bundle. No server proxy, API routes, or SSR required. The static export model (`next build` -> `out/`) works as-is.

## Implementation Plan

### 1. Create `FloatingSearchBox` component

**New file:** `src/components/FloatingSearchBox.tsx`

Wrap the Mapbox `<SearchBox>` in a floating container styled to match our existing floating controls (timeline button, layer toggle).

```tsx
"use client"

import { SearchBox } from "@mapbox/search-js-react"
import mapboxgl from "mapbox-gl"
import type { MapRef } from "react-map-gl/mapbox"

interface FloatingSearchBoxProps {
  accessToken: string
  mapRef: React.RefObject<MapRef | null>
}

export function FloatingSearchBox({ accessToken, mapRef }: FloatingSearchBoxProps) {
  const mapInstance = mapRef.current?.getMap()

  return (
    <div className="absolute top-4 left-4 z-10 w-72">
      <SearchBox
        accessToken={accessToken}
        map={mapInstance}
        mapboxgl={mapboxgl}
        marker={false}
        placeholder="Search for a place..."
        options={{
          country: "US",
          language: "en",
          proximity: [-86.15, 39.77], // bias toward center of our map region
          types: "place,locality,neighborhood,address,poi",
        }}
      />
    </div>
  )
}
```

Key decisions:
- **`marker={false}`** — We probably don't want a persistent marker pin cluttering the cluster map. Could revisit this.
- **`proximity`** — Bias results toward the center of our Midwest region (Indianapolis area) so typing "Springfield" ranks the IL/OH ones above others.
- **`types`** — Include places and addresses but not countries/regions (too broad for our use case).
- **Position** — Top-left, above the map. Existing floating controls are bottom-right (timeline) and top-right (layer toggle), so top-left is open real estate.

### 2. Wire into `RegionMap`

In `src/map/regionMap.tsx`:

- Import `FloatingSearchBox`
- Pass the existing `mapboxAccessToken` and `mapRef` through
- Only render in interactive mode (not print mode)

```tsx
{!printMode && (
  <FloatingSearchBox accessToken={mapboxAccessToken} mapRef={mapRef} />
)}
```

### 3. Style the search box

The SearchBox renders inside a Shadow DOM, so normal Tailwind classes won't reach its internals. Customization uses a `theme` prop:

```tsx
<SearchBox
  theme={{
    variables: {
      fontFamily: "inherit",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    },
  }}
  // ...
/>
```

Start with defaults and only customize if it looks out of place. The default styling is clean and map-oriented.

### 4. Optional enhancements (future)

These are not part of the initial implementation but worth noting:

- **Cluster identification on search:** After flying to a location, highlight or show a tooltip for the cluster that contains the searched location (using `@turf/boolean-point-in-polygon` which we already have)
- **Bounding box constraint:** Add `bbox` option to limit results to our map's geographic extent, preventing users from searching for places outside the Midwest
- **Custom result action:** Use `onRetrieve` to do something app-specific when a result is selected (show cluster info, etc.)
- **Keyboard shortcut:** Add `/` or `Ctrl+K` to focus the search box

## Architecture Notes

- The `<SearchBox>` handles its own API calls, session tokens, and billing automatically
- It gracefully handles `map={undefined}` on first render before the map loads
- No state management needed in the parent — the component is self-contained
- The fly-to animation happens automatically when the user selects a result
- Static export compatible — all API calls happen client-side in the browser

## Compatibility

| Dependency | Our version | Required | Status |
|---|---|---|---|
| react | ^19.2.3 | >=16.8.0 | OK |
| mapbox-gl | ^3.18.0 | >=2.7.0 | OK |
| react-map-gl | ^8.1.0 | (not a peer dep) | OK |

## Pricing

Search Box API uses session-based billing:
- 1 session = a suggest-then-retrieve flow (up to 50 keystrokes + 1 selection)
- Free tier: ~100 sessions/month
- Beyond that: $3.00 per 1,000 sessions
- For our usage level, the free tier should be more than enough
