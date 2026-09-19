import type { Feature } from "geojson"
import type { Expression } from "mapbox-gl"
import { Layer, Source } from "react-map-gl/mapbox"
import { useDebug } from "@/app/DebugContext"
import type { LabelOptions } from "@/app/print/types"
import type { LatLongRect } from "@/lib/latLongRect"
import { clusterFillColor, clusterLineColor } from "@/map/clusterColor"
import {
    effectiveClusterMilestone,
    isClusterHighlighted,
} from "@/map/clusterHighlight"
import { ClusterText } from "@/map/clusterText"
import { RectangleLayer } from "@/map/rectangleLayer"
import { useCategoryHighlight } from "./categoryHighlightContext"

// Color for boundaries-only mode (when viewing reference map)
const BOUNDARY_ONLY_COLOR = "#5c4d7d"
// Print mode: black borders for clarity
const PRINT_BORDER_COLOR = "#000000"

// Zoom-responsive line width for print mode
// Makes borders scale proportionally with map size/zoom level
// At zoom 5 (regional): 1.5px, at zoom 7 (state): 3px, at zoom 9 (local): 6px
const PRINT_BORDER_WIDTH: Expression = [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    5,
    1.5,
    7,
    3,
    9,
    6,
]

// Render mode controls which layers are rendered
// "all" = fill + line + symbol (default, legacy behavior)
// "fill" = only fill and line layers
// "symbol" = only symbol/text layer
type RenderMode = "all" | "fill" | "symbol"

export const ClusterLayers = ({
    feature,
    hoverFeature,
    largestRect,
    currentDate,
    boundariesOnly = false,
    printMode = false,
    boldColors = false,
    labelOptions,
    renderMode = "all",
    visible = true,
    printTextSize,
}: {
    feature: Feature
    hoverFeature?: Feature
    largestRect?: LatLongRect
    currentDate: Date
    boundariesOnly?: boolean
    printMode?: boolean
    /** Use bold (print-mode) colors/borders without affecting label style */
    boldColors?: boolean
    labelOptions?: LabelOptions
    renderMode?: RenderMode
    visible?: boolean
    printTextSize?: number
}) => {
    const { showMapGeometry } = useDebug()
    const { categoryHighlight } = useCategoryHighlight()
    // Use cluster code for stable layer IDs (avoids issues when filtering changes indices)
    const clusterCode = feature?.properties?.Cluster ?? "unknown"

    // Milestone at the current date from timeline data
    const { milestone, advancementDate } = effectiveClusterMilestone(
        feature,
        currentDate,
    )
    const highlighted = isClusterHighlighted(
        feature,
        milestone,
        currentDate,
        hoverFeature,
        categoryHighlight,
    )
    const fillLayerId = `cluster-${clusterCode}`
    const symbolLayerId = `symbol-${clusterCode}`

    // For fill/line layers, use opacity with transition for smooth fade
    const fillOpacity = visible ? 1 : 0
    const lineOpacity = visible ? 1 : 0

    // Boundaries-only mode: just show outlines, no fill or labels
    if (boundariesOnly) {
        return (
            <Source type="geojson" data={feature}>
                <Layer
                    type="line"
                    paint={{
                        "line-color": BOUNDARY_ONLY_COLOR,
                        "line-width": 1.5,
                        "line-opacity": visible ? 0.6 : 0,
                        "line-opacity-transition": { duration: 300 },
                    }}
                    id={fillLayerId}
                />
            </Source>
        )
    }

    const shouldRenderFill = renderMode === "all" || renderMode === "fill"
    const shouldRenderSymbol = renderMode === "all" || renderMode === "symbol"

    // Bold colors apply to fills and borders (print mode always implies bold colors)
    const useBoldColors = printMode || boldColors

    return (
        <>
            {shouldRenderFill && (
                <Source type="geojson" data={feature}>
                    {feature.properties && (
                        <Layer
                            type="fill"
                            paint={{
                                "fill-color": clusterFillColor(
                                    feature.properties,
                                    highlighted,
                                    milestone,
                                    useBoldColors,
                                    currentDate,
                                ),
                                "fill-opacity": fillOpacity,
                                "fill-opacity-transition": { duration: 300 },
                            }}
                            id={fillLayerId}
                        />
                    )}
                    {/* In bold/print mode, always show borders; otherwise only when highlighted */}
                    {(highlighted || useBoldColors) && (
                        <Layer
                            type="line"
                            paint={{
                                "line-color": useBoldColors
                                    ? PRINT_BORDER_COLOR
                                    : clusterLineColor(
                                          feature.properties,
                                          highlighted,
                                          milestone,
                                          false,
                                          currentDate,
                                      ),
                                "line-width": useBoldColors
                                    ? PRINT_BORDER_WIDTH
                                    : 3,
                                "line-opacity": lineOpacity,
                                "line-opacity-transition": { duration: 300 },
                            }}
                        />
                    )}
                </Source>
            )}

            {shouldRenderSymbol && largestRect && (
                <ClusterText
                    symbolLayerId={symbolLayerId}
                    largestRect={largestRect}
                    feature={feature}
                    highlighted={highlighted}
                    effectiveMilestone={milestone}
                    advancementDate={advancementDate}
                    printMode={printMode}
                    labelOptions={labelOptions}
                    visible={visible}
                    printTextSize={printTextSize}
                />
            )}

            {shouldRenderFill && largestRect && showMapGeometry && (
                <RectangleLayer
                    rectangle={largestRect}
                    color={clusterFillColor(
                        feature.properties,
                        true,
                        milestone,
                        useBoldColors,
                        currentDate,
                    )}
                />
            )}
        </>
    )
}
