import { GeoJSONFeature } from "zod-geojson"
import { Layer, MapRef, Source } from "react-map-gl"
import { clusterFillColor, clusterLabelColor, clusterLineColor } from "@/app/clusterColor"
import React, { useEffect, useMemo } from "react"
import { useMap } from "@/app/mapContext"

export const ClusterLayers = (props: {
    data: GeoJSONFeature, index: number, hoverFeature?: GeoJSONFeature
}) => {
    const hovered = props.data?.properties?.Cluster === props.hoverFeature?.properties?.Cluster
    const bounds = useMemo(() => featurePolygonBounds(props.data), [props.data])
    const fillLayerId = `cluster-${props.index}`
    const symbolLayerId = `symbol-${props.index}`

    const map = useMap()
    useEffect(() => {
        const fillLayer = map?.getLayer(fillLayerId)
        const symbolLayer = map?.getLayer(symbolLayerId)
        // if (props.data.properties?.Cluster === "IN-01")
        //     console.log({fillLayer, symbolLayer, properties: props.data.properties, map})
    }, [map, fillLayerId, symbolLayerId, props.data.properties])

    return (
        <Source type="geojson" data={props.data}>
            {props.data.properties && (
                <Layer
                    type="fill"
                    paint={{
                        "fill-color": clusterFillColor(props.data.properties, hovered),
                    }}
                    id={fillLayerId}
                />
            )}
            {props.data.properties && (
                <Layer
                    type="symbol"
                    layout={{
                        "text-field": "{Cluster}\n{M}",
                        "text-size": 13,
                        "text-anchor": "center",
                        // "text-font": ["Roboto Black", "Arial Unicode MS Bold"],
                    }}
                    paint={{
                       "text-color": clusterLabelColor(props.data.properties, hovered),
                    }}
                    id={symbolLayerId}
                />
            )}
            {hovered && (
                <Layer
                    type="line"
                    paint={{
                        "line-color": clusterLineColor(props.data.properties, hovered),
                        "line-width": 3,
                    }}
                />
            )}
        </Source>
    )
}

interface LatLongBounds {
    minLat: number,
    maxLat: number,
    minLong: number,
    maxLong: number,
}

// Find the largest rectangle or circle that fits inside the polygon
// Or maybe see how it works in placements.ts in mapbox-gl-js
// Or is there a way to directly access collisionCircleArray or the placements themselves?
const featurePolygonInnerRect = (feature: GeoJSONFeature): LatLongBounds | undefined => {
    if (feature.geometry?.type !== "Polygon") return
    const coords = feature.geometry.coordinates[0]

}

const featurePolygonBounds = (feature: GeoJSONFeature): LatLongBounds | undefined => {
    if (feature.geometry?.type !== "Polygon") return
    const coords = feature.geometry.coordinates[0]
    let minLat = 90, maxLat = -90, minLong = 180, maxLong = -180
    for (const [long, lat] of coords) {
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        if (long < minLong) minLong = long
        if (long > maxLong) maxLong = long
    }
    return {minLat, maxLat, minLong, maxLong}
}

const featurePolygonPixelsApprox = (feature: GeoJSONFeature, map?: MapRef): heightWidth | undefined => {
    if (!map) return
    const bounds = featurePolygonBounds(feature)
    if (!bounds) return
    const sw = map.getMap().project([bounds.minLong, bounds.minLat])
    const ne = map.getMap().project([bounds.maxLong, bounds.maxLat])
}

interface heightWidth {
    height: number,
    width: number,
}