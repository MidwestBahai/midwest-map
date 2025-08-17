"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

interface FloatingTimelineButtonProps {
    startDate: Date
    endDate: Date
    currentDate: Date
    onDateChange: (date: Date) => void
    milestoneEvents?: { date: Date; label: string; color?: string }[]
}

// Constants for maintainability
const ANIMATION_DURATION_MS = 500
const TIMELINE_PADDING = 96  // Space from top/bottom of viewport
const CIRCLE_PADDING = 60    // Space for year circles
const SVG_WIDTH = 60
const CENTER_X = 30
const YEAR_CIRCLE_RADIUS = 12
const DRAG_CIRCLE_RADIUS = 14
const DRAG_CIRCLE_RADIUS_ACTIVE = 16

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
    
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()
    
    // Calculate current progress
    const currentProgress = useMemo(() => 
        Math.max(0, Math.min(1, 
            (currentDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())
        )), [currentDate, startDate, endDate]
    )
    
    const formatDate = useCallback((date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${months[date.getMonth()]} ${date.getFullYear()}`
    }, [])
    
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
        setIsAnimatingOpen(false)
        // Wait for animation to complete
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current)
        }
        animationTimeoutRef.current = setTimeout(() => {
            setIsOpen(false)
        }, ANIMATION_DURATION_MS)
    }, [])
    
    useEffect(() => {
        if (!isDragging) return
        
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
            handleInteraction(clientY)
        }
        
        const handleEnd = () => {
            setIsDragging(false)
        }
        
        // Add both mouse and touch listeners
        document.addEventListener('mousemove', handleMove)
        document.addEventListener('touchmove', handleMove)
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
    const { timelineHeight, lineLength, currentPos } = useMemo(() => {
        const height = typeof window !== 'undefined' ? window.innerHeight - TIMELINE_PADDING : 600
        const length = height - CIRCLE_PADDING
        const pos = CENTER_X + length * (1 - currentProgress)
        return { timelineHeight: height, lineLength: length, currentPos: pos }
    }, [currentProgress])

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
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={handleClose}
                        aria-label="Close timeline"
                    />
                    
                    {/* Container for sliding animation */}
                    <div 
                        className="fixed right-6 bottom-6 z-20"
                        style={{
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
                                y2={timelineHeight - CENTER_X}
                                stroke="#e5e7eb"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            
                            {/* Progress line */}
                            <line
                                x1={CENTER_X}
                                y1={currentPos}
                                x2={CENTER_X}
                                y2={timelineHeight - CENTER_X}
                                stroke="url(#progressGradient)"
                                strokeWidth="2"
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
                                        r="3"
                                        fill={event.color || "#fb923c"}
                                        opacity="0.7"
                                    />
                                )
                            })}
                            
                            {/* Top year (end date) */}
                            <g>
                                <circle
                                    cx={CENTER_X}
                                    cy={CENTER_X}
                                    r={YEAR_CIRCLE_RADIUS}
                                    fill="white"
                                    stroke="#d1d5db"
                                    strokeWidth="2"
                                    filter="url(#dropshadow)"
                                />
                                <text
                                    x={CENTER_X}
                                    y={CENTER_X}
                                    fontSize="10"
                                    fontWeight="600"
                                    fill="#374151"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {endYear}
                                </text>
                            </g>
                            
                            {/* Bottom year (start date) - aligned with button, acts as close button */}
                            <g 
                                onClick={handleClose}
                                onMouseEnter={() => setIsHoveringClose(true)}
                                onMouseLeave={() => setIsHoveringClose(false)}
                                style={{ cursor: 'pointer' }}
                                role="button"
                                aria-label="Close timeline"
                            >
                                <circle
                                    cx={CENTER_X}
                                    cy={timelineHeight - CENTER_X}
                                    r={YEAR_CIRCLE_RADIUS}
                                    fill="white"
                                    stroke={isHoveringClose ? "#9ca3af" : "#d1d5db"}
                                    strokeWidth="2"
                                    filter="url(#dropshadow)"
                                    style={{ transition: 'stroke 0.2s ease' }}
                                />
                                {isHoveringClose ? (
                                    <g style={{ pointerEvents: 'none' }}>
                                        <line
                                            x1={CENTER_X - 4}
                                            y1={timelineHeight - CENTER_X - 4}
                                            x2={CENTER_X + 4}
                                            y2={timelineHeight - CENTER_X + 4}
                                            stroke="#374151"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                        <line
                                            x1={CENTER_X + 4}
                                            y1={timelineHeight - CENTER_X - 4}
                                            x2={CENTER_X - 4}
                                            y2={timelineHeight - CENTER_X + 4}
                                            stroke="#374151"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </g>
                                ) : (
                                    <text
                                        x={CENTER_X}
                                        y={timelineHeight - CENTER_X}
                                        fontSize="10"
                                        fontWeight="600"
                                        fill="#374151"
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
                                    r={isDragging ? DRAG_CIRCLE_RADIUS_ACTIVE : DRAG_CIRCLE_RADIUS}
                                    fill="#3b82f6"
                                    filter="url(#dropshadow)"
                                    style={{ transition: 'r 0.2s ease-out' }}
                                />
                                <text
                                    x={CENTER_X}
                                    y={currentPos}
                                    fontSize="11"
                                    fontWeight="700"
                                    fill="white"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {currentDate.getFullYear()}
                                </text>
                                
                                {/* Hover tooltip */}
                                {isDragging && (
                                    <g>
                                        <rect
                                            x={CENTER_X - 60}
                                            y={currentPos - 10}
                                            width="70"
                                            height="20"
                                            rx="4"
                                            fill="#1f2937"
                                            opacity="0.9"
                                        />
                                        <text
                                            x={CENTER_X - 25}
                                            y={currentPos}
                                            fontSize="11"
                                            fill="white"
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                        >
                                            {formatDate(currentDate)}
                                        </text>
                                    </g>
                                )}
                            </g>
                        </svg>
                    </div>
                </>
            )}
        </>
    )
}