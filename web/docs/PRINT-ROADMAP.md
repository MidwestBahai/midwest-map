# Print Export Roadmap

Planned enhancements for the print/export feature. See the README for what's currently implemented.

## Overview

The print system allows users to generate high-quality printable maps with customizable:
- **Scope**: Full region, single state, or subregion (cluster group area)
- **Legend positioning**: Draggable legends that can be placed in empty map areas
- **Label options**: Toggle cluster code and/or milestone display
- **Date selection**: Current or historical view

---

## Architecture

### Two Entry Points

| Entry Point | Use Case |
|-------------|----------|
| Main app → Export modal | Quick export with preview, size selection, download |
| Direct `/print` route | Fine-tune settings, browser print, or bookmark specific views |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Main App (/)                            │
│                                                                 │
│  [Export Button] ──→ Opens ExportModal                          │
│                      ├── Preview iframe: /print?...             │
│                      ├── Size selector (Letter/Tabloid/Poster)  │
│                      └── Download button → calls export service │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Print Route (/print)                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Print Toolbar (collapsible, hidden during export)       │    │
│  │ Scope: [Region ▼]  Area: [All ▼]  Date: [Jan 2025]     │    │
│  │ Labels: [✓] Code  [✓] Milestone  [Reset legends]        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                    Map Canvas                           │    │
│  │                                                         │    │
│  │   [Draggable Legend 1]          [Draggable Legend 2]   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ (Puppeteer captures)
┌─────────────────────────────────────────────────────────────────┐
│                     Export Service                              │
│  Receives: /print?scope=state&area=IN&legends=...&hideToolbar   │
│  Returns: PNG at requested resolution                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scope Hierarchy

### Three Levels

```
Region (full midwest - IN, MI, OH)
│
├── State
│   ├── Indiana (Indianapolis cluster group)
│   ├── Michigan (Ann Arbor + Grand Rapids cluster groups)
│   └── Ohio (Cleveland + Columbus cluster groups)
│
└── Subregion (single cluster group)
    ├── Indianapolis (centered on IN-01)
    ├── Grand Rapids (western MI)
    ├── Ann Arbor (eastern MI)
    ├── Cleveland (northeast OH + northwest MI border area)
    └── Columbus (central/southern OH)
```

### Cluster Groups by State

| State | Cluster Groups | Notes |
|-------|----------------|-------|
| Indiana | Indianapolis | Single group |
| Michigan | Ann Arbor, Grand Rapids | Two groups |
| Ohio | Cleveland, Columbus | Cleveland extends slightly into MI |

### Bounds Calculation

For each scope, compute bounding box from cluster polygons:

```typescript
function getScopeBounds(scope: Scope, area?: string): LngLatBounds {
  const clusters = getFilteredClusters(scope, area)
  return clusters.reduce((bounds, cluster) => {
    return bounds.extend(getClusterBounds(cluster))
  }, new LngLatBounds())
}
```

---

## Data Model

### PrintSettings Interface

```typescript
interface PrintSettings {
  // Scope & area
  scope: 'region' | 'state' | 'subregion'
  area?: string  // State: 'IN' | 'OH' | 'MI'
                 // Subregion: 'indianapolis' | 'cleveland' | 'ann-arbor' | 'grand-rapids' | 'columbus'

  // Date for timeline
  date: string  // ISO format: '2025-01-14'

  // Legend positioning (one per visible cluster group)
  legends: Record<ClusterGroupKey, LegendPosition>

  // Label display options
  labels: {
    showCode: boolean      // e.g., "IN-01"
    showMilestone: boolean // e.g., "M3"
  }
}

interface LegendPosition {
  x: number      // pixels from left
  y: number      // pixels from top
  visible: boolean
}

type ClusterGroupKey = 'indianapolis' | 'cleveland' | 'ann-arbor' | 'grand-rapids' | 'columbus'
```

### URL Parameter Encoding

All settings are encoded in URL params for Puppeteer compatibility:

```
/print?scope=state
       &area=OH
       &date=2025-01-14
       &legends={"cleveland":{"x":50,"y":100},"columbus":{"x":600,"y":500}}
       &showCode=true
       &showMilestone=true
       &hideToolbar=true
```

### LocalStorage Persistence

Settings persist across sessions via localStorage:

```typescript
// Key: 'print-settings'
// Value: JSON-serialized PrintSettings

const saveSettings = (settings: PrintSettings) => {
  localStorage.setItem('print-settings', JSON.stringify(settings))
}

const loadSettings = (): PrintSettings | null => {
  const stored = localStorage.getItem('print-settings')
  return stored ? JSON.parse(stored) : null
}
```

---

## Legend Design

### Per-Subregion Legends

Each cluster group gets its own small legend (like the ArcGIS reference maps):

```
┌──────────────────┐
│ Indianapolis     │
├──────────────────┤
│ ██ No PoG / Emg  │  ← Combined category
│ ██ M1            │
│ ██ M2            │
│ ██ M3            │
└──────────────────┘
```

### Simplifications for Print

| Change | Rationale |
|--------|-----------|
| Combine "No PoG" + "Emerging" | Both are pre-M1, similar appearance |
| Omit "Reservoir" | All reservoirs are M3, just slightly darker |

### Draggable Implementation

```typescript
interface DraggableLegendProps {
  groupKey: ClusterGroupKey
  position: LegendPosition
  onPositionChange: (pos: {x: number, y: number}) => void
}

// Drag behavior:
// - mousedown on legend header starts drag
// - mousemove updates position
// - mouseup ends drag, saves to state
// - Position clamped to viewport bounds
```

### Default Positions

Sensible defaults based on typical empty areas:

| Cluster Group | Default Position | Rationale |
|---------------|------------------|-----------|
| Indianapolis | bottom-left | Lake Michigan area when showing IN |
| Grand Rapids | top-left | Upper peninsula area |
| Ann Arbor | bottom-right | Ohio area when showing MI |
| Cleveland | top-right | Lake Erie area |
| Columbus | bottom-right | Kentucky/WV area |

---

## Print Toolbar

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ▼ Print Settings                                            [Collapse] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Scope    ┌─────────────┐   Area   ┌─────────────┐                     │
│           │ Region    ▼ │          │ All       ▼ │                     │
│           └─────────────┘          └─────────────┘                     │
│                                                                         │
│  Date     ┌─────────────┐   Labels  [✓] Code  [✓] Milestone            │
│           │ Jan 2025  ▼ │                                              │
│           └─────────────┘                                              │
│                                                                         │
│  Legends  [Reset to defaults]  Tip: Drag legends to reposition         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visibility

- **In browser**: Visible, collapsible
- **During export**: Hidden via `?hideToolbar=true` URL param
- **CSS**: `data-print-toolbar` attribute for easy hiding

---

## Implementation Phases

### Phase 1: URL Params & Basic Settings
- [ ] Parse URL params in `/print` route
- [ ] Add `scope` and `area` params
- [ ] Filter clusters based on scope/area
- [ ] Adjust map bounds for selected scope

### Phase 2: Draggable Legends
- [ ] Refactor PrintLegend to support multiple instances
- [ ] Add drag handlers (mousedown/move/up)
- [ ] Store positions in component state
- [ ] Clamp to viewport bounds

### Phase 3: Print Toolbar
- [ ] Create PrintToolbar component
- [ ] Scope/area dropdowns
- [ ] Label toggle checkboxes
- [ ] Reset legends button
- [ ] Collapsible behavior

### Phase 4: Persistence
- [ ] Save settings to localStorage on change
- [ ] Load settings from localStorage on mount
- [ ] Merge URL params with stored settings (URL wins)

### Phase 5: Export Modal Integration
- [ ] Add scope/area selectors to ExportModal
- [ ] Preview updates as settings change
- [ ] Serialize current settings to URL for Puppeteer

### Phase 6: Polish
- [ ] Default legend positions per scope
- [ ] Smooth drag animation
- [ ] Keyboard accessibility for toolbar
- [ ] Mobile-friendly toolbar layout

---

## Deployment Architecture

### Overview

The system uses a split architecture optimized for reliability and cost:

```
┌─────────────────────────────────────────────────────────────┐
│              map.midwestbahai.org                           │
│              (Static hosting - high reliability)            │
│                                                             │
│  - Statically compiled Next.js (HTML/JS/CSS/JSON)          │
│  - No server-side runtime required                          │
│  - Can be hosted on any static file server or CDN           │
│  - /print route works for browser print (Cmd+P)             │
│  - Always available, fast, zero ongoing compute cost        │
└─────────────────────────────────────────────────────────────┘
              │
              │ fetch(`https://export.midwestbahai.org/render`)
              ▼
┌─────────────────────────────────────────────────────────────┐
│           export.midwestbahai.org                           │
│           (Container hosting - best-effort reliability)     │
│                                                             │
│  - Docker container running Puppeteer/Chrome                │
│  - RAM-intensive (benefits from beefy hardware)             │
│  - Only needed for high-res PNG export                      │
│  - If unavailable, main app still fully functional          │
│  - Browser print always works as fallback                   │
└─────────────────────────────────────────────────────────────┘
```

### Graceful Degradation

The main app checks export service availability before showing the Export button:

```typescript
// On app load or Export button click
const isExportAvailable = await fetch('https://export.midwestbahai.org/health')
  .then(r => r.ok)
  .catch(() => false)

// If unavailable:
// - Hide or disable Export button
// - Show "Use browser print (Cmd+P) as alternative"
// - /print route always works for browser printing
```

### Why This Split?

| Concern | Static Site | Export Service |
|---------|-------------|----------------|
| Availability | Critical (always up) | Best-effort (OK if occasionally down) |
| Scaling | Infinite (CDN) | Limited (single container) |
| Cost | ~Free | RAM/CPU for Puppeteer |
| Complexity | Zero runtime | Docker + Chrome |

### Service Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check, returns `{"status": "ok"}` |
| `/render` | POST | Render map to PNG, returns image binary |

The export service URL (`export.midwestbahai.org`) is resolved via DNS, allowing the backing server to change without code updates.

### Deploying the Export Service

The export service runs as a Docker container with auto-restart. Setup on the container host:

```bash
# Clone repo (one-time)
mkdir -p ~/source && cd ~/source
git clone https://github.com/MidwestBahai/midwest-map.git
cd midwest-map/web

# Start the service (first time or after changes)
docker compose up -d --build export-service

# View logs
docker compose logs -f export-service
```

**Deploy script** (`export-service/deploy.sh`):

```bash
#!/bin/bash
set -e

cd "$(dirname "$0")/.."  # Go to web/ directory
git pull
docker compose up -d --build export-service
docker compose logs --tail=20 export-service
```

**Auto-restart on reboot**: Docker's restart policy handles this. The `compose.yml` should include:

```yaml
export-service:
  restart: unless-stopped
  # ... rest of config
```

**Cron for auto-deploy** (optional, on container host):

```cron
# Deploy export service daily at 4 AM UTC (after main site deploys at 3 AM)
0 4 * * * /home/user/source/midwest-map/web/export-service/deploy.sh >> /var/log/export-deploy.log 2>&1
```

### TODO: Deployment Tasks

- [ ] Add `restart: unless-stopped` to compose.yml export-service
- [ ] Create `export-service/deploy.sh` script
- [ ] Set up DNS: `export.midwestbahai.org` → container host
- [ ] Enable cron on main site host (neo)
- [ ] Set up cron on container host for export service
- [ ] Test end-to-end: push to git → auto-deploy → verify health endpoint

---

## Open Questions

1. **Legend collision detection**: Should we warn if legends overlap clusters?

2. **Preset positions**: Offer corner presets (TL, TR, BL, BR) in addition to free drag?

3. **Multiple legend layout**: For Ohio (2 groups), side-by-side or stacked?

4. **Reservoir handling**:
   - Option A: Omit from legend entirely (current plan)
   - Option B: Show with footnote "* Reservoir clusters shown darker"
   - Option C: Keep in legend for completeness

5. **Historical views**: Should legend positions be date-aware? (Probably not needed)

---

## Reference

### Related Files

- `src/app/print/PrintClient.tsx` - Main print page component
- `src/app/print/PrintLegend.tsx` - Legend component (to be refactored)
- `src/map/regionMap.tsx` - Map component with printMode support
- `src/data/clusterGroups.ts` - Cluster group definitions
- `docs/PRINT-EXPORT-IMPLEMENTATION.md` - Original export service design

### ArcGIS Reference Maps (moc 2409)

The `moc 2409 *.png` files in the project root are **handcrafted maps created in ArcGIS** that serve as the design reference for our print output. These were manually produced for the October 2024 timeframe and represent the "gold standard" we're trying to match.

#### Files

| File | Description |
|------|-------------|
| `moc 2409 region.png` | Full 3-state region with all cluster groups |
| `moc 2409 indiana.png` | Indiana-focused view |
| `moc 2409 ohio.png` | Ohio-focused view |
| `moc 2409 michigan.png` | Michigan-focused view |

#### Design Lessons Learned

**Legend placement:**
- Legends are placed in **empty areas** (Lake Michigan, Lake Erie, neighboring states)
- **Indiana**: Single legend (Indianapolis) in upper-left corner
- **Ohio**: Two separate legends - Cleveland (top-right near Lake Erie), Columbus (bottom-right)
- **Region**: Multiple legends distributed around the map edges
- A human manually found optimal positions - our draggable approach lets users do the same

**Legend format:**
- Simple **vertical list** format (color swatch + label), not a grid
- One legend **per cluster group**, not one giant combined legend
- Shows: No PoG, Emerging, M1, M2, M3 (vertical stack of swatches)

**Labels:**
- Cluster code (e.g., "IN-01") prominently displayed
- City names shown for notable clusters (Indianapolis, Fort Wayne, etc.)
- Clean black borders around all clusters

**Visual style:**
- County boundaries visible as thin gray lines
- Opaque fill colors (not semi-transparent like web view)
- Bold black cluster borders
- White/minimal background (no Mapbox base map tiles)

#### What We're Automating

The ArcGIS maps required manual effort for each update:
1. Export data to ArcGIS
2. Manually position legends in empty spots
3. Adjust for any layout changes
4. Export to PNG

Our web-based approach automates this:
1. Data updates automatically from source
2. User drags legends to preferred positions (persisted)
3. Export via Puppeteer at any resolution
4. Historical views via timeline parameter

### Web App Screenshot

`map-webapp-screenshot.png` shows the interactive web UI for comparison - note the differences in legend style (grid vs. vertical), label detail (multi-line vs. simple), and fill opacity (semi-transparent vs. opaque).
