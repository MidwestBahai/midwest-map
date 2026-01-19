/**
 * Shared configuration for timeline components.
 * Single source of truth for visual styling and behavior.
 */

// Colors
export const TIMELINE_COLORS = {
    track: "#e5e7eb",
    yearCircleStroke: "#d1d5db",
    yearCircleStrokeHover: "#9ca3af",
    yearText: "#374151",
    dragCircle: "#3b82f6",
    progress: "#3b82f6",
    milestoneDefault: "#fb923c",
} as const

// Strokes
export const TIMELINE_STROKES = {
    line: 2,
    circle: 2,
    closeX: 1.5,
} as const

// Typography
export const TIMELINE_TYPOGRAPHY = {
    yearFontSize: 12,
    yearFontWeight: "600",
    dragLabelFontSize: 11,
} as const

// Milestone marker
export const MILESTONE_MARKER_RADIUS = 3

/**
 * Calculate progress (0-1) for a date within a date range.
 * Clamped to [0, 1].
 */
export function calculateDateProgress(
    currentDate: Date,
    startDate: Date,
    endDate: Date,
): number {
    const totalRange = endDate.getTime() - startDate.getTime()
    if (totalRange <= 0) return 0

    const elapsed = currentDate.getTime() - startDate.getTime()
    return Math.max(0, Math.min(1, elapsed / totalRange))
}

/**
 * Calculate a date from progress (0-1) within a date range.
 */
export function dateFromProgress(
    progress: number,
    startDate: Date,
    endDate: Date,
): Date {
    const clampedProgress = Math.max(0, Math.min(1, progress))
    const totalRange = endDate.getTime() - startDate.getTime()
    return new Date(startDate.getTime() + clampedProgress * totalRange)
}
