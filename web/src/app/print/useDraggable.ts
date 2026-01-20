"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export interface DraggablePosition {
    x: number
    y: number
}

interface UseDraggableOptions {
    position: DraggablePosition
    onPositionChange: (position: DraggablePosition) => void
    containerRef: React.RefObject<HTMLElement | null>
}

interface UseDraggableReturn {
    elementRef: React.RefObject<HTMLDivElement | null>
    isDragging: boolean
    clampedPosition: DraggablePosition
    handlers: {
        onMouseDown: (e: React.MouseEvent) => void
        onTouchStart: (e: React.TouchEvent) => void
    }
}

export function useDraggable({
    position,
    onPositionChange,
    containerRef,
}: UseDraggableOptions): UseDraggableReturn {
    const elementRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    // Track element size for clamping calculations
    const [elementSize, setElementSize] = useState({ width: 130, height: 110 })
    useEffect(() => {
        if (elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect()
            setElementSize({ width: rect.width, height: rect.height })
        }
    }, [])

    // Track viewport size for clamping
    const [viewportSize, setViewportSize] = useState({
        width: 1000,
        height: 800,
    })
    useEffect(() => {
        const updateViewport = () => {
            setViewportSize({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }
        updateViewport()
        window.addEventListener("resize", updateViewport)
        return () => window.removeEventListener("resize", updateViewport)
    }, [])

    // Shared logic to calculate clamped position
    const calculatePosition = useCallback(
        (
            clientX: number,
            clientY: number,
            offset: { x: number; y: number },
        ) => {
            if (!containerRef.current || !elementRef.current) return null

            const containerRect = containerRef.current.getBoundingClientRect()
            const elementRect = elementRef.current.getBoundingClientRect()

            // Calculate new position relative to container
            let newX = clientX - containerRect.left - offset.x
            let newY = clientY - containerRect.top - offset.y

            // Clamp to container bounds
            newX = Math.max(
                0,
                Math.min(newX, containerRect.width - elementRect.width),
            )
            newY = Math.max(
                0,
                Math.min(newY, containerRect.height - elementRect.height),
            )

            return { x: newX, y: newY }
        },
        [containerRef],
    )

    // Mouse handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!elementRef.current) return
        e.preventDefault()

        const rect = elementRef.current.getBoundingClientRect()
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
        setIsDragging(true)
    }, [])

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return
            const newPos = calculatePosition(e.clientX, e.clientY, dragOffset)
            if (newPos) onPositionChange(newPos)
        },
        [isDragging, dragOffset, calculatePosition, onPositionChange],
    )

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    // Touch handlers
    // Note: We rely on touchAction: "none" CSS on the element to prevent scrolling.
    // Don't call preventDefault() here as React synthetic touch events are passive.
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!elementRef.current || e.touches.length !== 1) return

        const touch = e.touches[0]
        const rect = elementRef.current.getBoundingClientRect()
        setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        })
        setIsDragging(true)
    }, [])

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isDragging || e.touches.length !== 1) return
            e.preventDefault() // Prevent page scroll

            const touch = e.touches[0]
            const newPos = calculatePosition(
                touch.clientX,
                touch.clientY,
                dragOffset,
            )
            if (newPos) onPositionChange(newPos)
        },
        [isDragging, dragOffset, calculatePosition, onPositionChange],
    )

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false)
    }, [])

    // Attach global listeners when dragging
    useEffect(() => {
        if (isDragging) {
            // Mouse
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
            // Touch (passive: false to allow preventDefault)
            window.addEventListener("touchmove", handleTouchMove, {
                passive: false,
            })
            window.addEventListener("touchend", handleTouchEnd)
            window.addEventListener("touchcancel", handleTouchEnd)

            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
                window.removeEventListener("touchmove", handleTouchMove)
                window.removeEventListener("touchend", handleTouchEnd)
                window.removeEventListener("touchcancel", handleTouchEnd)
            }
        }
    }, [
        isDragging,
        handleMouseMove,
        handleMouseUp,
        handleTouchMove,
        handleTouchEnd,
    ])

    // Clamp rendered position to viewport to prevent page expansion
    const clampedPosition = useMemo(() => {
        const padding = 10
        const maxX = Math.max(
            padding,
            viewportSize.width - elementSize.width - padding,
        )
        const maxY = Math.max(
            padding,
            viewportSize.height - elementSize.height - padding,
        )
        return {
            x: Math.max(padding, Math.min(position.x, maxX)),
            y: Math.max(padding, Math.min(position.y, maxY)),
        }
    }, [position, elementSize, viewportSize])

    return {
        elementRef,
        isDragging,
        clampedPosition,
        handlers: {
            onMouseDown: handleMouseDown,
            onTouchStart: handleTouchStart,
        },
    }
}
