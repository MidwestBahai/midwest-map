import type { Expression } from "mapbox-gl"
import { useEffect, useMemo, useState } from "react"
import { Layer, Source } from "react-map-gl/mapbox"
import { matchesScope } from "@/lib/scopeFilter"

// Style for county boundaries in print mode
// Darker gray and wider line for better visibility in print
const COUNTY_LINE_COLOR = "#555555"
const COUNTY_LINE_OPACITY = 0.8

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
}

export const CountyBoundaries = ({
    scope = "region",
    currentDate,
}: CountyBoundariesProps) => {
    const [countiesData, setCountiesData] =
        useState<GeoJSON.FeatureCollection | null>(null)

    useEffect(() => {
        import("@/data/counties.geo.json").then((mod) => {
            setCountiesData(mod.default as GeoJSON.FeatureCollection)
        })
    }, [])

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
                paint={{
                    "line-color": COUNTY_LINE_COLOR,
                    "line-width": COUNTY_LINE_WIDTH,
                    "line-opacity": COUNTY_LINE_OPACITY,
                }}
            />
        </Source>
    )
}
