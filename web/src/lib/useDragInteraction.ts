"use client"

import { useCallback, useEffect, useState } from "react"

interface UseDragInteractionOptions {
    /**
     * Called during drag with the client coordinate (clientX or clientY depending on orientation).
     */
    onDrag: (clientCoord: number) => void
    /**
     * Whether to extract clientX (horizontal) or clientY (vertical) from events.
     * @default "vertical"
     */
    orientation?: "horizontal" | "vertical"
}

interface UseDragInteractionResult {
    isDragging: boolean
    /**
     * Handler for mousedown/touchstart events on the draggable element.
     */
    handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void
}

/**
 * Shared drag interaction logic for timeline sliders.
 * Handles mouse and touch events with proper cleanup.
 */
export function useDragInteraction({
    onDrag,
    orientation = "vertical",
}: UseDragInteractionOptions): UseDragInteractionResult {
    const [isDragging, setIsDragging] = useState(false)

    const getClientCoord = useCallback(
        (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
            if ("touches" in e) {
                return orientation === "horizontal"
                    ? e.touches[0].clientX
                    : e.touches[0].clientY
            }
            return orientation === "horizontal" ? e.clientX : e.clientY
        },
        [orientation],
    )

    const handleDragStart = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault()
            setIsDragging(true)
            onDrag(getClientCoord(e))
        },
        [onDrag, getClientCoord],
    )

    useEffect(() => {
        if (!isDragging) return

        const handleMove = (e: MouseEvent | TouchEvent) => {
            // Prevent map panning on mobile during drag
            if ("touches" in e) {
                e.preventDefault()
            }
            onDrag(getClientCoord(e))
        }

        const handleEnd = () => {
            setIsDragging(false)
        }

        // Add both mouse and touch listeners
        // passive: false required to allow preventDefault() on touch events
        document.addEventListener("mousemove", handleMove)
        document.addEventListener("touchmove", handleMove, { passive: false })
        document.addEventListener("mouseup", handleEnd)
        document.addEventListener("touchend", handleEnd)

        return () => {
            document.removeEventListener("mousemove", handleMove)
            document.removeEventListener("touchmove", handleMove)
            document.removeEventListener("mouseup", handleEnd)
            document.removeEventListener("touchend", handleEnd)
        }
    }, [isDragging, onDrag, getClientCoord])

    return {
        isDragging,
        handleDragStart,
    }
}
