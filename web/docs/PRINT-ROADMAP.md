# Print Roadmap

## Current Status

The `/print` route provides a WYSIWYG print editor with:
- Aspect-ratio container matching selected paper size
- Draggable legends and title (positions persist in localStorage)
- Scope/area filtering (region, state, cluster group) with opacity transitions
- Label toggles (codes, milestones, names, dates)
- Paper size selector (Letter through Poster 24×36)
- History timeline for historical views
- Print scaling via CSS `zoom` (fills the page correctly at any paper size)
- Font/legend scaling proportional to container width

See `CLAUDE.md` for component locations and architecture notes.

## Remaining Work

### High Priority

| Feature | Notes |
|---------|-------|
| Scoped persistence | Each view (region, state, group) should save its own legend/title positions and map view. Currently all views share one set of positions. |
| Auto-fit bounds on scope change | When switching to a state/group view, auto-zoom the map to fit the filtered clusters |

### Medium Priority

| Feature | Notes |
|---------|-------|
| Guaranteed labels | All clusters labeled in print; see `PRINT-LABELS-ADVANCED.md` |
| Persist label options | Save label toggle state to localStorage |
| Help/tips | Show printing tips (set margins to None, disable headers/footers, etc.) |

### Low Priority / Deferred

| Feature | Notes |
|---------|-------|
| PNG export service | Puppeteer-based rendering for pixel-perfect PNG output. Browser print-to-PDF covers the primary use case for now. |
| URL params for scope/paper | `/print?scope=state-IN&paper=tabloid` for bookmarkable views |

## Print Scaling Architecture

The on-screen container is sized to fit within the viewport while maintaining the paper's aspect ratio. At print time, CSS `zoom` scales the container to match Chrome's print viewport (96 CSS px per inch × paper width). This is injected dynamically by `usePageSize.ts`.

Trade-off: Map tiles are rasterized at screen resolution and upscaled. HTML elements (legends, title) are re-rasterized sharp by the browser. For poster-sized output, some map tile blur is expected — acceptable for the current use case.
