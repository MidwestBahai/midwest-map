import { useMemo } from "react"
import { GeoJSONFeature } from "zod-geojson"
import { Layer, MapRef, Source } from "react-map-gl"
import { clusterFillColor, clusterLabelColor, clusterLineColor } from "@/map/clusterColor"
import { useCategoryHighlight } from "./categoryHighlightContext"
import { getClusterGroup } from "../data/clusterGroups"
import { matchesIncludingReservoir } from "../data/milestoneLabels"

export const ClusterLayers = ({
    data, index, hoverFeature
}: {
    data: GeoJSONFeature, index: number, hoverFeature?: GeoJSONFeature
}) => {
    const { categoryHighlight } = useCategoryHighlight()
    const clusterGroup = getClusterGroup(data?.properties)
    // ensure that undefined is falsy (eg empty string)
    const milestone = `${data?.properties?.M || ""}`.toLowerCase()
    const milestoneMatches = matchesIncludingReservoir(milestone, categoryHighlight.milestone)
    const highlighted =
        // specific cluster is hovered
        data?.properties?.Cluster === hoverFeature?.properties?.Cluster
        // both milestone & grouping are highlighted
        || clusterGroup === categoryHighlight.clusterGroup && milestoneMatches
        // only milestone is highlighted
        || !categoryHighlight.clusterGroup && milestoneMatches
        // only grouping is highlighted
        || !categoryHighlight.milestone && clusterGroup === categoryHighlight.clusterGroup
    // const bounds = useMemo(() => featurePolygonBounds(data), [data])
    const fillLayerId = `cluster-${index}`
    const symbolLayerId = `symbol-${index}`

    // const map = useMap()
    // useEffect(() => {
    //     const fillLayer = map?.getLayer(fillLayerId)
    //     const symbolLayer = map?.getLayer(symbolLayerId)
    //     if (data.properties?.Cluster === "IN-01")
    //         console.log({fillLayer, symbolLayer, properties: data.properties, map})
    // }, [map, fillLayerId, symbolLayerId, data.properties])

    return (
        <Source type="geojson" data={data}>
            {data.properties && (
                <Layer
                    type="fill"
                    paint={{
                        "fill-color": clusterFillColor(data.properties, highlighted),
                    }}
                    id={fillLayerId}
                />
            )}
            {data.properties && (
                <Layer
                    type="symbol"
                    layout={{
                        "text-field": "{Cluster}\n{M}",
                        "text-size": 13,
                        "text-anchor": "center",
                        // "text-font": ["Roboto Black", "Arial Unicode MS Bold"],
                    }}
                    paint={{
                       "text-color": clusterLabelColor(data.properties, highlighted),
                    }}
                    id={symbolLayerId}
                />
            )}
            {highlighted && (
                <Layer
                    type="line"
                    paint={{
                        "line-color": clusterLineColor(data.properties, highlighted),
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

// TODO Precompute the largest rectangle or circle that fits inside the polygon
// Or maybe see how it works in placements.ts in mapbox-gl-js
// Or is there a way to directly access collisionCircleArray or the placements themselves?
//
// const featurePolygonInnerRect = (feature: GeoJSONFeature): LatLongBounds | undefined => {
//     if (feature.geometry?.type !== "Polygon") return
//     const coords = feature.geometry.coordinates[0]
//
// }
//
// const featurePolygonBounds = (feature: GeoJSONFeature): LatLongBounds | undefined => {
//     if (feature.geometry?.type !== "Polygon") return
//     const coords = feature.geometry.coordinates[0]
//     let minLat = 90, maxLat = -90, minLong = 180, maxLong = -180
//     for (const [long, lat] of coords) {
//         if (lat < minLat) minLat = lat
//         if (lat > maxLat) maxLat = lat
//         if (long < minLong) minLong = long
//         if (long > maxLong) maxLong = long
//     }
//     return {minLat, maxLat, minLong, maxLong}
// }
//
// const featurePolygonPixelsApprox = (feature: GeoJSONFeature, map?: MapRef): heightWidth | undefined => {
//     if (!map) return
//     const bounds = featurePolygonBounds(feature)
//     if (!bounds) return
//     const sw = map.getMap().project([bounds.minLong, bounds.minLat])
//     const ne = map.getMap().project([bounds.maxLong, bounds.maxLat])
// }
//
// interface heightWidth {
//     height: number,
//     width: number,
// }