# Advanced Print Labels: HTML Overlay Approach

This document describes a future enhancement for guaranteed cluster labeling in print mode. It builds on the base print features in `PRINT-ROADMAP.md`.

## Problem Statement

Mapbox GL uses collision detection to prevent overlapping labels. While this works well for interactive maps (users can zoom to see hidden labels), it's problematic for print output where:

- **All 75 clusters must have visible labels** - no exceptions
- **Consistent content** - every cluster shows the same information
- **Small clusters get hidden** - Mapbox hides labels that don't fit, even in print mode

### Current Behavior (Mapbox Symbol Layers)

The current `ClusterText` component renders each cluster's label as a Mapbox symbol layer. Mapbox's collision detection:
- Hides labels that overlap other labels
- Hides labels that don't fit within their feature bounds
- Provides no option to force all labels visible

**Result:** Some clusters (especially small ones like OH-19, MI-UP clusters) may have no visible labels in print output.

---

## Proposed Solution: HTML Overlay Labels

Replace Mapbox symbol layers with HTML-rendered labels positioned over the map canvas. This:
- **Bypasses collision detection** - every label renders regardless of overlaps
- **Enables external labels** - small clusters get labels outside their bounds with leader lines
- **Leverages existing infrastructure** - uses same patterns as `DraggableLegend` and `DraggableBox`

### Architecture

```
PrintClient.tsx
├── RegionMap (printMode=true, Mapbox labels DISABLED)
├── ClusterLabelsOverlay (NEW - renders all 75 labels)
│   ├── ClusterLabel (internal - centered in cluster polygon)
│   ├── ClusterLabel (external - outside small clusters)
│   └── LeaderLinesOverlay (SVG lines connecting external labels to clusters)
├── DraggableLegend (existing)
└── DraggableBox (existing title)
```

**Key change:** In print mode, disable `ClusterText` (Mapbox labels) and render `ClusterLabelsOverlay` (HTML labels) instead.

---

## Label Classification

Each cluster is classified as **internal** or **external** based on whether its label fits inside:

### Internal Labels
- Placed at center of `largestClusterRect` (already computed per cluster)
- No background, just styled text
- Works for most clusters

### External Labels
- Placed outside the cluster polygon
- White background with thin border for readability
- Connected to cluster by a leader line
- Used for small clusters where label wouldn't fit

### Classification Algorithm

```typescript
function canFitInternally(
  largestRect: LatLongRect,
  labelSize: { width: number; height: number },
  map: MapRef
): boolean {
  // Convert lat/lng rect to screen pixels
  const topLeft = map.project([largestRect.minLong, largestRect.maxLat])
  const bottomRight = map.project([largestRect.maxLong, largestRect.minLat])
  const rectWidth = bottomRight.x - topLeft.x
  const rectHeight = bottomRight.y - topLeft.y

  // Check if label fits with 10% margin
  return rectWidth * 0.9 >= labelSize.width &&
         rectHeight * 0.9 >= labelSize.height
}
```

---

## External Label Placement

External labels need smart positioning to avoid overlaps. Use a sector-based approach:

### Sectors (in preference order)
```
    NW    N    NE
      ╲   │   ╱
       ╲  │  ╱
    W ───[●]─── E     ● = cluster centroid
       ╱  │  ╲
      ╱   │   ╲
    SW    S    SE
```

**Preference:** Corners first (NE, NW, SE, SW), then edges (N, E, S, W)

### Placement Algorithm

```typescript
function findExternalPosition(
  cluster: ClusterFeature,
  existingLabels: LabelPosition[],
  viewportBounds: BoundingBox,
  labelSize: { width: number; height: number }
): ExternalLabelPlacement {
  const sectors: Sector[] = ['NE', 'NW', 'SE', 'SW', 'N', 'E', 'S', 'W']
  const offset = 60 // pixels from polygon edge

  for (const sector of sectors) {
    const candidate = getSectorPosition(cluster, sector, offset, labelSize)

    if (!collidesWithAny(candidate, existingLabels) &&
        isWithinViewport(candidate, viewportBounds)) {
      return {
        position: candidate,
        sector,
        leaderLine: computeLeaderLine(cluster, candidate, sector)
      }
    }
  }

  // Fallback: use position with minimum overlap
  return findMinimumOverlapPlacement(cluster, existingLabels, sectors)
}
```

### Collision Detection

```typescript
function collidesWithAny(
  candidate: { x: number; y: number; width: number; height: number },
  existingLabels: LabelPosition[]
): boolean {
  return existingLabels.some(existing =>
    rectanglesOverlap(candidate, existing)
  )
}

function rectanglesOverlap(a: Rect, b: Rect): boolean {
  return !(a.x + a.width < b.x ||
           b.x + b.width < a.x ||
           a.y + a.height < b.y ||
           b.y + b.height < a.y)
}
```

---

## Leader Lines

SVG overlay layer connecting external labels to their clusters:

```tsx
<svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
  {externalLabels.map(label => (
    <path
      key={label.clusterId}
      d={`M ${label.leaderLine.start.x} ${label.leaderLine.start.y}
          L ${label.leaderLine.end.x} ${label.leaderLine.end.y}`}
      stroke="#666"
      strokeWidth="1"
      fill="none"
    />
  ))}
</svg>
```

### Leader Line Anchoring

- **Start point:** Edge of cluster polygon (closest point to label)
- **End point:** Edge of label box (side facing cluster)

---

## Styling

### Internal Labels
```css
.cluster-label--internal {
  font-family: system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  white-space: pre;  /* Preserve newlines */
  pointer-events: none;
  /* Color varies by milestone - use existing clusterLabelColor() */
}
```

### External Labels
```css
.cluster-label--external {
  font-family: system-ui, sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  white-space: pre;
  pointer-events: none;
  background: white;
  border: 1px solid #666;
  border-radius: 2px;
  padding: 2px 4px;
}
```

### Leader Lines
```css
.leader-line {
  stroke: #666;
  stroke-width: 1px;
  fill: none;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/print/ClusterLabelsOverlay.tsx` | Container rendering all 75 labels |
| `src/app/print/ClusterLabel.tsx` | Individual label (internal or external) |
| `src/app/print/LeaderLinesOverlay.tsx` | SVG layer for connecting lines |
| `src/app/print/useLabelPlacement.ts` | Hook computing all label positions |
| `src/lib/labelPlacement.ts` | Pure functions: collision detection, sector placement |

## Files to Modify

| File | Change |
|------|--------|
| `src/map/clusterLayers.tsx` | Skip `ClusterText` when `printMode=true` |
| `src/app/print/PrintClient.tsx` | Add `ClusterLabelsOverlay`, pass map ref and label options |

---

## Implementation Phases

### Phase 1: Basic HTML Labels
**Goal:** All labels visible at cluster centers (may overlap)

- Create `ClusterLabelsOverlay` rendering label for each cluster
- Position at center of `largestClusterRect` using `map.project()`
- Disable Mapbox `ClusterText` in print mode
- **Validation:** Count 75 labels rendered

### Phase 2: Internal/External Classification
**Goal:** Identify which labels need external placement

- Implement size comparison logic
- Visual indicator (dev only) for classification
- **Validation:** Console logs classification for all clusters

### Phase 3: External Placement + Leader Lines
**Goal:** No overlapping labels

- Implement sector-based positioning
- Add collision detection
- Render SVG leader lines
- **Validation:** Visual inspection of dense areas (Indianapolis core)

### Phase 4: Polish
**Goal:** Production-ready

- Handle edge clusters (viewport boundaries)
- Tune leader line styling
- Test across paper sizes and scopes
- Performance optimization (memoization)
- **Validation:** Compare to ArcGIS reference maps

---

## Label Content

Labels respect `LabelOptions` from print toolbar (see `PRINT-ROADMAP.md`):

```typescript
interface LabelOptions {
  showCode: boolean       // "IN-01"
  showMilestone: boolean  // "M3"
  showName: boolean       // "Franklin"
  showDate: boolean       // "2021"
}
```

Label content is built dynamically:
```
IN-01      ← if showCode
M3         ← if showMilestone
Franklin   ← if showName (truncated for external labels)
2021       ← if showDate
```

---

## Data Dependencies

The HTML overlay approach uses existing data:

| Data | Source | Notes |
|------|--------|-------|
| Cluster polygons | `clusters-timeline.geo.json` | GeoJSON features |
| Largest rectangles | `largestClusterRects` property | Pre-computed per cluster |
| Milestone/dates | Feature properties | `currentMilestone`, `timeline` |
| Label colors | `clusterLabelColor()` | Existing function |

**No new data preparation needed** - all required data is already available.

---

## Comparison: Mapbox vs HTML Overlay

| Aspect | Mapbox Symbol Layers | HTML Overlay |
|--------|---------------------|--------------|
| All labels visible | ❌ Collision hides some | ✅ Guaranteed |
| External labels | ❌ Not supported | ✅ With leader lines |
| Collision avoidance | ✅ Automatic | ⚠️ Custom algorithm |
| Vector output in PDF | ✅ Native | ✅ HTML/CSS renders as vector |
| Performance | ✅ GPU-accelerated | ⚠️ More DOM elements |
| Interactive mode | ✅ Excellent | ➖ Not needed (zoom works) |

**Recommendation:** Use HTML overlay for print mode only. Keep Mapbox labels for interactive mode.

---

## Open Questions

1. **Auto-position vs draggable?** Should external labels be draggable like legends, or purely auto-positioned?
   - Recommendation: Auto-position by default. Add draggable as future enhancement if needed.

2. **Recalculate on pan/zoom?** Should label positions update when map view changes?
   - Recommendation: Yes, but debounced. Print mode typically has static view.

3. **Leader line style?** Solid, dashed, with arrow?
   - Recommendation: Start with solid 1px gray. Iterate based on feedback.

4. **Fallback for extreme overlap?** What if algorithm can't find non-overlapping position?
   - Recommendation: Use minimum-overlap position + log warning for manual review.

---

## Related Documents

- `PRINT-ROADMAP.md` - Base print features, label toggles, toolbar
- `src/script/largestRectangle.ts` - Largest rectangle algorithm (for reference)
- `src/map/clusterText.tsx` - Current Mapbox label implementation
