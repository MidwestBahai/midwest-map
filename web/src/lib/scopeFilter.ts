import type { Feature } from "geojson"

/**
 * Check if a cluster feature matches the scope filter.
 * Returns true if the feature should be visible.
 */
export function matchesScope(
    feature: Feature,
    scope: string | undefined,
): boolean {
    if (!scope || scope === "region") return true

    const clusterCode = feature.properties?.Cluster as string | undefined
    const groupCode = feature.properties?.Group as string | undefined

    if (scope.startsWith("state-")) {
        const stateCode = scope.replace("state-", "")
        return clusterCode?.startsWith(stateCode) ?? false
    }
    if (scope.startsWith("group-")) {
        const targetGroup = scope.replace("group-", "")
        return groupCode === targetGroup
    }
    return true
}
