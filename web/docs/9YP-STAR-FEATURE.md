# 9 Year Plan Advancement Star Feature

## Overview

Add an optional nine-pointed star indicator to mark clusters that have advanced during the 9 Year Plan (Ridván 2022 onwards). This matches the style used in the handmade ArcGIS maps (see `moc 2409 *.png` files in the web directory).

## Dynamic Calculation

The star is **not** a hardcoded list. It's calculated dynamically from the timeline data:

```typescript
const NINE_YEAR_PLAN_START = new Date('2022-04-21') // Ridván 2022

function advancedDuring9YP(timeline: TimelineEntry[]): boolean {
  return timeline.some(entry => new Date(entry.date) >= NINE_YEAR_PLAN_START)
}
```

When a cluster advances and `advancement-dates.tsv` is updated, it will automatically receive the star on the next data rebuild (`pnpm prepare-data`).

## Current 9YP Advancements (as of Jan 2025)

| Cluster | Advancement | Date |
|---------|-------------|------|
| IN-01 | M3 | May 2025 |
| IN-01N | M1 | Dec 2022 |
| IN-04 | M2 | Sep 2023 |
| IN-05 | M2 | Jun 2025 |
| IN-07 | M1 | May 2022 |
| MI-04 | M1 | Nov 2025 |
| MI-07 | M1 | Nov 2025 |
| MI-08 | M3 | May 2023 |
| MI-12 | M1 | Mar 2024 |
| MI-13 | M2 | Feb 2024 |
| MIUP-04 | M2 | May 2022 |
| MIUP-06 | M1 | Nov 2025 |
| OH-07 | M2 | Jan 2024 |
| OH-27 | M2 | Nov 2023 |
| OH-29 | M2 | Jun 2023 |
| OH-32 | M1 | Feb 2024 |
| OH-35 | M2 | May 2022 |

## Assets

- **Star icon**: `public/states-star.png` (already exists - nine-pointed star)

## Implementation Plan

### 1. Update LabelOptions type

**File**: `src/app/print/types.ts`

```typescript
export interface LabelOptions {
  showCode: boolean
  showMilestone: boolean
  showName: boolean
  showDate: boolean
  show9YPStar: boolean  // NEW
}

export const DEFAULT_LABEL_OPTIONS: LabelOptions = {
  showCode: true,
  showMilestone: true,
  showName: false,
  showDate: false,
  show9YPStar: false,  // Off by default
}
```

### 2. Add toggle to PrintToolbar

**File**: `src/app/print/PrintToolbar.tsx`

Add checkbox in the "Labels:" row:

```tsx
<label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer"
       title="Star for clusters that advanced during 9 Year Plan">
  <input
    type="checkbox"
    checked={labelOptions.show9YPStar}
    onChange={() => handleLabelToggle("show9YPStar")}
    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
  />
  9YP Star
</label>
```

### 3. Add 9YP calculation helper

**File**: `src/data/getMilestoneAtDate.ts` (or new file)

```typescript
const NINE_YEAR_PLAN_START = new Date('2022-04-21')

export function hasAdvancedDuring9YP(timeline: TimelineEntry[] | undefined): boolean {
  if (!timeline || timeline.length === 0) return false
  return timeline.some(entry => new Date(entry.date) >= NINE_YEAR_PLAN_START)
}
```

### 4. Render star icon layer

**File**: `src/map/clusterText.tsx`

Add the star as a separate Mapbox symbol layer using an icon image:

1. Load the star image into Mapbox style on map load
2. When `labelOptions.show9YPStar` is true AND cluster has 9YP advancement:
   - Render a symbol layer with `icon-image: 'star-9yp'`
   - Position offset from center (e.g., `icon-offset: [20, 20]` for lower-right)

```tsx
{labelOptions?.show9YPStar && has9YPAdvancement && (
  <Layer
    type="symbol"
    layout={{
      'icon-image': 'star-9yp',
      'icon-size': 0.15,  // Adjust based on actual icon size
      'icon-offset': [40, 40],  // Lower-right of center
      'icon-allow-overlap': true,
    }}
    id={`${symbolLayerId}-star`}
  />
)}
```

### 5. Load star image into Mapbox

**File**: `src/map/regionMap.tsx`

On map load, add the star image:

```typescript
map.loadImage('/states-star.png', (error, image) => {
  if (error) throw error
  if (image && !map.hasImage('star-9yp')) {
    map.addImage('star-9yp', image)
  }
})
```

### 6. Add star to legend

**File**: `src/app/print/DraggableLegend.tsx`

Add a row showing the star icon with label "9-Year Plan advance" when the option is enabled. This requires passing `labelOptions` to the legend component.

```tsx
{labelOptions?.show9YPStar && (
  <div className="flex items-center gap-2 pt-1 border-t border-gray-200 mt-1">
    <img src="/states-star.png" alt="" className="w-5 h-5" />
    <span className="text-xs whitespace-nowrap">9-Year Plan advance</span>
  </div>
)}
```

## Props Flow

```
PrintClient
  ├── labelOptions state
  ├── PrintToolbar (controls labelOptions)
  ├── RegionMap
  │     └── ClusterLayers
  │           └── ClusterText (receives labelOptions, renders star)
  └── DraggableLegend (needs labelOptions for conditional star row)
```

## Design Notes

- **Star positioning**: In the handmade maps, the star appears offset from the cluster label, roughly in the upper-right area of the cluster polygon. Could use the largest-rectangle centroid with an offset, or calculate a position near the cluster centroid.

- **Star size**: Should scale with zoom level like other labels. Use `icon-size` with an interpolation expression.

- **Legend placement**: The star legend item should appear below the milestone swatches, separated by a subtle border.

- **Timeline interaction**: When viewing historical dates (before Ridván 2022), no clusters should show stars since none had advanced during 9YP yet. For dates during 9YP, only show stars on clusters that had advanced by that date.

## Future Considerations

- Could add similar indicators for other Plans (e.g., different icon for 5 Year Plan advancements)
- Could make the Plan start date configurable
- Could show the advancement type on hover (e.g., "M1 → M2 during 9YP")
