# Print Roadmap

This document covers the print/export feature for generating high-quality printable maps.

## Overview

The print system allows users to generate printable maps with:
- **Draggable legends**: Position legends in empty map areas (lakes, neighboring states)
- **Draggable title**: Position the map title where it fits best
- **Date selection**: Current or historical view via URL param
- **Vector output**: All content is vector-based for crisp printing at any size

**Current approach**: Native browser print (Cmd+P → PDF). This produces high-quality vector PDFs suitable for professional printing, including large format posters.

**Deferred**: PNG export service via Puppeteer (see bottom of doc). Not yet requested by users; browser print covers the primary use case.

---

## Current Status

### What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| `/print` route | ✅ Done | Dedicated print view |
| Draggable legends | ✅ Done | One per cluster group, positions persist in localStorage |
| Draggable title | ✅ Done | Position persists in localStorage |
| Vector map style | ✅ Done | Uses `empty-v9` Mapbox style (no raster tiles) |
| County boundaries | ✅ Done | Visible in print mode |
| Opaque fill colors | ✅ Done | `printMode` flag adjusts alpha |
| Color swatches in print | ✅ Done | `print-color-adjust: exact` on legend swatches |
| Pan/zoom persistence | ✅ Done | Map view state persists in localStorage |
| History timeline | ✅ Done | HorizontalTimeline component with animated expand/collapse |

### Recent Architecture Changes

The floating controls have been reorganized for better maintainability:

**FloatingControls component** (`src/components/FloatingControls.tsx`):
- Unified rendering of Print, Layers, and Timeline buttons
- Accepts `mode: "main" | "print"` prop
- Print button shows "active" dark style when in `/print` mode
- Clicking print button in `/print` navigates back to `/`

**FloatingButton component** (`src/components/FloatingButton.tsx`):
- Shared button styling and positioning constants
- Exports `FLOATING_BUTTON` constants used by other components
- All floating buttons share `z-[60]` (above slide-up panel `z-50`)

**Z-index organization:**
- `z-50`: PrintToolbar slide-up panel
- `z-60`: All floating buttons (Print, Layers, Timeline)
- This ensures buttons remain clickable when panel is expanded

**Mapbox layer ordering (for scope filtering):**
- All clusters are always rendered (never unmounted)
- Visibility controlled via Mapbox `fill-opacity` / `line-opacity` with 300ms transitions
- Two-pass rendering: all fill layers first, then all symbol layers
- This prevents layer reordering issues when toggling scope (labels staying above fills)
- See `regionMap.tsx` for the two-pass pattern and `clusterLayers.tsx` for opacity transitions

### What's Missing

| Feature | Priority | Notes |
|---------|----------|-------|
| Scope/area selector | ✅ Done | Region, state, or cluster group view (with smooth fade transitions) |
| Label toggles | ✅ Done | Show/hide codes, milestones, names, dates |
| Scoped persistence | Medium | Each view saves its own legend positions (currently shared) |
| Print CSS (`@media print`) | High | Hide UI, preserve colors globally |
| Page size selector | ✅ Done | Letter/Tabloid/Poster presets in PrintToolbar |
| Aspect ratio matching | High | WYSIWYG - viewport matches paper |
| "On-page" indicator | Medium | Gray overlay showing print boundary |
| Print button + instructions | ✅ Done | Print/Save PDF button in PrintToolbar |
| Toolbar (hidden in print) | ✅ Done | Slide-up PrintToolbar panel |
| Guaranteed labels | Future | All clusters labeled; see `PRINT-LABELS-ADVANCED.md` |

---

## Immediate: Native Browser Print

### Why Browser Print?

The `/print` route uses a blank Mapbox style with all vector content:
- Cluster polygons (vector)
- County boundaries (vector)
- Labels and text (vector)
- Legends (HTML/CSS, rendered as vector in PDF)

**Vector PDFs scale infinitely** - a 24"×36" poster at 300 DPI will be perfectly crisp. This is ideal for professional print shops, which typically prefer PDF over PNG anyway.

### Implementation Plan

#### 1. Print CSS Foundation

Add `@media print` rules to `globals.css`:

```css
@media print {
  /* Preserve all background colors */
  * {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Hide screen-only UI */
  .print-hidden,
  [data-print-hidden] {
    display: none !important;
  }

  /* Remove decorative shadows */
  .shadow, .shadow-sm, .shadow-lg {
    box-shadow: none !important;
  }

  /* Ensure white background */
  body {
    background: white !important;
  }
}
```

#### 2. Scope & Area Selector

Users want to print different views:
- **Region poster**: Full 3-state view for conferences
- **State posters**: Indiana, Michigan, or Ohio focus
- **Zone posters**: Individual cluster group areas (Indianapolis, Cleveland, etc.)

```typescript
type Scope = 'region' | 'state' | 'subregion'

interface ScopeOption {
  scope: Scope
  area?: string
  label: string
  visibleGroups: ClusterGroupKey[]  // Which legends to show
}

const scopeOptions: ScopeOption[] = [
  { scope: 'region', label: 'Full Region', visibleGroups: ['INDY', 'CLV', 'CBUS', 'AA', 'GR'] },
  { scope: 'state', area: 'IN', label: 'Indiana', visibleGroups: ['INDY'] },
  { scope: 'state', area: 'MI', label: 'Michigan', visibleGroups: ['AA', 'GR'] },
  { scope: 'state', area: 'OH', label: 'Ohio', visibleGroups: ['CLV', 'CBUS'] },
  { scope: 'subregion', area: 'indianapolis', label: 'Indianapolis Group', visibleGroups: ['INDY'] },
  { scope: 'subregion', area: 'cleveland', label: 'Cleveland Group', visibleGroups: ['CLV'] },
  { scope: 'subregion', area: 'columbus', label: 'Columbus Group', visibleGroups: ['CBUS'] },
  { scope: 'subregion', area: 'ann-arbor', label: 'Washtenaw Group', visibleGroups: ['AA'] },
  { scope: 'subregion', area: 'grand-rapids', label: 'Grand Rapids Group', visibleGroups: ['GR'] },
]
```

When scope changes:
1. Filter visible clusters to those in the selected area
2. Compute bounding box from filtered clusters
3. Fit map to new bounds
4. Show only relevant legends
5. Load saved positions for this specific view (see scoped persistence)

#### 3. Label Toggles

Control what text appears on clusters:

```typescript
interface LabelOptions {
  showCode: boolean      // "IN-01", "MI-03", etc. (default: true)
  showMilestone: boolean // "M1", "M2", "M3" (default: true)
  showName: boolean      // "Franklin", "Darke", etc. (default: false)
  showDate: boolean      // "2021" (advancement year) (default: false)
}
```

UI: Checkboxes in toolbar
```
[✓] Codes   [✓] Milestones   [ ] Names   [ ] Dates
```

- **Codes + Milestones** default to checked (matches current print behavior)
- **Names** useful for detailed views; cluster names are somewhat arbitrary currently (may evolve to short nickname + longer systematic name)
- **Dates** shows advancement year when applicable

**Note on cluster names:** Current names reflect historical familiarity and may need generalization. Plan for future: short nickname + longer systematic name. Keep flexible.

**Mapbox limitation:** With current Mapbox labels, collision detection may hide labels on small clusters. For guaranteed complete labeling, see `PRINT-LABELS-ADVANCED.md`.

#### 4. Scoped Persistence

**Key insight**: Each view needs its own saved layout.

When user switches to "Cleveland Group" view:
- Legend position should be optimized for Cleveland's shape
- Title might be in a different spot
- Map zoom/pan is specific to that area

**Storage key scheme**:
```typescript
// Generate storage key based on current view
function getStorageKey(prefix: string, scope: Scope, area?: string): string {
  if (scope === 'region') return `${prefix}-region`
  return `${prefix}-${scope}-${area}`
}

// Examples:
// print-layout-region
// print-layout-state-IN
// print-layout-state-MI
// print-layout-subregion-cleveland
// print-layout-subregion-indianapolis
```

**What's stored per view**:
```typescript
interface ViewLayout {
  legendPositions: Record<ClusterGroupKey, { x: number, y: number }>
  titlePosition: { x: number, y: number }
  mapView: { latitude: number, longitude: number, zoom: number }
}
```

**Shared across all views** (not scoped):
```typescript
interface GlobalPrintSettings {
  paperSize: string           // "letter-landscape", "tabloid", etc.
  labelOptions: LabelOptions  // showCode, showMilestone
}
```

**Flow when switching views**:
1. User selects "Indiana" from scope dropdown
2. Save current view's layout to localStorage
3. Load Indiana's saved layout (or compute defaults if first time)
4. Filter clusters, fit bounds, show relevant legend(s)
5. User adjusts legend position
6. Position auto-saves to Indiana's storage key

#### 5. Page Size Selector

Let users choose paper size to match their intended output:

```typescript
type PaperSize = {
  name: string
  width: number   // inches
  height: number  // inches
  aspect: number  // width / height
}

const paperSizes: PaperSize[] = [
  { name: "Letter", width: 8.5, height: 11, aspect: 0.773 },
  { name: "Letter Landscape", width: 11, height: 8.5, aspect: 1.294 },
  { name: "Tabloid", width: 11, height: 17, aspect: 0.647 },
  { name: "Tabloid Landscape", width: 17, height: 11, aspect: 1.545 },
  { name: "A4", width: 8.27, height: 11.69, aspect: 0.707 },
  { name: "Poster 18×24", width: 18, height: 24, aspect: 0.75 },
  { name: "Poster 24×36", width: 24, height: 36, aspect: 0.667 },
]
```

#### 6. Aspect Ratio Matching (WYSIWYG)

The key to good print UX: **what you see matches what prints**.

```typescript
// Container sized to match paper aspect ratio
function PrintContainer({ paperSize, children }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Fit paper aspect ratio within viewport
    const vw = window.innerWidth
    const vh = window.innerHeight
    const paperAspect = paperSize.width / paperSize.height

    let width, height
    if (vw / vh > paperAspect) {
      // Viewport is wider than paper - constrain by height
      height = vh
      width = vh * paperAspect
    } else {
      // Viewport is taller than paper - constrain by width
      width = vw
      height = vw / paperAspect
    }

    setDimensions({ width, height })
  }, [paperSize])

  return (
    <div style={{ width: dimensions.width, height: dimensions.height }}>
      {children}
    </div>
  )
}
```

#### 7. "On-Page" Visual Indicator

Show users what will print vs what's outside the page boundary:

```
┌────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ← Gray overlay
│░░┌──────────────────────────────────┐░░░░░░│    (screen only)
│░░│                                  │░░░░░░│
│░░│         Printable Area           │░░░░░░│  ← White/visible
│░░│                                  │░░░░░░│
│░░│    [Map with legends]            │░░░░░░│
│░░│                                  │░░░░░░│
│░░└──────────────────────────────────┘░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└────────────────────────────────────────────┘
```

Implementation: Four absolutely-positioned divs around the page container, with `print:hidden` class.

#### 8. Print Toolbar (Implemented)

Slide-up panel from the bottom of the screen with export controls:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              ∨ Print Controls ∨                                  │ ← Collapse toggle
├──────────────────────────────────────────────────────────────────────────────────┤
│  Area: [Full Region ▼]    Paper: [Poster 24×36 ▼]    [History] [Print] [Exit]   │
│                                                                                  │
│  Labels: [✓] Codes  [✓] Milestones  [ ] Names  [ ] Dates                        │
│                                                                                  │
│  ═══════════════════════════════════════════════════════════════════════════════│ ← Timeline (when active)
│  ○ 2011 ────●────────────────────────────────────────────────────────────○ 2025 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Chevron toggle**: Expand/collapse panel (header bar always visible)
- **Area selector**: Region, state, or cluster group view
- **Paper selector**: Letter/Tabloid/A4/Poster presets
- **History button**: Toggle horizontal timeline for historical views
- **Print / Save PDF**: Calls `window.print()` for native browser print dialog
- **Exit button**: Returns to main map (preserves date if timeline active)
- **Label toggles**: Show/hide codes, milestones, names, dates
- **Starts expanded**: Panel opens automatically on navigation to `/print`
- **Slide animation**: Uses `translateY` with 400ms cubic-bezier easing
- **Timeline animation**: Uses CSS Grid `grid-template-rows` for smooth expand/collapse
- **Responsive layout**: Centers controls at narrow widths (below `md` breakpoint)

**Implementation details:**
- Panel has `z-50`, floating buttons have `z-60` (buttons stay above panel)
- Uses `print-hidden` class to hide during actual printing
- Timeline uses separate `HorizontalTimeline` component (not shared with floating timeline)
- Milestone events extracted via `useMilestoneEvents` hook from cluster data

#### 9. Print Instructions

On first visit or via help button, show tips:

> **Printing Tips**
> 1. Click **Print** or press **Cmd+P** (Mac) / **Ctrl+P** (Windows)
> 2. Set **Margins** to "None" for full-bleed output
> 3. Disable **Headers and footers** to remove URL/date
> 4. Choose **Save as PDF** or send directly to printer
> 5. For posters: take PDF to print shop (FedEx, Staples, etc.)

### Implementation Checklist

**Scope & Filtering:**
- [x] Define `ScopeOption` type and options list
- [x] Create `ScopeSelector` dropdown component
- [x] Implement cluster filtering by scope/area
- [ ] Implement bounds calculation for filtered clusters
- [ ] Auto-fit map to computed bounds on scope change

**Label Controls:**
- [x] Add `LabelOptions` state (showCode, showMilestone, showName, showDate)
- [x] Wire toggles to `ClusterText` component via props
- [x] Add checkbox UI to toolbar
- [ ] Persist label options in `print-global-settings`

**Scoped Persistence:**
- [ ] Implement `getStorageKey(prefix, scope, area)` function
- [ ] Migrate existing localStorage to scoped keys
- [ ] Save current layout before switching views
- [ ] Load view-specific layout on scope change
- [ ] Compute smart defaults for first-time views

**Print CSS:**
- [x] Add `@media print` rules to `globals.css`
- [x] Add `print-color-adjust: exact` globally
- [x] Hide toolbar and overlays in print

**Page Size & Layout:**
- [x] Create `PaperSizeSelector` component
- [ ] Create `PrintContainer` with aspect ratio logic
- [ ] Add gray overlay for off-page indicator

**Toolbar & UX:**
- [x] Create `PrintToolbar` component with all controls
- [x] Add print button that calls `window.print()`
- [ ] Add help/tips in overflow menu

**Testing:**
- [ ] Test scope switching preserves/restores layouts
- [ ] Test in Chrome, Safari, Firefox print preview
- [ ] Test PDF output at various paper sizes
- [x] Test each scope option (region, states, groups)

---

## Existing Features (Reference)

### Legend Design

Each cluster group gets its own small legend:

```
┌──────────────────┐
│ Indianapolis     │
├──────────────────┤
│ ██ No PoG        │
│ ██ M1            │
│ ██ M2            │
│ ██ M3            │
└──────────────────┘
```

**Simplifications for print:**
- Combine "No PoG" + "Emerging" (both pre-M1)
- Omit "Reservoir" (it's just darker M3)

### Default Legend Positions

Positioned in typically empty areas (lakes, neighboring states):

| Cluster Group | Default Position | Rationale |
|---------------|------------------|-----------|
| Indianapolis | Left side, upper | Lake Michigan area |
| Grand Rapids | Left side, middle | Upper peninsula area |
| Ann Arbor | Left side, lower | Western empty area |
| Cleveland | Right side, upper | Lake Erie area |
| Columbus | Right side, lower | Kentucky/WV area |

### URL Parameters

Settings can be passed via URL for bookmarking specific views:

```
/print?date=2024-10-01
```

Future params (not yet implemented):
- `scope=state&area=IN` - Filter to specific state
- `paper=tabloid-landscape` - Pre-select paper size

### LocalStorage Keys

**Per-view layout** (scoped by view):
| Key Pattern | Example | Purpose |
|-------------|---------|---------|
| `print-layout-{scope}-{area}` | `print-layout-region` | Legend positions, title position, map view |
| | `print-layout-state-IN` | |
| | `print-layout-subregion-cleveland` | |

**Global settings** (shared across views):
| Key | Purpose |
|-----|---------|
| `print-global-settings` | Paper size, label options |

---

## Deferred: PNG Export Service

> **Status**: Not yet implemented. Browser print to PDF covers the primary use case. This section is retained for future reference if PNG export becomes needed.

### When Would We Need This?

- Users specifically request PNG downloads
- Batch automation (generate all historical views)
- Precise pixel-level control (social media images)
- API-driven exports for other systems

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              map.midwestbahai.org                           │
│              (Static hosting)                               │
│                                                             │
│  /print route works for browser print (Cmd+P)              │
│  Export button → calls export service (if available)       │
└─────────────────────────────────────────────────────────────┘
              │
              │ fetch(`https://export.midwestbahai.org/render`)
              ▼
┌─────────────────────────────────────────────────────────────┐
│           export.midwestbahai.org                           │
│           (Container hosting - optional)                    │
│                                                             │
│  - Docker container running Puppeteer/Chrome               │
│  - Navigates to /print?...&hideToolbar=true                │
│  - Screenshots at requested resolution                      │
│  - Returns PNG binary                                       │
└─────────────────────────────────────────────────────────────┘
```

### Graceful Degradation

If export service is unavailable, the main app still works:
- Hide or disable PNG export button
- Browser print (Cmd+P) always works as fallback

### Service Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/render` | POST | Render map to PNG |

### Deployment Notes

Would require:
- Docker container with Puppeteer/Chrome
- DNS setup for `export.midwestbahai.org`
- Auto-restart on reboot (`restart: unless-stopped`)
- RAM-intensive (~500MB+ per render)

---

## Reference

### Related Files

| File | Purpose |
|------|---------|
| `src/app/print/PrintClient.tsx` | Main print page component |
| `src/app/print/PrintToolbar.tsx` | Slide-up panel with export controls |
| `src/app/print/HorizontalTimeline.tsx` | Horizontal timeline slider for print mode |
| `src/app/print/DraggableLegend.tsx` | Per-group legend component |
| `src/app/print/DraggableBox.tsx` | Generic draggable container |
| `src/app/print/types.ts` | Shared types (LabelOptions) |
| `src/lib/useMilestoneEvents.ts` | Hook to extract milestone events from cluster data |
| `src/components/FloatingControls.tsx` | Unified floating button bar (Print, Layers, Timeline) |
| `src/components/FloatingButton.tsx` | Shared button component + positioning constants |
| `src/components/FloatingTimelineButton.tsx` | Vertical timeline slider for main view |
| `src/map/regionMap.tsx` | Map component with `printMode` support |
| `src/map/clusterColor.ts` | Color functions with print alpha |
| `src/data/clusterGroups.ts` | Cluster group definitions |
| `docs/PRINT-LABELS-ADVANCED.md` | Future: HTML overlay labels for guaranteed visibility |

**Removed files:**
- `src/components/ExportModal.tsx` - Deleted; functionality moved to PrintToolbar
- `src/components/FloatingLayerToggle.tsx` - Deleted; merged into FloatingControls

### ArcGIS Reference Maps

The `moc 2409 *.png` files are handcrafted ArcGIS maps that serve as design reference:

| File | Description |
|------|-------------|
| `moc 2409 region.png` | Full 3-state region |
| `moc 2409 indiana.png` | Indiana-focused view |
| `moc 2409 ohio.png` | Ohio-focused view |
| `moc 2409 michigan.png` | Michigan-focused view |

**Design principles from these maps:**
- Legends in empty areas (lakes, neighboring states)
- One legend per cluster group, vertical list format
- Clean black borders, opaque fills
- County boundaries as thin gray lines
- White background (no base map tiles)

### Open Questions

1. **Legend collision detection**: Warn if legends overlap clusters?
2. **Preset positions**: Offer corner presets (TL, TR, BL, BR)?
3. **Reservoir handling**: Omit from legend, or show with footnote?
