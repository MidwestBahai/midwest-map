import { Layer, Source } from "react-map-gl/mapbox"
import { clusterFillColor, clusterLineColor } from "@/map/clusterColor"
import { useCategoryHighlight } from "./categoryHighlightContext"
import { getClusterGroup } from "@/data/clusterGroups"
import { matchesIncludingReservoir } from "@/data/milestoneLabels"
import { getMilestoneAtDate, TimelineEntry } from "@/data/getMilestoneAtDate"
import { Feature } from "geojson"
import { LatLongRect } from "@/lib/latLongRect"
import { ClusterText } from "@/map/clusterText"
import { useDebug } from "@/app/DebugContext"
import { RectangleLayer } from "@/map/rectangleLayer"

export const ClusterLayers = ({
    feature, index, hoverFeature, largestRect, currentDate
}: {
    feature: Feature, index: number, hoverFeature?: Feature, largestRect?: LatLongRect, currentDate: Date
}) => {
    const { showMapGeometry } = useDebug()
    const { categoryHighlight } = useCategoryHighlight()
    const clusterGroup = getClusterGroup(feature?.properties)

    // Calculate milestone at the current date from timeline data
    const initialMilestone = `${feature?.properties?.M || "N"}`
    const timeline = feature?.properties?.timeline as TimelineEntry[] | undefined
    const { milestone: effectiveMilestone, advancementDate } = getMilestoneAtDate(initialMilestone, timeline, currentDate)

    // Use effective milestone for display (lowercase for comparison)
    const milestone = effectiveMilestone.toLowerCase()
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

    // useDebugClusterFeature(index, "IN-01", feature)
    // const scaleFactor = map?.getScaleFactor()
    // useEffect(() => console.log({scaleFactor}), [scaleFactor])

    return (
        <>
            <Source type="geojson" data={feature}>
                {feature.properties && (
                    <Layer
                        type="fill"
                        paint={{
                            "fill-color": clusterFillColor(feature.properties, highlighted, effectiveMilestone),
                        }}
                        id={fillLayerId}
                    />
                )}
                {highlighted && (
                    <Layer
                        type="line"
                        paint={{
                            "line-color": clusterLineColor(feature.properties, highlighted, effectiveMilestone),
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
                    effectiveMilestone={effectiveMilestone}
                    advancementDate={advancementDate}
                />
            )}

            {largestRect && showMapGeometry && (
                <RectangleLayer
                    rectangle={largestRect}
                    color={clusterFillColor(feature.properties, true, effectiveMilestone)}
                />
            )}
        </>
    )
}
