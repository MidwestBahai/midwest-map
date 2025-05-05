import { Layer, Source } from "react-map-gl/mapbox"
import { clusterFillColor, clusterLineColor } from "@/map/clusterColor"
import { useCategoryHighlight } from "./categoryHighlightContext"
import { getClusterGroup } from "@/data/clusterGroups"
import { matchesIncludingReservoir } from "@/data/milestoneLabels"
import { useDebugClusterFeature } from "@/map/useDebugClusterFeature"
import { Feature } from "geojson"
import { LatLongRect } from "@/lib/latLongRect"
import { useMap } from "@/map/mapContext"
import { ClusterText } from "@/map/clusterText"

export const ClusterLayers = ({
    feature, index, hoverFeature, largestRect, debug
}: {
    feature: Feature, index: number, hoverFeature?: Feature, largestRect?: LatLongRect, debug?: boolean
}) => {
    const { categoryHighlight } = useCategoryHighlight()
    const clusterGroup = getClusterGroup(feature?.properties)
    // ensure that undefined is falsy (eg empty string)
    const milestone = `${feature?.properties?.M || ""}`.toLowerCase()
    const milestoneMatches = matchesIncludingReservoir(milestone, categoryHighlight.milestone)
    const highlighted =
        // specific cluster is hovered
        feature?.properties?.Cluster === hoverFeature?.properties?.Cluster
        // both milestone & grouping are highlighted
        || clusterGroup === categoryHighlight.clusterGroup && milestoneMatches
        // only milestone is highlighted
        || !categoryHighlight.clusterGroup && milestoneMatches
        // only grouping is highlighted
        || !categoryHighlight.milestone && clusterGroup === categoryHighlight.clusterGroup
    // const bounds = useMemo(() => featurePolygonBounds(data), [data])
    const fillLayerId = `cluster-${index}`
    const symbolLayerId = `symbol-${index}`

    useDebugClusterFeature(index, "IN-01", feature)
    const map = useMap()
    // const scaleFactor = map?.getScaleFactor()
    // useEffect(() => console.log({scaleFactor}), [scaleFactor])

    return (
        <>
            <Source type="geojson" data={feature}>
                {feature.properties && (
                    <Layer
                        type="fill"
                        paint={{
                            "fill-color": clusterFillColor(feature.properties, highlighted),
                        }}
                        id={fillLayerId}
                    />
                )}
                {highlighted && (
                    <Layer
                        type="line"
                        paint={{
                            "line-color": clusterLineColor(feature.properties, highlighted),
                            "line-width": 3,
                        }}
                    />
                )}
            </Source>

            {largestRect && (
                <ClusterText
                    symbolLayerId={symbolLayerId}
                    largestRect={largestRect}
                    feature={feature}
                    highlighted={highlighted}
                />
            )}

            {largestRect && debug && (
                <Source type="geojson" data={rectToPolygon(largestRect)}>
                    <Layer
                        type="line"
                        paint={{
                            "line-color": clusterLineColor(feature.properties, true),
                            "line-width": 2,
                        }}
                    />
                </Source>
            )}
        </>
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