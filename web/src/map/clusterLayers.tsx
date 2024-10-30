import { GeoJSONFeature } from "zod-geojson"
import { Layer, Source } from "react-map-gl"
import { clusterFillColor, clusterLabelColor, clusterLineColor } from "@/map/clusterColor"
import { useCategoryHighlight } from "./categoryHighlightContext"
import { getClusterGroup } from "../data/clusterGroups"
import { matchesIncludingReservoir } from "../data/milestoneLabels"
import { useEffect } from "react"

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
    const fillLayerId = `cluster-${index}`
    const symbolLayerId = `symbol-${index}`

    // useEffect(() => {
    //     if (data.properties?.Cluster === "IN-01") console.log({data})
    // }, [data])

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
