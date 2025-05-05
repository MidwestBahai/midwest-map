import { Feature, GeoJsonProperties } from "geojson"
import { Layer, Source } from "react-map-gl/mapbox"
import { clusterLabelColor } from "@/map/clusterColor"
import { LatLongRect } from "@/lib/latLongRect"

interface ClusterTextProps {
    feature: Feature,
    largestRect: LatLongRect,
    symbolLayerId: string,
    highlighted: boolean,
}

interface RemRect {
    width: number,
    height: number,
}

// convert lat/lng rectangle to REM units, based on map zoom level
const latLongToRem = (
    rect: LatLongRect,
    zoom: number, // mapbox-gl zoom level
): RemRect => {
    // Mercator projection, so latitude gets stretched, and longitude can be considered rectangular
    const midLat = (rect.minLat + rect.maxLat) * .5
    const latCorrection = 1 / Math.cos(midLat * Math.PI / 180)
    // size the rectangle is rendered in terms of geo units at the equator
    const rectHeight = latCorrection * (rect.maxLat - rect.minLat)
    const rectWidth = rect.maxLong - rect.minLong
    // meters per pixel at the equator
    const scale = Math.pow(2, zoom) * 156543
    return {
        width: rectWidth / scale,
        height: rectHeight / scale,
    }
}

export const ClusterText = (
    {feature, largestRect, symbolLayerId, highlighted}: ClusterTextProps
) => {
    return feature.properties && (
        <Source
            type="geojson"
            data={feature}
        >
            <Layer
                type="symbol"
                layout={{
                    "text-field": "{Cluster}\n{M}",
                    "text-size": 13,
                    "text-anchor": "center",
                    // "text-font": ["Roboto Black", "Arial Unicode MS Bold"],
                }}
                paint={{
                    "text-color": clusterLabelColor(feature.properties, highlighted),
                }}
                id={symbolLayerId}
            />
        </Source>
    )
}