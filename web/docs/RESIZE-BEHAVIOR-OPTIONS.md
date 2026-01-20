# Print Mode Resize Behavior Options

Planned options for handling window resize in print mode. Not yet implemented.

## Current Behavior

- **Legends/Title**: Fixed pixel positions relative to top-left corner. Stay in place during resize.
- **Map**: Keeps geographic center fixed. Visual content shifts as viewport expands/contracts around the center point.

This creates a mismatch: UI elements stay anchored to top-left while the map content shifts.

---

## Option 1: Anchor Map to Corner

Keep the map's top-left geographic point fixed during resize, matching legend behavior.

**How it works:**
- Track the previous window size
- On resize, calculate the geographic offset needed to keep the top-left corner stationary
- Adjust the center coordinates accordingly

**Math:**
```
degreesPerPixelX = 360 / (256 * 2^zoom) / cos(latitude)
degreesPerPixelY = 360 / (256 * 2^zoom)

When viewport changes from (w1, h1) to (w2, h2):
newCenterLng = oldCenterLng + (w2 - w1) / 2 * degreesPerPixelX
newCenterLat = oldCenterLat - (h2 - h1) / 2 * degreesPerPixelY
```

**Pros:**
- Map and legends behave consistently
- Intuitive for print layout work
- No changes needed to legend positioning

**Cons:**
- Requires tracking previous viewport size
- Math gets slightly complex at different zoom levels
- Edge case: could pan map out of desired region if window grows significantly

---

## Option 2: Lock Viewport Size

In print mode, ignore window resize entirely. Keep map at its initial render size.

**How it works:**
- Capture initial window dimensions on mount
- Use those fixed dimensions for the map regardless of actual window size
- Could show a "resize locked" indicator or allow manual size selection

**Pros:**
- Simplest implementation
- Guaranteed consistent output
- Good for "what you see is what you export" workflow

**Cons:**
- Awkward if user wants to change export dimensions
- May need UI to manually set target dimensions
- Scrollbars or clipping if window shrinks below locked size

---

## Option 3: Fit to Bounds (Zoom on Resize)

Store the visible geographic bounding box. On resize, adjust zoom to maintain those bounds.

**How it works:**
- Capture the visible lat/lng bounds when user finishes positioning
- On resize, call `map.fitBounds()` to maintain coverage of those bounds
- Zoom level changes to accommodate new viewport dimensions

**Pros:**
- Always shows the same geographic area
- Natural behavior for "I want to see this region"

**Cons:**
- Zoom level changes, affecting label sizes and detail
- Would need to also scale legend positions proportionally (see below)
- Text/labels may become too small or too large

---

## Related: Legend Positioning Strategies

### Current: Fixed Pixel Positions
- Legends at (x, y) pixels from top-left
- Font size fixed (e.g., `text-xs`)
- Position persisted as pixels in localStorage

### Alternative: Proportional Positions
- Legends at (x%, y%) of viewport
- Position stored as percentages
- Automatically adapts to different viewport sizes

**Implementation:**
```typescript
// Store as percentages
position: { xPercent: 3, yPercent: 15 }

// Convert to pixels for rendering
x = (xPercent / 100) * viewportWidth
y = (yPercent / 100) * viewportHeight
```

### Alternative: Proportional Sizing
- Legend box size as percentage of viewport
- Font size scales with viewport (e.g., `clamp(10px, 1.2vw, 14px)`)
- Color swatches scale proportionally

**Considerations:**
- Pairs well with Option 3 (fit to bounds)
- Maintains visual balance at different export sizes
- May need min/max constraints to stay readable

---

## Recommended Combinations

| Map Behavior | Legend Position | Legend Size | Best For |
|--------------|-----------------|-------------|----------|
| Corner anchor (1) | Fixed pixels | Fixed | Current workflow, predictable |
| Fit to bounds (3) | Proportional % | Proportional | Flexible export sizes |
| Lock viewport (2) | Fixed pixels | Fixed | Exact reproducibility |

---

## Implementation Notes

### For Option 1 (Corner Anchor)
- Add `useRef` to track previous window size in `PrintClient.tsx`
- In resize effect, calculate new center before updating view state
- Could use Mapbox's `map.project()` / `map.unproject()` for accurate conversion

### For Option 3 (Fit to Bounds)
- Add "lock bounds" button or auto-capture after idle
- Store bounds in localStorage alongside view state
- On resize, use `map.fitBounds(storedBounds, { padding: 0 })`

### For Proportional Legends
- Change `LegendPosition` from `{ x, y }` to `{ xPercent, yPercent }`
- Update `DraggableBox` to accept either mode
- Convert on drag: `newPercent = (newPixel / viewport) * 100`
- Migration: convert existing localStorage values on load
