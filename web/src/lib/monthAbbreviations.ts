/**
 * Month abbreviations used across timeline components.
 * Single source of truth for consistent month display.
 */
export const MONTH_ABBREVIATIONS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
] as const

export type MonthAbbreviation = (typeof MONTH_ABBREVIATIONS)[number]

/**
 * Get the abbreviated month name for a date.
 */
export function getMonthAbbreviation(date: Date): MonthAbbreviation {
    return MONTH_ABBREVIATIONS[date.getMonth()]
}
