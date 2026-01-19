import type { GeoJsonProperties } from "geojson"

export const clusterGroups = {
    AA: {
        cities: ["Ann Arbor", "Detroit", "Flint"],
        baseHue: 200,
    },
    GR: {
        cities: ["Grand Rapids"],
        baseHue: 80,
    },
    INDY: {
        cities: ["Indianapolis"],
        baseHue: 350,
    },
    CLV: {
        cities: ["Cleveland"],
        baseHue: 140,
    },
    CBUS: {
        cities: ["Columbus"],
        baseHue: 280,
    },
    Unknown: {
        cities: [],
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
