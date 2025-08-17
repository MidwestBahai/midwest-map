"use client"

import { useState, useEffect, useRef } from "react"

interface FloatingTimelineButtonProps {
    startDate: Date
    endDate: Date
    currentDate: Date
    onDateChange: (date: Date) => void
    milestoneEvents?: { date: Date; label: string; color?: string }[]
}

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
    const svgRef = useRef<SVGSVGElement>(null)
    const animationTimeoutRef = useRef<NodeJS.Timeout>()
    
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()
    
    // Calculate current progress
    const currentProgress = Math.max(0, Math.min(1, 
        (currentDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())
    ))
    
    const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${months[date.getMonth()]} ${date.getFullYear()}`
    }
    
    const handleInteraction = (clientY: number) => {
        if (!svgRef.current) return
        
        const rect = svgRef.current.getBoundingClientRect()
        const progress = 1 - ((clientY - rect.top) / rect.height)
        
        const clampedProgress = Math.max(0, Math.min(1, progress))
        const totalTime = endDate.getTime() - startDate.getTime()
        const newTime = startDate.getTime() + (clampedProgress * totalTime)
        onDateChange(new Date(newTime))
    }
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        handleInteraction(e.clientY)
    }
    
    const handleOpen = () => {
        setIsOpen(true)
        // Small delay to trigger animation after render
        requestAnimationFrame(() => {
            setIsAnimatingOpen(true)
        })
    }
    
    const handleClose = () => {
        setIsAnimatingOpen(false)
        // Wait for animation to complete
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current)
        }
        animationTimeoutRef.current = setTimeout(() => {
            setIsOpen(false)
        }, 300)
    }
    
    useEffect(() => {
        if (!isDragging) return
        
        const handleMouseMove = (e: MouseEvent) => {
            handleInteraction(e.clientY)
        }
        
        const handleEnd = () => {
            setIsDragging(false)
        }
        
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleEnd)
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleEnd)
        }
    }, [isDragging])
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current)
            }
        }
    }, [])

    // Timeline dimensions
    const timelineHeight = typeof window !== 'undefined' ? window.innerHeight - 96 : 600
    const lineLength = timelineHeight - 60 // Account for year circles
    const currentPos = 30 + lineLength * (1 - currentProgress)

    return (
        <>
            {!isOpen && (
                <button
                    className="fixed bottom-6 right-6 z-20 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                    onClick={handleOpen}
                    aria-label="Show timeline"
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
            )}

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={handleClose}
                    />
                    
                    <svg
                        ref={svgRef}
                        className="fixed right-6 bottom-6 z-20 cursor-pointer"
                        width="60"
                        height={timelineHeight}
                        style={{
                            transformOrigin: 'bottom center',
                            transform: isAnimatingOpen ? 'scaleY(1)' : 'scaleY(0)',
                            opacity: isAnimatingOpen ? 1 : 0,
                            transition: 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.3s ease-out',
                        }}
                        onMouseDown={handleMouseDown}
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
                            x1="30"
                            y1="30"
                            x2="30"
                            y2={timelineHeight - 30}
                            stroke="#e5e7eb"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        
                        {/* Progress line */}
                        <line
                            x1="30"
                            y1={currentPos}
                            x2="30"
                            y2={timelineHeight - 30}
                            stroke="url(#progressGradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        
                        {/* Milestone markers */}
                        {milestoneEvents.map((event, index) => {
                            const eventProgress = (event.date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())
                            const eventY = 30 + lineLength * (1 - eventProgress)
                            
                            return (
                                <circle
                                    key={index}
                                    cx="30"
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
                                cx="30"
                                cy="30"
                                r="12"
                                fill="white"
                                stroke="#d1d5db"
                                strokeWidth="2"
                                filter="url(#dropshadow)"
                            />
                            <text
                                x="30"
                                y="30"
                                fontSize="10"
                                fontWeight="600"
                                fill="#374151"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {endYear}
                            </text>
                        </g>
                        
                        {/* Bottom year (start date) - aligned with button */}
                        <g>
                            <circle
                                cx="30"
                                cy={timelineHeight - 30}
                                r="12"
                                fill="white"
                                stroke="#d1d5db"
                                strokeWidth="2"
                                filter="url(#dropshadow)"
                            />
                            <text
                                x="30"
                                y={timelineHeight - 30}
                                fontSize="10"
                                fontWeight="600"
                                fill="#374151"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {startYear}
                            </text>
                        </g>
                        
                        {/* Current position indicator */}
                        <g>
                            <circle
                                cx="30"
                                cy={currentPos}
                                r={isDragging ? "16" : "14"}
                                fill="#3b82f6"
                                filter="url(#dropshadow)"
                                style={{ transition: 'r 0.2s ease-out' }}
                            />
                            <text
                                x="30"
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
                                        x="-30"
                                        y={currentPos - 10}
                                        width="70"
                                        height="20"
                                        rx="4"
                                        fill="#1f2937"
                                        opacity="0.9"
                                    />
                                    <text
                                        x="5"
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
                    
                    {/* Close button appears after animation */}
                    <button
                        className="fixed bottom-6 right-6 z-20 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={handleClose}
                        aria-label="Hide timeline"
                        style={{
                            opacity: isAnimatingOpen ? 1 : 0,
                            transform: isAnimatingOpen ? 'scale(1)' : 'scale(0.8)',
                            transition: 'all 0.2s ease-out',
                            transitionDelay: isAnimatingOpen ? '0.3s' : '0s'
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
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </>
            )}
        </>
    )
}