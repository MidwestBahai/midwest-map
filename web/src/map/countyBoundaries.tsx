import type { Expression } from "mapbox-gl"
import { useEffect, useMemo, useState } from "react"
import { Layer, Source } from "react-map-gl/mapbox"
import { matchesScope } from "@/lib/scopeFilter"
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

interface CountyBoundariesProps {
    scope?: string // "region" | "state-OH" | "group-AA" | etc.
    currentDate?: Date
    printMode?: boolean
}

export const CountyBoundaries = ({
    scope = "region",
    currentDate,
    printMode = false,
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

    if (!filteredData) return null

    return (
        <Source type="geojson" data={filteredData}>
            <Layer
                id="county-boundaries"
                type="line"
                beforeId={beforeId}
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
    )
}
