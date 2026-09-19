import pointOnFeature from "@turf/point-on-feature"
import type { Feature } from "geojson"
import type { Expression } from "mapbox-gl"
import { useEffect, useMemo, useState } from "react"
import { Layer, Source } from "react-map-gl/mapbox"
import { matchesScope } from "@/lib/scopeFilter"
import { useCategoryHighlight } from "@/map/categoryHighlightContext"
import { clusterLabelColor } from "@/map/clusterColor"
import {
    effectiveClusterMilestone,
    isClusterHighlighted,
} from "@/map/clusterHighlight"
import { useMap } from "@/map/mapContext"

// Print mode: darker gray and higher opacity for visibility on paper
const PRINT_LINE_COLOR = "#555555"
const PRINT_LINE_OPACITY = 0.8

// Screen mode: lighter so lines don't overpower colored cluster fills
const SCREEN_LINE_COLOR = "#8a8a8a"
const SCREEN_LINE_OPACITY = 0.45

// Zoom-responsive line width for county boundaries
// Scales proportionally with map size: thinner when zoomed out, thicker when zoomed in
const COUNTY_LINE_WIDTH: Expression = [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    5,
    0.5,
    7,
    1,
    9,
    2,
]

// County name labels: small, quiet, uppercase so they read as a different
// kind of thing than cluster labels. Each label takes the same light/dark
// color as its cluster's label so it stays legible over the darker milestone
// fills, and flips along with it when the cluster is highlighted (hovered or
// picked from the map key). Hidden when zoomed out to the region overview.
const NAME_MIN_ZOOM = 6.5
const NAME_TEXT_SIZE: Expression = [
    "interpolate",
    ["linear"],
    ["zoom"],
    NAME_MIN_ZOOM,
    9,
    9,
    12,
]

interface CountyBoundariesProps {
    scope?: string // "region" | "state-OH" | "group-AA" | etc.
    currentDate?: Date
    printMode?: boolean
    // Show county boundary lines (visibility-toggled so layer order is stable)
    showLines?: boolean
    // Show county names as a label layer beneath the cluster labels
    showNames?: boolean
    // Cluster features, used to pick a light or dark label color per county
    // from the fill it sits on. Omit when cluster fills aren't drawn.
    clusterFeatures?: Feature[]
    // Hovered cluster, whose fill lightens so its labels turn dark
    hoverFeature?: Feature
}

export const CountyBoundaries = ({
    scope = "region",
    currentDate,
    printMode = false,
    showLines = true,
    showNames = false,
    clusterFeatures,
    hoverFeature,
}: CountyBoundariesProps) => {
    const [countiesData, setCountiesData] =
        useState<GeoJSON.FeatureCollection | null>(null)
    // Mapbox appends a layer to the top of the stack unless given a beforeId,
    // and JSX order doesn't help because this layer mounts after the cluster
    // layers (toggled on later, and data arrives asynchronously). In screen
    // mode we slot it beneath the first cluster label layer so labels stay
    // readable. In print mode it mounts first and belongs at the bottom.
    const [beforeId, setBeforeId] = useState<string | undefined>(undefined)
    const { map } = useMap()
    const { categoryHighlight } = useCategoryHighlight()

    useEffect(() => {
        import("@/data/counties.geo.json").then((mod) => {
            if (!printMode) {
                const firstSymbolLayer = map
                    ?.getMap()
                    .getStyle()
                    ?.layers.find((layer) => layer.id.startsWith("symbol-"))
                setBeforeId(firstSymbolLayer?.id)
            }
            setCountiesData(mod.default as GeoJSON.FeatureCollection)
        })
    }, [map, printMode])

    const filteredData = useMemo(() => {
        if (!countiesData) return null

        if (scope === "region") {
            return countiesData
        }

        return {
            ...countiesData,
            features: countiesData.features.filter((feature) =>
                matchesScope(feature, scope, currentDate),
            ),
        } as GeoJSON.FeatureCollection
    }, [scope, countiesData, currentDate])

    // One label point per county. Mapbox anchors point symbols on polygons at
    // a per-tile centroid, so a county split across tiles can get an offset or
    // duplicated label; precomputed points avoid that.
    const labelPoints = useMemo(() => {
        if (!filteredData || !showNames) return null

        return {
            type: "FeatureCollection",
            features: filteredData.features.map((feature) => ({
                type: "Feature",
                geometry: pointOnFeature(feature as GeoJSON.Feature).geometry,
                properties: {
                    name: feature.properties?.NAME,
                    clusterCode: feature.properties?.clusterCode,
                },
            })),
        } as GeoJSON.FeatureCollection
    }, [filteredData, showNames])

    // Label color per cluster, matching clusterText's light/dark choice for
    // the milestone in effect at the current date and the highlight state.
    // Built as a paint expression so hovering only restyles the layer rather
    // than regenerating the label geometry.
    const labelColor = useMemo((): Expression => {
        const date = currentDate ?? new Date()
        const colorByCluster: Array<string> = []
        for (const cluster of clusterFeatures ?? []) {
            const code = cluster.properties?.Cluster
            if (!code) continue
            const { milestone } = effectiveClusterMilestone(cluster, date)
            const highlighted = isClusterHighlighted(
                cluster,
                milestone,
                date,
                hoverFeature,
                categoryHighlight,
            )
            colorByCluster.push(
                code,
                clusterLabelColor(cluster.properties, highlighted, milestone),
            )
        }
        // match needs at least one branch; fall through to black otherwise
        if (colorByCluster.length === 0) return ["literal", "black"]
        return ["match", ["get", "clusterCode"], ...colorByCluster, "black"]
    }, [clusterFeatures, currentDate, hoverFeature, categoryHighlight])

    if (!filteredData) return null

    return (
        <>
            {labelPoints && (
                <Source type="geojson" data={labelPoints}>
                    <Layer
                        id="county-names"
                        type="symbol"
                        beforeId={beforeId}
                        minzoom={NAME_MIN_ZOOM}
                        layout={{
                            "text-field": ["get", "name"],
                            "text-size": NAME_TEXT_SIZE,
                            "text-font": [
                                "Open Sans Italic",
                                "Arial Unicode MS Regular",
                            ],
                            "text-transform": "uppercase",
                            "text-letter-spacing": 0.1,
                            "text-anchor": "center",
                            "text-padding": 4,
                        }}
                        paint={{
                            "text-color": labelColor,
                        }}
                    />
                </Source>
            )}
            <Source type="geojson" data={filteredData}>
                <Layer
                    id="county-boundaries"
                    type="line"
                    beforeId={beforeId}
                    layout={{ visibility: showLines ? "visible" : "none" }}
                    paint={{
                        "line-color": printMode
                            ? PRINT_LINE_COLOR
                            : SCREEN_LINE_COLOR,
                        "line-width": COUNTY_LINE_WIDTH,
                        "line-opacity": printMode
                            ? PRINT_LINE_OPACITY
                            : SCREEN_LINE_OPACITY,
                    }}
                />
            </Source>
        </>
    )
}
