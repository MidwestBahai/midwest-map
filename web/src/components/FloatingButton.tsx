"use client"

import type { ReactNode } from "react"

// Shared constants for floating button positioning
// These values are used by FloatingTimelineButton for alignment calculations
export const FLOATING_BUTTON = {
    // Positioning
    bottom: 24, // bottom-6 = 1.5rem = 24px
    zIndex: 60, // Above slide-up panel (z-50)

    // Button dimensions
    padding: 12, // p-3 = 0.75rem = 12px
    iconSize: 24, // w-6 h-6 = 24px
    size: 48, // padding * 2 + iconSize = 48px

    // Positions from right edge (Tailwind classes)
    positions: {
        timeline: "right-6", // 24px
        layers: "right-24", // 96px
        print: "right-42", // 168px
    },
} as const

// Derived constant for timeline alignment
export const BUTTON_CENTER_FROM_BOTTOM =
    FLOATING_BUTTON.bottom + FLOATING_BUTTON.size / 2 // 48px

// Shared CSS classes
const WRAPPER_BASE = "print-hidden fixed bottom-6 z-[60]"
const BUTTON_BASE =
    "relative rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
const BUTTON_DEFAULT = "bg-white text-gray-700"
const BUTTON_ACTIVE = "bg-gray-700 text-white"

interface FloatingButtonProps {
    position: keyof typeof FLOATING_BUTTON.positions
    onClick: () => void
    active?: boolean
    ariaLabel: string
    title: string
    children: ReactNode
}

export function FloatingButton({
    position,
    onClick,
    active = false,
    ariaLabel,
    title,
    children,
}: FloatingButtonProps) {
    const positionClass = FLOATING_BUTTON.positions[position]

    return (
        <div className={`${WRAPPER_BASE} ${positionClass}`}>
            <button
                type="button"
                className={`${BUTTON_BASE} ${active ? BUTTON_ACTIVE : BUTTON_DEFAULT}`}
                onClick={onClick}
                aria-label={ariaLabel}
                title={title}
            >
                {children}
            </button>
        </div>
    )
}

// Export icon size class for consistency
export const FLOATING_ICON_CLASS = "w-6 h-6"
