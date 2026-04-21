import type { GeoJsonProperties } from "geojson"

export interface GroupInfo {
    displayName: string
    baseHue: number
}

export interface GroupingScheme {
    id: string
    displayName: string
    effectiveDate: string
    groups: Record<string, GroupInfo>
}

/** Date when the 2026 grouping scheme takes effect and Emerging merges into No PoG. */
export const REGROUPING_DATE = new Date("2026-03-15")

/** Ordered by effectiveDate ascending. */
export const groupingSchemes: GroupingScheme[] = [
    {
        id: "legacy",
        displayName: "Original Groupings",
        effectiveDate: "2000-01-01",
        groups: {
            AA: { displayName: "Washtenaw", baseHue: 200 },
            GR: { displayName: "Grand Rapids", baseHue: 80 },
            INDY: { displayName: "Indianapolis", baseHue: 350 },
            CLV: { displayName: "Cleveland", baseHue: 140 },
            CBUS: { displayName: "Columbus", baseHue: 280 },
        },
    },
    {
        id: "2026",
        displayName: "2026 Groupings",
        effectiveDate: "2026-03-15",
        groups: {
            NOH: { displayName: "Northern Ohio", baseHue: 140 },
            SOH: { displayName: "Southern Ohio", baseHue: 320 },
            NIN: { displayName: "Northern Indiana", baseHue: 5 },
            SIN: { displayName: "Southern Indiana", baseHue: 200 },
            WMI: { displayName: "Western Michigan", baseHue: 260 },
            EMI: { displayName: "Eastern Michigan", baseHue: 95 },
        },
    },
]

/** Flattened lookup of group code → GroupInfo across all schemes. */
const allGroups: Record<string, GroupInfo> = {}
for (const scheme of groupingSchemes) {
    for (const [code, info] of Object.entries(scheme.groups)) {
        allGroups[code] = info
    }
}

const unknownGroup: GroupInfo = { displayName: "Unknown", baseHue: 0 }

/** Look up GroupInfo for any group code across all schemes. */
export function getGroupInfo(groupCode: string): GroupInfo {
    return allGroups[groupCode] ?? unknownGroup
}

/** Get the active grouping scheme for a given date. */
export function getActiveScheme(date: Date): GroupingScheme {
    const t = date.getTime()
    let active = groupingSchemes[0]
    for (const scheme of groupingSchemes) {
        if (new Date(scheme.effectiveDate).getTime() <= t) {
            active = scheme
        } else {
            break
        }
    }
    return active
}

interface GroupTimelineEntry {
    group: string
    from: string
}

/** Resolve the active group for a cluster at a given date using its groupTimeline. */
export function getClusterGroupAtDate(
    properties: GeoJsonProperties,
    date: Date,
): string {
    const timeline = properties?.groupTimeline as
        | GroupTimelineEntry[]
        | undefined
    if (!timeline || timeline.length === 0) {
        // Fallback to static Group field
        return `${properties?.Group ?? "Unknown"}`
    }
    const t = date.getTime()
    let active = timeline[0].group
    for (const entry of timeline) {
        if (new Date(entry.from).getTime() <= t) {
            active = entry.group
        } else {
            break
        }
    }
    return active
}

// --- Backward-compatible exports ---

/**
 * Legacy flat record for code that doesn't need date-awareness.
 * Maps all known group codes across all schemes plus Unknown.
 * @deprecated Prefer getGroupInfo() or getActiveScheme() for new code.
 */
export const clusterGroups: Record<string, GroupInfo> = {
    ...allGroups,
    Unknown: unknownGroup,
}

export type ClusterGroup = string

const logged = new Set<string>()

/** Get the static Group from properties (latest/current group). */
export const getClusterGroup = (properties: GeoJsonProperties): string => {
    const group = `${properties?.Group}`
    if (group in allGroups) return group
    if (!logged.has(group)) {
        console.warn(`Unknown cluster group: ${group}`)
        logged.add(group)
    }
    return "Unknown"
}
