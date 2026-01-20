import type { Feature } from "geojson"
import { useMemo } from "react"
import validatedData from "@/data/clusters-timeline.geo.json"
import type { TimelineEntry } from "@/data/getMilestoneAtDate"

export interface MilestoneEvent {
    date: Date
    label: string
    color?: string
}

/**
 * Extract milestone events from cluster data for timeline markers.
 * Returns an array of events with dates and labels.
 */
export function useMilestoneEvents(): MilestoneEvent[] {
    return useMemo(() => {
        const features = validatedData.features as Feature[]
        const events: MilestoneEvent[] = []
        for (const feature of features) {
            const timeline = feature.properties?.timeline as
                | TimelineEntry[]
                | undefined
            const clusterName = feature.properties?.Cluster as
                | string
                | undefined
            if (timeline && clusterName) {
                for (const entry of timeline) {
                    events.push({
                        date: new Date(entry.date),
                        label: `${clusterName}: ${entry.milestone}`,
                    })
                }
            }
        }
        return events
    }, [])
}

/**
 * Get the timeline bounds from the GeoJSON data.
 */
export function getTimelineBounds() {
    return {
        startDate: new Date(validatedData.timelineBounds.minDate),
        endDate: new Date(validatedData.timelineBounds.maxDate),
    }
}
