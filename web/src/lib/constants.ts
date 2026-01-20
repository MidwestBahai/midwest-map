/**
 * Shared constants for the application.
 * Single source of truth for breakpoints, timing, and other magic numbers.
 */

/**
 * Responsive breakpoints (in pixels).
 * Using Tailwind's default breakpoints as reference.
 */
export const BREAKPOINTS = {
    /** Small devices (phones) - matches Tailwind 'sm' */
    sm: 640,
    /** Medium devices (tablets) - matches Tailwind 'md' */
    md: 768,
    /** Large devices (desktops) - matches Tailwind 'lg' */
    lg: 1024,
    /** Extra large devices - matches Tailwind 'xl' */
    xl: 1280,
} as const

/**
 * Animation and delay timing constants (in milliseconds).
 */
export const TIMING = {
    /** Standard animation duration for UI transitions */
    animationMs: 500,
    /** Debounce delay for saving state (e.g., view state) */
    debounceMs: 500,
    /** Short delay for clearing highlights */
    highlightClearMs: 400,
} as const

/**
 * Check if the current viewport width is mobile-sized.
 * Uses the 'md' breakpoint as the threshold.
 */
export function isMobileWidth(width: number): boolean {
    return width > 0 && width < BREAKPOINTS.md
}
