import type { Expression } from "mapbox-gl"
import { useEffect, useMemo, useState } from "react"
import { Layer, Source } from "react-map-gl/mapbox"

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
}

/**
 * Check if a county matches the current scope filter.
 * Counties have clusterState and clusterGroup properties from the data pipeline.
 */
function matchesCountyScope(feature: GeoJSON.Feature, scope: string): boolean {
    if (scope === "region") return true

    const props = feature.properties
    if (!props) return false

    if (scope.startsWith("state-")) {
        const stateCode = scope.replace("state-", "")
        return props.clusterState === stateCode
    }
    if (scope.startsWith("group-")) {
        const groupCode = scope.replace("group-", "")
        return props.clusterGroup === groupCode
    }
    return true
}

export const CountyBoundaries = ({
    scope = "region",
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
                matchesCountyScope(feature, scope),
            ),
        } as GeoJSON.FeatureCollection
    }, [scope, countiesData])

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
