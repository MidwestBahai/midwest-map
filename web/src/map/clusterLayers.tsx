import { Layer, Source } from "react-map-gl/mapbox"
import { clusterFillColor, clusterLabelColor, clusterLineColor } from "@/map/clusterColor"
import { useCategoryHighlight } from "./categoryHighlightContext"
import { getClusterGroup } from "@/data/clusterGroups"
import { matchesIncludingReservoir } from "@/data/milestoneLabels"
import { useDebugClusterFeature } from "@/map/useDebugClusterFeature"
import { Feature } from "geojson"
import { LatLongRect } from "@/lib/latLongRect"

export const ClusterLayers = ({
    data, index, hoverFeature, largestRect
}: {
    data: Feature, index: number, hoverFeature?: Feature, largestRect?: LatLongRect
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

    useDebugClusterFeature(index, "IN-01", data)

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
            {largestRect && (
                <Source type="geojson" data={rectToPolygon(largestRect)}>
                    <Layer
                        type="line"
                        paint={{
                            "line-color": clusterLineColor(data.properties, true),
                            "line-width": 2,
                        }}
                    />
                </Source>
            )}
        </Source>
    )
}

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

// TODO Precompute the largest rectangle or circle that fits inside the polygon
// interface LatLongBounds {
//     minLat: number,
//     maxLat: number,
//     minLong: number,
//     maxLong: number,
// }
//
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