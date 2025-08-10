"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocalState } from "@/lib/useLocalState"
import { useWindowSize } from "@/lib/useWindowSize"

interface TimelineControlProps {
    startDate: Date
    endDate: Date
    currentDate: Date
    onDateChange: (date: Date) => void
    milestoneEvents?: { date: Date; label: string; color?: string }[]
    orientation?: 'vertical' | 'horizontal'
}

export const TimelineControl = ({
    startDate,
    endDate,
    currentDate,
    onDateChange,
    milestoneEvents = [],
    orientation = 'vertical'
}: TimelineControlProps) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()
    
    const currentProgress = useMemo(() => {
        const total = endDate.getTime() - startDate.getTime()
        const current = currentDate.getTime() - startDate.getTime()
        return Math.max(0, Math.min(1, current / total))
    }, [currentDate, startDate, endDate])
    
    const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${months[date.getMonth()]} ${date.getFullYear()}`
    }
    
    const formatShortDate = (date: Date) => {
        const month = date.getMonth() + 1
        const year = date.getFullYear() % 100
        return `${month}/${year}`
    }
    
    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return
        
        const rect = svgRef.current.getBoundingClientRect()
        let progress: number
        
        if (orientation === 'vertical') {
            progress = 1 - ((clientY - rect.top) / rect.height)
        } else {
            progress = (clientX - rect.left) / rect.width
        }
        
        progress = Math.max(0, Math.min(1, progress))
        const totalTime = endDate.getTime() - startDate.getTime()
        const newTime = startDate.getTime() + (progress * totalTime)
        onDateChange(new Date(newTime))
    }, [startDate, endDate, onDateChange, orientation])
    
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        handleInteraction(e.clientX, e.clientY)
    }, [handleInteraction])
    
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault()
        setIsDragging(true)
        const touch = e.touches[0]
        handleInteraction(touch.clientX, touch.clientY)
    }, [handleInteraction])
    
    useEffect(() => {
        if (!isDragging) return
        
        const handleMouseMove = (e: MouseEvent) => {
            handleInteraction(e.clientX, e.clientY)
        }
        
        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0]
            handleInteraction(touch.clientX, touch.clientY)
        }
        
        const handleEnd = () => {
            setIsDragging(false)
        }
        
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('touchmove', handleTouchMove)
        document.addEventListener('mouseup', handleEnd)
        document.addEventListener('touchend', handleEnd)
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('mouseup', handleEnd)
            document.removeEventListener('touchend', handleEnd)
        }
    }, [isDragging, handleInteraction])
    
    const isVertical = orientation === 'vertical'
    const windowSize = useWindowSize()
    
    // Calculate SVG height based on window size and margins
    // top-24 (6rem = 96px) and bottom-24 (6rem = 96px) from the className
    const svgHeight = Math.max(200, windowSize.height - 192)
    
    // SVG dimensions
    const width = isVertical ? 60 : 400
    const height = isVertical ? svgHeight : 60
    const padding = 20
    const lineStart = padding
    const lineEnd = isVertical ? height - padding : width - padding
    const linePos = isVertical ? width / 2 : height / 2
    
    // Calculate positions
    const currentPos = lineStart + (lineEnd - lineStart) * (1 - currentProgress)
    
    return (
        <div 
            className={`fixed ${
                isVertical ? 'right-2 top-24 bottom-24' : 'bottom-2 left-24 right-24'
            } z-10 pointer-events-none`}
        >
            <svg
                ref={svgRef}
                width={isVertical ? width : '100%'}
                height={isVertical ? '100%' : height}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className="pointer-events-auto cursor-pointer"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={isVertical ? {} : { width: '100%' }}
            >
                <defs>
                    {/* Gradient for the progress line */}
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                    </linearGradient>
                    
                    {/* Drop shadow filter */}
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
                {isVertical ? (
                    <line
                        x1={linePos}
                        y1={lineStart}
                        x2={linePos}
                        y2={lineEnd}
                        stroke="#e5e7eb"
                        strokeWidth={isHovered || isDragging ? "3" : "2"}
                        strokeLinecap="round"
                        className="transition-all duration-200"
                    />
                ) : (
                    <line
                        x1={lineStart}
                        y1={linePos}
                        x2={lineEnd}
                        y2={linePos}
                        stroke="#e5e7eb"
                        strokeWidth={isHovered || isDragging ? "3" : "2"}
                        strokeLinecap="round"
                        className="transition-all duration-200"
                    />
                )}
                
                {/* Progress line */}
                {isVertical ? (
                    <line
                        x1={linePos}
                        y1={currentPos}
                        x2={linePos}
                        y2={lineEnd}
                        stroke="url(#progressGradient)"
                        strokeWidth={isHovered || isDragging ? "3" : "2"}
                        strokeLinecap="round"
                        className="transition-all duration-200 pointer-events-none"
                    />
                ) : (
                    <line
                        x1={lineStart}
                        y1={linePos}
                        x2={lineStart + (lineEnd - lineStart) * currentProgress}
                        y2={linePos}
                        stroke="#3b82f6"
                        strokeWidth={isHovered || isDragging ? "3" : "2"}
                        strokeLinecap="round"
                        className="transition-all duration-200 pointer-events-none"
                    />
                )}
                
                {/* Milestone markers */}
                {milestoneEvents.map((event, index) => {
                    const eventProgress = (event.date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())
                    const eventPos = lineStart + (lineEnd - lineStart) * (isVertical ? (1 - eventProgress) : eventProgress)
                    
                    return (
                        <g key={index} className="pointer-events-none">
                            {isVertical ? (
                                <>
                                    <circle
                                        cx={linePos}
                                        cy={eventPos}
                                        r="3"
                                        fill={event.color || "#fb923c"}
                                        opacity="0.7"
                                    />
                                    {isHovered && (
                                        <text
                                            x={linePos - 10}
                                            y={eventPos}
                                            fontSize="8"
                                            fill="#6b7280"
                                            textAnchor="end"
                                            alignmentBaseline="middle"
                                        >
                                            {formatShortDate(event.date)}
                                        </text>
                                    )}
                                </>
                            ) : (
                                <>
                                    <circle
                                        cx={eventPos}
                                        cy={linePos}
                                        r="3"
                                        fill={event.color || "#fb923c"}
                                        opacity="0.7"
                                    />
                                    {isHovered && (
                                        <text
                                            x={eventPos}
                                            y={linePos - 10}
                                            fontSize="8"
                                            fill="#6b7280"
                                            textAnchor="middle"
                                        >
                                            {formatShortDate(event.date)}
                                        </text>
                                    )}
                                </>
                            )}
                        </g>
                    )
                })}
                
                {/* End year circle */}
                <g className="pointer-events-none">
                    <circle
                        cx={isVertical ? linePos : lineEnd}
                        cy={isVertical ? lineStart : linePos}
                        r="12"
                        fill="white"
                        stroke="#d1d5db"
                        strokeWidth="2"
                        filter="url(#dropshadow)"
                    />
                    <text
                        x={isVertical ? linePos : lineEnd}
                        y={isVertical ? lineStart : linePos}
                        fontSize="10"
                        fontWeight="600"
                        fill="#374151"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                    >
                        {endYear}
                    </text>
                </g>
                
                {/* Start year circle */}
                <g className="pointer-events-none">
                    <circle
                        cx={isVertical ? linePos : lineStart}
                        cy={isVertical ? lineEnd : linePos}
                        r="12"
                        fill="white"
                        stroke="#d1d5db"
                        strokeWidth="2"
                        filter="url(#dropshadow)"
                    />
                    <text
                        x={isVertical ? linePos : lineStart}
                        y={isVertical ? lineEnd : linePos}
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
                <g className="pointer-events-none">
                    <circle
                        cx={isVertical ? linePos : lineStart + (lineEnd - lineStart) * currentProgress}
                        cy={isVertical ? currentPos : linePos}
                        r={isDragging ? "16" : "14"}
                        fill="#3b82f6"
                        filter="url(#dropshadow)"
                        className="transition-all duration-200"
                    />
                    <text
                        x={isVertical ? linePos : lineStart + (lineEnd - lineStart) * currentProgress}
                        y={isVertical ? currentPos : linePos}
                        fontSize="11"
                        fontWeight="700"
                        fill="white"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                    >
                        {currentDate.getFullYear()}
                    </text>
                    
                    {/* Hover tooltip */}
                    {(isHovered || isDragging) && (
                        <g>
                            <rect
                                x={isVertical ? linePos - 60 : lineStart + (lineEnd - lineStart) * currentProgress - 35}
                                y={isVertical ? currentPos - 10 : linePos - 35}
                                width="70"
                                height="20"
                                rx="4"
                                fill="#1f2937"
                                opacity="0.9"
                            />
                            <text
                                x={isVertical ? linePos - 25 : lineStart + (lineEnd - lineStart) * currentProgress}
                                y={isVertical ? currentPos : linePos - 20}
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
    )
}