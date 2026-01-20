import type { GeoJsonProperties } from "geojson"

export const clusterGroups = {
    AA: {
        displayName: "Washtenaw",
        baseHue: 200,
    },
    GR: {
        displayName: "Grand Rapids",
        baseHue: 80,
    },
    INDY: {
        displayName: "Indianapolis",
        baseHue: 350,
    },
    CLV: {
        displayName: "Cleveland",
        baseHue: 140,
    },
    CBUS: {
        displayName: "Columbus",
        baseHue: 280,
    },
    Unknown: {
        displayName: "Unknown",
        baseHue: 0,
    },
}

export type ClusterGroup = keyof typeof clusterGroups

const logged = new Set<string>()

export const getClusterGroup = (
    properties: GeoJsonProperties,
): ClusterGroup => {
    const group = `${properties?.Group}`
    if (group in clusterGroups) return group as ClusterGroup
    if (!logged.has(group)) {
        console.warn(`Unknown cluster group: ${group}`)
        logged.add(group)
    }
    return "Unknown"
}
