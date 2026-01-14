"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useWindowSize } from "@/lib/useWindowSize"

interface FloatingTimelineButtonProps {
    startDate: Date
    endDate: Date
    currentDate: Date
    onDateChange: (date: Date) => void
    milestoneEvents?: { date: Date; label: string; color?: string }[]
}

// Constants for maintainability
const ANIMATION_DURATION_MS = 500
const SVG_WIDTH = 60
const CENTER_X = 30
const BOTTOM_PADDING = 25    // Less padding at bottom to align with clock button

// Button positioning (must match collapsed button's Tailwind classes)
const BUTTON_BOTTOM = 24     // bottom-6 = 1.5rem = 24px
const BUTTON_RIGHT = 24      // right-6 = 1.5rem = 24px
const BUTTON_SIZE = 48       // p-3 (12px) * 2 + 24px icon = 48px
const BUTTON_CENTER_FROM_BOTTOM = BUTTON_BOTTOM + BUTTON_SIZE / 2  // 48px

// Responsive circle sizes (mobile / desktop)
const MOBILE_BREAKPOINT = 768
const CIRCLE_SIZES = {
    mobile: {
        yearCircle: 22,       // 44px diameter - meets touch target
        dragCircle: 26,       // 52px diameter - primary interaction
        dragCircleActive: 28, // 56px diameter - visual feedback
        milestoneMarker: 4,
    },
    desktop: {
        yearCircle: 18,       // 36px diameter - secondary element
        dragCircle: 22,       // 44px diameter - meets minimum
        dragCircleActive: 24, // 48px diameter
        milestoneMarker: 3,
    }
}

// Responsive typography
const TYPOGRAPHY = {
    mobile: {
        yearFontSize: 14,
        dragYearFontSize: 14,
        dragMonthFontSize: 11,
    },
    desktop: {
        yearFontSize: 12,
        dragYearFontSize: 12,
        dragMonthFontSize: 10,
    }
}
const YEAR_FONT_WEIGHT = "600"

// Colors
const TRACK_COLOR = "#e5e7eb"
const YEAR_CIRCLE_STROKE = "#d1d5db"
const YEAR_CIRCLE_STROKE_HOVER = "#9ca3af"
const YEAR_TEXT_COLOR = "#374151"
const DRAG_CIRCLE_COLOR = "#3b82f6"
const MILESTONE_COLOR_DEFAULT = "#fb923c"

// Strokes
const LINE_STROKE_WIDTH = 2
const CIRCLE_STROKE_WIDTH = 2
const X_STROKE_WIDTH = 1.5

export const FloatingTimelineButton = ({
    startDate,
    endDate,
    currentDate,
    onDateChange,
    milestoneEvents = []
}: FloatingTimelineButtonProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isAnimatingOpen, setIsAnimatingOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isHoveringClose, setIsHoveringClose] = useState(false)
    const svgRef = useRef<SVGSVGElement>(null)
    const animationTimeoutRef = useRef<NodeJS.Timeout>()
    const windowSize = useWindowSize()

    // Responsive sizes based on viewport width
    const isMobile = windowSize.width > 0 && windowSize.width < MOBILE_BREAKPOINT
    const sizes = isMobile ? CIRCLE_SIZES.mobile : CIRCLE_SIZES.desktop
    const fonts = isMobile ? TYPOGRAPHY.mobile : TYPOGRAPHY.desktop

    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()
    
    // Calculate current progress
    const currentProgress = useMemo(() => 
        Math.max(0, Math.min(1, 
            (currentDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())
        )), [currentDate, startDate, endDate]
    )
    
    // Get month abbreviation
    const currentMonth = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return months[currentDate.getMonth()]
    }, [currentDate])
    
    const handleInteraction = useCallback((clientY: number) => {
        if (!svgRef.current) return

        const rect = svgRef.current.getBoundingClientRect()
        const progress = 1 - ((clientY - rect.top) / rect.height)

        const clampedProgress = Math.max(0, Math.min(1, progress))
        const totalTime = endDate.getTime() - startDate.getTime()
        const newTime = startDate.getTime() + (clampedProgress * totalTime)
        onDateChange(new Date(newTime))
    }, [startDate, endDate, onDateChange])
    
    const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        setIsDragging(true)
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
        handleInteraction(clientY)
    }, [handleInteraction])
    
    const handleOpen = useCallback(() => {
        setIsOpen(true)
        // Small delay to trigger animation after render
        requestAnimationFrame(() => {
            setIsAnimatingOpen(true)
        })
    }, [])
    
    const handleClose = useCallback(() => {
        // Reset to present immediately when starting to close
        onDateChange(new Date())
        setIsAnimatingOpen(false)
        // Wait for animation to complete
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current)
        }
        animationTimeoutRef.current = setTimeout(() => {
            setIsOpen(false)
        }, ANIMATION_DURATION_MS)
    }, [onDateChange])
    
    useEffect(() => {
        if (!isDragging) return

        const handleMove = (e: MouseEvent | TouchEvent) => {
            // Prevent map panning on mobile during timeline drag
            if ('touches' in e) {
                e.preventDefault()
            }
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
            handleInteraction(clientY)
        }

        const handleEnd = () => {
            setIsDragging(false)
        }

        // Add both mouse and touch listeners
        // passive: false required to allow preventDefault() on touch events
        document.addEventListener('mousemove', handleMove)
        document.addEventListener('touchmove', handleMove, { passive: false })
        document.addEventListener('mouseup', handleEnd)
        document.addEventListener('touchend', handleEnd)

        return () => {
            document.removeEventListener('mousemove', handleMove)
            document.removeEventListener('touchmove', handleMove)
            document.removeEventListener('mouseup', handleEnd)
            document.removeEventListener('touchend', handleEnd)
        }
    }, [isDragging, handleInteraction])
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current)
            }
        }
    }, [])

    // Timeline dimensions - memoized to avoid recalculation
    const { timelineHeight, lineLength, currentPos, bottomOffset } = useMemo(() => {
        // Align bottom circle with collapsed button center
        const offset = BUTTON_CENTER_FROM_BOTTOM - BOTTOM_PADDING
        // Calculate height for symmetry: both circles at BUTTON_CENTER_FROM_BOTTOM from their edges
        // Top circle (at CENTER_X in SVG) should be 48px from viewport top
        // Bottom circle (at height - BOTTOM_PADDING) should be 48px from viewport bottom
        const viewportHeight = windowSize.height || 700
        const height = viewportHeight - offset - BUTTON_CENTER_FROM_BOTTOM + CENTER_X
        const length = height - CENTER_X - BOTTOM_PADDING
        const pos = CENTER_X + length * (1 - currentProgress)
        return { timelineHeight: height, lineLength: length, currentPos: pos, bottomOffset: offset }
    }, [currentProgress, windowSize.height])

    return (
        <>
            <button
                className="fixed bottom-6 right-6 z-30 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                onClick={handleOpen}
                aria-label="Show timeline"
                style={{
                    opacity: (isOpen && isAnimatingOpen) ? 0 : 1,
                    pointerEvents: isOpen ? 'none' : 'auto',
                    transition: 'opacity 0.3s ease-out'
                }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700"
                >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* Container for sliding animation */}
                    <div 
                        className="fixed z-20"
                        style={{
                            right: '18px',  // Adjusted to align with clock button center
                            bottom: `${bottomOffset}px`,  // Center vertically
                            height: timelineHeight,
                            width: SVG_WIDTH,
                            overflow: 'hidden'
                        }}
                    >
                        <svg
                            ref={svgRef}
                            className="cursor-pointer"
                            width={SVG_WIDTH}
                            height={timelineHeight}
                            style={{
                                transform: isAnimatingOpen ? 'translateY(0)' : `translateY(${timelineHeight}px)`,
                                transition: `transform ${ANIMATION_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
                                touchAction: 'none',  // Prevent default touch behaviors (map pan)
                            }}
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleMouseDown}
                        >
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                                </linearGradient>
                                
                                <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                                    <feOffset dx="0" dy="1" result="offsetblur"/>
                                    <feComponentTransfer>
                                        <feFuncA type="linear" slope="0.2"/>
                                    </feComponentTransfer>
                                    <feMerge>
                                        <feMergeNode/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            
                            {/* Background track */}
                            <line
                                x1={CENTER_X}
                                y1={CENTER_X}
                                x2={CENTER_X}
                                y2={timelineHeight - BOTTOM_PADDING}
                                stroke={TRACK_COLOR}
                                strokeWidth={LINE_STROKE_WIDTH}
                                strokeLinecap="round"
                            />
                            
                            {/* Progress line */}
                            <line
                                x1={CENTER_X}
                                y1={currentPos}
                                x2={CENTER_X}
                                y2={timelineHeight - BOTTOM_PADDING}
                                stroke="url(#progressGradient)"
                                strokeWidth={LINE_STROKE_WIDTH}
                                strokeLinecap="round"
                            />
                            
                            {/* Milestone markers */}
                            {milestoneEvents.map((event, index) => {
                                const eventProgress = (event.date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())
                                const eventY = CENTER_X + lineLength * (1 - eventProgress)
                                
                                return (
                                    <circle
                                        key={index}
                                        cx={CENTER_X}
                                        cy={eventY}
                                        r={sizes.milestoneMarker}
                                        fill={event.color || MILESTONE_COLOR_DEFAULT}
                                        opacity="0.7"
                                    />
                                )
                            })}
                            
                            {/* Top year (end date) */}
                            <g>
                                <circle
                                    cx={CENTER_X}
                                    cy={CENTER_X}
                                    r={sizes.yearCircle}
                                    fill="white"
                                    stroke={YEAR_CIRCLE_STROKE}
                                    strokeWidth={CIRCLE_STROKE_WIDTH}
                                    filter="url(#dropshadow)"
                                />
                                <text
                                    x={CENTER_X}
                                    y={CENTER_X}
                                    fontSize={fonts.yearFontSize}
                                    fontWeight={YEAR_FONT_WEIGHT}
                                    fill={YEAR_TEXT_COLOR}
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {endYear}
                                </text>
                            </g>
                            
                            {/* Bottom year (start date) - aligned with button, acts as close button */}
                            <g
                                onClick={handleClose}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onMouseEnter={() => setIsHoveringClose(true)}
                                onMouseLeave={() => setIsHoveringClose(false)}
                                style={{ cursor: 'pointer' }}
                                role="button"
                                aria-label="Close timeline"
                            >
                                <circle
                                    cx={CENTER_X}
                                    cy={timelineHeight - BOTTOM_PADDING}
                                    r={sizes.yearCircle}
                                    fill="white"
                                    stroke={isHoveringClose ? YEAR_CIRCLE_STROKE_HOVER : YEAR_CIRCLE_STROKE}
                                    strokeWidth={CIRCLE_STROKE_WIDTH}
                                    filter="url(#dropshadow)"
                                    style={{ transition: 'stroke 0.2s ease' }}
                                />
                                {isHoveringClose || isMobile ? (
                                    <g style={{ pointerEvents: 'none' }}>
                                        <line
                                            x1={CENTER_X - 4}
                                            y1={timelineHeight - BOTTOM_PADDING - 4}
                                            x2={CENTER_X + 4}
                                            y2={timelineHeight - BOTTOM_PADDING + 4}
                                            stroke={YEAR_TEXT_COLOR}
                                            strokeWidth={X_STROKE_WIDTH}
                                            strokeLinecap="round"
                                        />
                                        <line
                                            x1={CENTER_X + 4}
                                            y1={timelineHeight - BOTTOM_PADDING - 4}
                                            x2={CENTER_X - 4}
                                            y2={timelineHeight - BOTTOM_PADDING + 4}
                                            stroke={YEAR_TEXT_COLOR}
                                            strokeWidth={X_STROKE_WIDTH}
                                            strokeLinecap="round"
                                        />
                                    </g>
                                ) : (
                                    <text
                                        x={CENTER_X}
                                        y={timelineHeight - BOTTOM_PADDING}
                                        fontSize={fonts.yearFontSize}
                                        fontWeight={YEAR_FONT_WEIGHT}
                                        fill={YEAR_TEXT_COLOR}
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {startYear}
                                    </text>
                                )}
                            </g>
                            
                            {/* Current position indicator */}
                            <g>
                                <circle
                                    cx={CENTER_X}
                                    cy={currentPos}
                                    r={isDragging ? sizes.dragCircleActive : sizes.dragCircle}
                                    fill={DRAG_CIRCLE_COLOR}
                                    filter="url(#dropshadow)"
                                    style={{ transition: 'r 0.2s ease-out' }}
                                />
                                <text
                                    x={CENTER_X}
                                    y={currentPos - 3}
                                    fontSize={fonts.dragYearFontSize}
                                    fontWeight="700"
                                    fill="white"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {currentDate.getFullYear()}
                                </text>
                                <text
                                    x={CENTER_X}
                                    y={currentPos + 9}
                                    fontSize={fonts.dragMonthFontSize}
                                    fontWeight="400"
                                    fill="white"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {currentMonth}
                                </text>
                            </g>
                        </svg>
                    </div>
                </>
            )}
        </>
    )
}