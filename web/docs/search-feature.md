# Geographic Search Feature

## Goal

Add a search box to the interactive map that lets users find and fly to clusters, counties, or cluster groups by name.

## Scope

- **Level 1 (primary):** Local data search with fly-to — search clusters by code/name, counties by name, groups by display name
- **Level 2 (secondary):** Highlight the selected feature on the map after flying to it

---

## Level 1: Search + Fly-To

### Dependencies

**No new dependencies needed.**

- **Bbox:** Write a small inline helper (~10 lines) instead of adding `@turf/bbox`. It just walks coordinates to find min/max — not worth pulling in `@turf/bbox` + `@turf/meta` + `tslib` for that.
- **Fuzzy search:** Not needed — 75 clusters + 263 counties + 5 groups is small enough for simple case-insensitive `includes()` filtering.

### Search data source

Build a flat search index at module scope (or in a `useMemo`) from two existing imports:

| Source | Import | Searchable fields |
|--------|--------|-------------------|
| Clusters | `clusters-timeline.geo.json` | `Cluster` (code, e.g. "IN-17"), `Cluster Na` (name, e.g. "Clark, Floyd, Harrison Co"), `Group` + `GroupName` |
| Counties | `counties.geo.json` | `NAME` (e.g. "Hamilton"), `clusterCode` (to show associated cluster) |

Each search result should carry:
```ts
interface SearchResult {
  type: "cluster" | "county" | "group"
  label: string        // display text, e.g. "IN-17 — Clark, Floyd, Harrison Co"
  sublabel?: string    // secondary info, e.g. "Indianapolis group" or "Cluster IN-05"
  feature: Feature     // the GeoJSON feature (for bbox calculation)
  // For group results, feature is omitted — instead store all member features
  features?: Feature[] // (group only) all cluster features in the group
}
```

### Filtering logic

On each keystroke (debounced ~150ms):

1. Filter clusters where `Cluster` or `Cluster Na` includes the query (case-insensitive)
2. Filter counties where `NAME` includes the query
3. Filter groups where `displayName` (from `clusterGroups.ts`) includes the query
4. Deduplicate — if a county matches and its parent cluster also matches, prefer the cluster
5. Cap results at ~8–10 to keep the dropdown manageable
6. Sort: exact prefix matches first, then alphabetical

### Fly-to behavior

On result selection:

- **Cluster or county:** Compute bbox with an inline helper, call `map.fitBounds()` with padding
- **Group:** Compute combined bbox across all member cluster features, call `map.fitBounds()`

Access the map instance via the existing `useMap()` hook → `map.getMap().fitBounds(...)`.

```ts
const [minLng, minLat, maxLng, maxLat] = featureBbox(feature)
map.getMap().fitBounds(
  [[minLng, minLat], [maxLng, maxLat]],
  { padding: 60, duration: 1500 }
)
```

### UI component: `FloatingSearch`

**Placement:** Top-left of the viewport. The bottom-right is occupied by timeline/print/layer controls. Top-left is open and is the conventional position for map search.

**Structure:**
```
┌─────────────────────────────┐
│ 🔍  Search clusters...      │  ← input, always visible (collapsed to icon on mobile?)
├─────────────────────────────┤
│ IN-17 — Clark, Floyd, Ha... │  ← dropdown results (shown when typing)
│ IN-05 — Hamilton Co (Cin... │
│ Hamilton County (→ IN-05)   │
│ Indianapolis (group)        │
└─────────────────────────────┘
```

**Behavior:**
- Input with a search icon on the left
- On focus/typing, show dropdown below the input
- Arrow keys + Enter for keyboard navigation
- Escape or blur to close dropdown
- On mobile: consider collapsing to just a magnifying glass icon that expands on tap
- Clicking a result: fly to it, close dropdown, optionally highlight (Level 2)

**Positioning:** `fixed top-4 left-4 z-[60]` — same z-index as other floating controls, consistent spacing from edge.

**Styling:** Match existing floating controls — white background, `shadow-lg`, rounded corners. Use Tailwind classes consistent with `FloatingButton`.

### Files to create/modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/FloatingSearch.tsx` | **Create** | Search input + dropdown component |
| `src/lib/searchIndex.ts` | **Create** | Build search index from GeoJSON, filtering logic |
| `src/lib/featureBbox.ts` | **Create** | Inline bbox helper (~10 lines, replaces `@turf/bbox`) |
| `src/map/regionMap.tsx` | **Modify** | Add `<FloatingSearch />` inside MapProvider (gated on `!printMode`) |

### Wiring into the page

In `ClientMain.tsx`, add `<FloatingSearch />` alongside the other floating controls. It needs access to the map (via `useMap()` from `mapContext.tsx`), which means it must be rendered inside `<RegionMap>`'s `<MapProvider>`. Two options:

- **Option A:** Render `<FloatingSearch />` inside `RegionMap` (like `MapExperiments`). Simple but couples search to the map component.
- **Option B:** Lift `MapProvider` to `ClientMain` so both `RegionMap` internals and `FloatingSearch` can access the map context. Cleaner separation but more refactoring.

**Recommendation:** Option A for now — add it inside `RegionMap` gated behind `!printMode`, similar to how hover state is handled. This avoids refactoring the provider tree.

---

## Level 2: Highlight Selected Feature

### Approach

After flying to a search result, visually highlight the selected cluster or county.

### State

Add `selectedClusterCode: string | null` state to `RegionMap` (or pass it down from `ClientMain`). `FloatingSearch` sets it on result selection; clicking the map background or pressing Escape clears it.

### Visual treatment

In `ClusterLayers`, add the selected cluster to the `highlighted` condition:

```ts
const highlighted =
  feature?.properties?.Cluster === hoverFeature?.properties?.Cluster ||
  feature?.properties?.Cluster === selectedClusterCode ||  // ← new
  // ... existing category highlight logic
```

This reuses the existing highlight styling (brighter fill + border) with no new layers needed.

For county highlights (when searching for a county specifically), a new approach is needed since counties don't have per-feature layers. Options:
- Add a small highlight `Source`/`Layer` that renders only the selected county feature with a distinct outline
- Or simply fly to the county's parent cluster and highlight that cluster instead (simpler, and the county is visible within it)

**Recommendation:** For county search results, highlight the parent cluster. This avoids adding new layer infrastructure and keeps the visual language consistent.

### Clearing selection

- Click anywhere on the map → clear `selectedClusterCode`
- Press Escape → clear
- Start a new search → clear previous selection
- Hover still works independently (hover takes visual priority over selection, or they stack)

---

## Bundle Size Notes

### Impact of search: ~0

Both GeoJSON files (`clusters-timeline.geo.json` and `counties.geo.json`) are already in the shared JS bundle — chunk 687, which is 616KB raw / 179KB gzipped. This is because `regionMap.tsx` statically imports both `ClusterLayers` (which uses cluster data) and `CountyBoundaries` (which imports county data), even though `CountyBoundaries` only renders in print mode.

Since search imports the same data, it adds no new payload. The search UI component and inline bbox helper are a few KB at most.

No new npm dependencies are introduced.

### Potential future optimization (out of scope)

The county data (650KB raw / 106KB gzip) is loaded on every page even though it only renders in print mode. If bundle size becomes a concern, dynamically importing `CountyBoundaries` (and its county data) would move ~106KB gzipped off the critical path for the main route. This is orthogonal to the search feature — it's an existing cost, not a new one.
