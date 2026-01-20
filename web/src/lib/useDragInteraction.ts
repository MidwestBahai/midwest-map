"use client"

import { useCallback, useEffect, useRef, useState } from "react"

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

    // Use refs to avoid re-running the effect when callbacks change
    // This prevents infinite update loops when onDrag dependencies change during drag
    const onDragRef = useRef(onDrag)
    const orientationRef = useRef(orientation)

    // Keep refs in sync with props
    useEffect(() => {
        onDragRef.current = onDrag
        orientationRef.current = orientation
    })

    const getClientCoord = useCallback(
        (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
            if ("touches" in e) {
                return orientationRef.current === "horizontal"
                    ? e.touches[0].clientX
                    : e.touches[0].clientY
            }
            return orientationRef.current === "horizontal" ? e.clientX : e.clientY
        },
        [],
    )

    const handleDragStart = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            // Check cancelable to avoid warning on passive touch events
            if (e.cancelable) {
                e.preventDefault()
            }
            setIsDragging(true)
            onDragRef.current(getClientCoord(e))
        },
        [getClientCoord],
    )

    useEffect(() => {
        if (!isDragging) return

        const handleMove = (e: MouseEvent | TouchEvent) => {
            // Prevent map panning on mobile during drag
            if ("touches" in e) {
                e.preventDefault()
            }
            onDragRef.current(getClientCoord(e))
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
    }, [isDragging, getClientCoord])

    return {
        isDragging,
        handleDragStart,
    }
}
