import type { Feature } from "geojson"
import { getClusterGroupAtDate } from "@/data/clusterGroups"
import {
    getMilestoneAtDate,
    type TimelineEntry,
} from "@/data/getMilestoneAtDate"
import { isReservoir, matchesIncludingReservoir } from "@/data/milestoneLabels"
import type { CategoryHighlight } from "@/map/categoryHighlightContext"

/**
 * Milestone in effect for a cluster at a date, keeping the reservoir suffix
 * from the shapefile's M property when the base milestone hasn't changed
 * (the timeline only tracks M1/M2/M3, so the suffix would otherwise be lost).
 */
export const effectiveClusterMilestone = (feature: Feature, date: Date) => {
    const props = feature.properties
    const { milestone, advancementDate } = getMilestoneAtDate(
        `${props?.M || "N"}`,
        props?.timeline as TimelineEntry[] | undefined,
        date,
    )
    const rawM = `${props?.M || ""}`.toLowerCase()
    const base = milestone.toLowerCase()
    return {
        milestone:
            isReservoir(rawM) && rawM.replace("r", "") === base ? rawM : base,
        advancementDate,
    }
}

/**
 * Whether a cluster is highlighted: either hovered directly, or matching the
 * milestone and/or group currently highlighted from the map key.
 */
export const isClusterHighlighted = (
    feature: Feature,
    milestone: string,
    date: Date,
    hoverFeature: Feature | undefined,
    categoryHighlight: CategoryHighlight,
) => {
    const clusterGroup = getClusterGroupAtDate(feature.properties, date)
    const milestoneMatches = matchesIncludingReservoir(
        milestone,
        categoryHighlight.milestone,
    )
    return (
        // specific cluster is hovered
        feature.properties?.Cluster === hoverFeature?.properties?.Cluster ||
        // both milestone & grouping are highlighted
        (clusterGroup === categoryHighlight.clusterGroup && milestoneMatches) ||
        // only milestone is highlighted
        (!categoryHighlight.clusterGroup && milestoneMatches) ||
        // only grouping is highlighted
        (!categoryHighlight.milestone &&
            clusterGroup === categoryHighlight.clusterGroup)
    )
}
