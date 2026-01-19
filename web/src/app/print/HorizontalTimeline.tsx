"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MilestoneEvent } from "@/lib/useMilestoneEvents"

interface HorizontalTimelineProps {
    startDate: Date
    endDate: Date
    currentDate: Date
    onDateChange: (date: Date) => void
    milestoneEvents?: MilestoneEvent[]
}

// Constants
const SVG_HEIGHT = 50
const PADDING_X = 40 // Padding for year labels
const TRACK_Y = 25
const MILESTONE_MARKER_RADIUS = 3

// Colors (consistent with FloatingTimelineButton)
const TRACK_COLOR = "#e5e7eb"
const YEAR_CIRCLE_STROKE = "#d1d5db"
const YEAR_TEXT_COLOR = "#374151"
const DRAG_CIRCLE_COLOR = "#3b82f6"
const MILESTONE_COLOR_DEFAULT = "#fb923c"
const PROGRESS_COLOR = "#3b82f6"

// Typography
const YEAR_FONT_SIZE = 12
const DRAG_LABEL_FONT_SIZE = 11

// Strokes
const LINE_STROKE_WIDTH = 2
const CIRCLE_STROKE_WIDTH = 2

export function HorizontalTimeline({
    startDate,
    endDate,
    currentDate,
    onDateChange,
    milestoneEvents = [],
}: HorizontalTimelineProps) {
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)

    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()

    // Measure container width
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth)
            }
        }
        updateWidth()
        window.addEventListener("resize", updateWidth)
        return () => window.removeEventListener("resize", updateWidth)
    }, [])

    // Calculate track dimensions
    const trackStartX = PADDING_X
    const trackEndX = containerWidth - PADDING_X
    const trackWidth = trackEndX - trackStartX

    // Calculate current progress
    const currentProgress = useMemo(
        () =>
            Math.max(
                0,
                Math.min(
                    1,
                    (currentDate.getTime() - startDate.getTime()) /
                        (endDate.getTime() - startDate.getTime()),
                ),
            ),
        [currentDate, startDate, endDate],
    )

    // Current position on track
    const currentX = trackStartX + trackWidth * currentProgress

    // Get month abbreviation
    const currentMonth = useMemo(() => {
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        return months[currentDate.getMonth()]
    }, [currentDate])

    const handleInteraction = useCallback(
        (clientX: number) => {
            if (!containerRef.current || trackWidth <= 0) return

            const rect = containerRef.current.getBoundingClientRect()
            const x = clientX - rect.left
            const progress = (x - trackStartX) / trackWidth

            const clampedProgress = Math.max(0, Math.min(1, progress))
            const totalTime = endDate.getTime() - startDate.getTime()
            const newTime = startDate.getTime() + clampedProgress * totalTime
            onDateChange(new Date(newTime))
        },
        [startDate, endDate, onDateChange, trackStartX, trackWidth],
    )

    const handleMouseDown = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault()
            setIsDragging(true)
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
            handleInteraction(clientX)
        },
        [handleInteraction],
    )

    useEffect(() => {
        if (!isDragging) return

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if ("touches" in e) {
                e.preventDefault()
            }
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
            handleInteraction(clientX)
        }

        const handleEnd = () => {
            setIsDragging(false)
        }

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
    }, [isDragging, handleInteraction])

    return (
        <div ref={containerRef} className="w-full py-2">
            {containerWidth > 0 && (
                <svg
                    // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: SVG is made interactive via mouse/touch handlers
                    role="slider"
                    aria-label="Timeline date selector"
                    aria-valuemin={startYear}
                    aria-valuemax={endYear}
                    aria-valuenow={currentDate.getFullYear()}
                    aria-valuetext={`${currentMonth} ${currentDate.getFullYear()}`}
                    tabIndex={0}
                    className="w-full cursor-pointer"
                    height={SVG_HEIGHT}
                    style={{ touchAction: "none" }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                >
                    <defs>
                        <linearGradient
                            id="horizontalProgressGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop
                                offset="0%"
                                stopColor={PROGRESS_COLOR}
                                stopOpacity="1"
                            />
                            <stop
                                offset="100%"
                                stopColor={PROGRESS_COLOR}
                                stopOpacity="0.2"
                            />
                        </linearGradient>

                        <filter
                            id="horizontalDropshadow"
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%"
                        >
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="0" dy="1" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.2" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background track */}
                    <line
                        x1={trackStartX}
                        y1={TRACK_Y}
                        x2={trackEndX}
                        y2={TRACK_Y}
                        stroke={TRACK_COLOR}
                        strokeWidth={LINE_STROKE_WIDTH}
                        strokeLinecap="round"
                    />

                    {/* Progress line (from start to current) */}
                    <line
                        x1={trackStartX}
                        y1={TRACK_Y}
                        x2={currentX}
                        y2={TRACK_Y}
                        stroke={PROGRESS_COLOR}
                        strokeWidth={LINE_STROKE_WIDTH}
                        strokeLinecap="round"
                    />

                    {/* Milestone markers */}
                    {milestoneEvents.map((event) => {
                        const eventProgress =
                            (event.date.getTime() - startDate.getTime()) /
                            (endDate.getTime() - startDate.getTime())
                        const eventX = trackStartX + trackWidth * eventProgress

                        return (
                            <circle
                                key={`${event.date.getTime()}-${event.label}`}
                                cx={eventX}
                                cy={TRACK_Y}
                                r={MILESTONE_MARKER_RADIUS}
                                fill={event.color || MILESTONE_COLOR_DEFAULT}
                                opacity="0.7"
                            />
                        )
                    })}

                    {/* Start year label */}
                    <g>
                        <circle
                            cx={trackStartX}
                            cy={TRACK_Y}
                            r={16}
                            fill="white"
                            stroke={YEAR_CIRCLE_STROKE}
                            strokeWidth={CIRCLE_STROKE_WIDTH}
                            filter="url(#horizontalDropshadow)"
                        />
                        <text
                            x={trackStartX}
                            y={TRACK_Y}
                            fontSize={YEAR_FONT_SIZE}
                            fontWeight="600"
                            fill={YEAR_TEXT_COLOR}
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {startYear}
                        </text>
                    </g>

                    {/* End year label */}
                    <g>
                        <circle
                            cx={trackEndX}
                            cy={TRACK_Y}
                            r={16}
                            fill="white"
                            stroke={YEAR_CIRCLE_STROKE}
                            strokeWidth={CIRCLE_STROKE_WIDTH}
                            filter="url(#horizontalDropshadow)"
                        />
                        <text
                            x={trackEndX}
                            y={TRACK_Y}
                            fontSize={YEAR_FONT_SIZE}
                            fontWeight="600"
                            fill={YEAR_TEXT_COLOR}
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {endYear}
                        </text>
                    </g>

                    {/* Current position indicator */}
                    <g>
                        <circle
                            cx={currentX}
                            cy={TRACK_Y}
                            r={isDragging ? 22 : 20}
                            fill={DRAG_CIRCLE_COLOR}
                            filter="url(#horizontalDropshadow)"
                            style={{ transition: "r 0.2s ease-out" }}
                        />
                        <text
                            x={currentX}
                            y={TRACK_Y - 4}
                            fontSize={DRAG_LABEL_FONT_SIZE}
                            fontWeight="700"
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {currentMonth}
                        </text>
                        <text
                            x={currentX}
                            y={TRACK_Y + 8}
                            fontSize={DRAG_LABEL_FONT_SIZE}
                            fontWeight="700"
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {currentDate.getFullYear()}
                        </text>
                    </g>
                </svg>
            )}
        </div>
    )
}
