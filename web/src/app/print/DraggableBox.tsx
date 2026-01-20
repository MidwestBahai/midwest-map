"use client"

import type { ReactNode } from "react"
import { type DraggablePosition, useDraggable } from "./useDraggable"

export type { DraggablePosition }

interface DraggableBoxProps {
    position: DraggablePosition
    onPositionChange: (position: DraggablePosition) => void
    containerRef: React.RefObject<HTMLElement | null>
    children: ReactNode
    className?: string
    /** Additional z-index applied when dragging (default: 100 when dragging, 10 otherwise) */
    zIndex?: number
    zIndexDragging?: number
}

/**
 * A wrapper component that makes its children draggable within a container.
 * Handles mouse and touch events, clamps position to viewport bounds,
 * and provides visual feedback during drag.
 */
export function DraggableBox({
    position,
    onPositionChange,
    containerRef,
    children,
    className = "",
    zIndex = 10,
    zIndexDragging = 100,
}: DraggableBoxProps) {
    const { elementRef, isDragging, clampedPosition, handlers } = useDraggable({
        position,
        onPositionChange,
        containerRef,
    })

    return (
        <div
            ref={elementRef}
            className={`absolute select-none ${
                isDragging ? "cursor-grabbing opacity-90" : "cursor-grab"
            } ${className}`}
            style={{
                left: clampedPosition.x,
                top: clampedPosition.y,
                zIndex: isDragging ? zIndexDragging : zIndex,
                touchAction: "none", // Prevent browser handling of touch gestures
            }}
            onMouseDown={handlers.onMouseDown}
            onTouchStart={handlers.onTouchStart}
        >
            {children}
        </div>
    )
}
