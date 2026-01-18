import type { Expression } from "mapbox-gl"
import { Layer, Source } from "react-map-gl/mapbox"
import countiesData from "@/data/counties.geo.json"

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
    visible?: boolean
}

export const CountyBoundaries = ({ visible = true }: CountyBoundariesProps) => {
    if (!visible) return null

    return (
        <Source type="geojson" data={countiesData as GeoJSON.FeatureCollection}>
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
