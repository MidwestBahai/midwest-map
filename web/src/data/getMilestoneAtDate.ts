export interface MilestoneAtDate {
    milestone: string
    advancementDate: Date | null  // null if base state (no advancement yet)
}

/**
 * Calculate the milestone status of a cluster at a given point in time.
 *
 * @param currentMilestone - The cluster's current milestone (from shapefile `M` property)
 * @param timeline - Array of advancement events, each with milestone and date
 * @param targetDate - The date to calculate milestone for
 * @returns The milestone status and advancement date at the target date
 */
export function getMilestoneAtDate(
    currentMilestone: string,
    timeline: Array<{ milestone: string; date: string }> | undefined,
    targetDate: Date
): MilestoneAtDate {
    // Clusters without timeline data never advanced - use their current milestone
    if (!timeline || timeline.length === 0) {
        return { milestone: currentMilestone, advancementDate: null }
    }

    // Find all advancements that occurred on or before the target date
    const targetTime = targetDate.getTime()
    const applicableAdvancements = timeline.filter(entry => {
        const entryDate = new Date(entry.date)
        return entryDate.getTime() <= targetTime
    })

    // Before any advancement, clusters start at Emerging
    if (applicableAdvancements.length === 0) {
        return { milestone: "E", advancementDate: null }
    }

    // Return the most recent advancement's milestone
    // Timeline entries are assumed to be in chronological order, but sort to be safe
    const sorted = [...applicableAdvancements].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return {
        milestone: sorted[0].milestone,
        advancementDate: new Date(sorted[0].date)
    }
}
