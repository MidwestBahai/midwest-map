# Label Placement Approaches

This document compares approaches for determining where to place labels inside cluster polygons and how much space is available. This informs both the current Mapbox symbol layer approach and the future HTML overlay approach (see `PRINT-LABELS-ADVANCED.md`).

## Current Approach: Largest Inscribed Rectangle

**Implementation:** `src/script/largestRectangle.ts`

Approximates the largest axis-aligned rectangle that fits inside each cluster polygon using a stochastic algorithm:

1. Pick 10 random interior points (Monte Carlo sampling)
2. Expand each point into a rectangle by growing in all directions until hitting polygon edges
3. Iteratively refine with decreasing step sizes
4. Return the rectangle with the largest area

### Advantages

- **Rectangle matches label shape** — Text labels are naturally rectangular, so knowing the largest rectangle gives a direct fit estimate
- **Supports multi-line labels** — Rectangle width/height ratio helps decide line wrapping
- **Intuitive** — Easy to reason about "will this text fit in this box"

### Disadvantages

- **Stochastic/unstable** — Different runs produce slightly different results due to random starting points, causing noisy git diffs
- **Computationally expensive** — Multiple expansion passes per polygon
- **Overkill for current use** — We don't actually render labels to fill the rectangle; Mapbox handles final placement
- **Axis-aligned only** — Doesn't find rotated rectangles that might fit better in diagonal polygons

### Stabilization

The algorithm was stabilized (see git history) by replacing `Math.random()` with a seeded PRNG using a hash of the polygon coordinates. This ensures:
- Same polygon → same rectangle every time
- Deterministic builds
- Clean git diffs

---

## Alternative Approach: Pole of Inaccessibility (Polylabel)

**Library:** `@mapbox/polylabel`

Finds the point inside a polygon that is farthest from any edge — the "visual center" or pole of inaccessibility.

### How It Works

```typescript
import polylabel from '@mapbox/polylabel'

// polygon is GeoJSON-style coordinates: [[[lng, lat], [lng, lat], ...]]
const result = polylabel(polygon, precision)
// result = [lng, lat, clearance]
// clearance = distance to nearest edge
```

### Advantages

- **Deterministic** — Same input always produces same output, no randomness
- **Fast** — O(n log n) algorithm, well-optimized
- **Battle-tested** — Used by Mapbox internally for their label placement
- **Provides clearance radius** — The distance to nearest edge directly indicates available space
- **Simpler mental model** — One point + radius vs. four rectangle coordinates
- **Works for any polygon shape** — Handles concave, complex shapes naturally

### Disadvantages

- **Circular approximation** — Clearance is a radius, not a rectangle; may underestimate space in elongated polygons
- **Doesn't capture aspect ratio** — A long thin polygon and a square polygon with the same clearance would get the same "space available" estimate
- **Less precise for tight fits** — When label barely fits, rectangle approach gives more accurate bounds

### Use Cases

**Good fit:**
- Quick classification (internal vs external label)
- Approximate "how cramped is this cluster"
- Label anchor point positioning
- Clusters with roughly equilateral shapes

**Less ideal:**
- Precise "will this exact text fit" calculations
- Long thin polygons where a wide short label would fit but clearance radius is small

---

## Comparison

| Aspect | Largest Rectangle | Polylabel |
|--------|-------------------|-----------|
| Output | `{minLat, maxLat, minLong, maxLong}` | `[lng, lat, clearance]` |
| Deterministic | Now yes (with seeded PRNG) | Yes (always) |
| Speed | Slower (iterative) | Fast |
| Space estimate | Rectangle area | Circle area (πr²) |
| Aspect ratio | Yes (width × height) | No (just radius) |
| Implementation | Custom (~200 LOC) | npm package |
| Used by Mapbox | No | Yes |

---

## Recommendation

### Short Term (Current System)

Keep the stabilized largest-rectangle approach. It's working, now deterministic, and rectangle dimensions are useful for the character-width estimation that feeds into Mapbox labels.

### Medium Term (HTML Overlay Labels)

When implementing `PRINT-LABELS-ADVANCED.md`, consider using polylabel for:
- **Label anchor point** — Place label center at pole of inaccessibility
- **Internal/external classification** — If `clearance < threshold`, mark as external label

The rectangle approach could still be used for fine-tuned "will this exact label fit" checks, but polylabel provides a faster first-pass filter.

### Long Term (Hybrid)

A hybrid approach could use:
1. **Polylabel** for anchor point and quick classification
2. **Largest rectangle** only for borderline cases where precise fit matters

This would reduce computation (most clusters are clearly internal or external) while maintaining precision where needed.

---

## Data Structure Evolution

### Current
```typescript
interface ClusterProperties {
  largestClusterRect: LatLongRect  // from largestRectangle algorithm
}
```

### Potential Future
```typescript
interface ClusterProperties {
  // Option A: Replace rectangle with polylabel
  labelPoint: [number, number]  // [lng, lat] pole of inaccessibility
  labelClearance: number        // distance to nearest edge

  // Option B: Keep both (hybrid)
  labelPoint: [number, number]
  labelClearance: number
  largestClusterRect: LatLongRect  // for precise fit checks
}
```

---

## References

- [Polylabel algorithm explanation](https://blog.mapbox.com/a-new-algorithm-for-finding-a-visual-center-of-a-polygon-7c77e6492fbc)
- [@mapbox/polylabel npm package](https://www.npmjs.com/package/@mapbox/polylabel)
- `PRINT-LABELS-ADVANCED.md` — HTML overlay label placement plan
