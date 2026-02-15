// Layer modes for the main map view
// - "clusters": Colored cluster polygons on light map background
// - "reference": Boundaries only on detailed street map
// - "bold": Bold colored clusters on white background (like print mode)
export type LayerMode = "clusters" | "reference" | "bold"

export const LAYER_MODES: LayerMode[] = ["clusters", "reference", "bold"]
