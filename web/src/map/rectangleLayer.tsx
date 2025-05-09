import { LatLongRect } from "@/lib/latLongRect"
import { Feature } from "geojson"
import { Layer, Source } from "react-map-gl/mapbox"

export const RectangleLayer = ({rectangle, color}: {
    rectangle: LatLongRect,
    color: string,
}) => (
    <Source type="geojson" data={rectToPolygon(rectangle)}>
        <Layer
            type="line"
            paint={{
                "line-color": color,
                "line-width": 2,
            }}
        />
    </Source>
)

const rectToPolygon = (rect: LatLongRect): Feature => ({
    type: "Feature",
    properties: {},
    geometry: {
        type: "Polygon",
        coordinates: [[
            [rect.minLong, rect.minLat],
            [rect.minLong, rect.maxLat],
            [rect.maxLong, rect.maxLat],
            [rect.maxLong, rect.minLat],
            [rect.minLong, rect.minLat],
        ]],
    },
})