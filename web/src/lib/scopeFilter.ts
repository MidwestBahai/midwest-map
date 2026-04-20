import type { Feature } from "geojson"
import { getClusterGroupAtDate } from "@/data/clusterGroups"

/**
 * Check if a feature (cluster or county) matches the scope filter.
 * Works with both cluster properties (Cluster, Group) and county properties
 * (clusterCode, clusterState, clusterGroup).
 */
export function matchesScope(
    feature: Feature,
    scope: string | undefined,
    date?: Date,
): boolean {
    if (!scope || scope === "region") return true

    const props = feature.properties
    const clusterCode = (props?.Cluster ?? props?.clusterCode) as
        | string
        | undefined

    if (scope.startsWith("state-")) {
        const stateCode = scope.replace("state-", "")
        // Counties have clusterState directly; clusters use code prefix
        return (
            props?.clusterState === stateCode ||
            (clusterCode?.startsWith(stateCode) ?? false)
        )
    }
    if (scope.startsWith("group-")) {
        const targetGroup = scope.replace("group-", "")
        const effectiveGroup = date
            ? getClusterGroupAtDate(props, date)
            : ((props?.Group ?? props?.clusterGroup) as string | undefined)
        return effectiveGroup === targetGroup
    }
    return true
}
