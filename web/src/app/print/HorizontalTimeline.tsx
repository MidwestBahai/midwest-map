"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getMonthAbbreviation } from "@/lib/monthAbbreviations"
import {
    MILESTONE_MARKER_RADIUS,
    TIMELINE_COLORS,
    TIMELINE_STROKES,
    TIMELINE_TYPOGRAPHY,
    calculateDateProgress,
    dateFromProgress,
} from "@/lib/timelineConfig"
import { useDragInteraction } from "@/lib/useDragInteraction"
import type { MilestoneEvent } from "@/lib/useMilestoneEvents"

interface HorizontalTimelineProps {
    startDate: Date
    endDate: Date
    currentDate: Date
    onDateChange: (date: Date) => void
    milestoneEvents?: MilestoneEvent[]
}

// Layout constants specific to horizontal timeline
const SVG_HEIGHT = 50
const PADDING_X = 40 // Padding for year labels
const TRACK_Y = 25

// Re-export shared constants for local use
const TRACK_COLOR = TIMELINE_COLORS.track
const YEAR_CIRCLE_STROKE = TIMELINE_COLORS.yearCircleStroke
const YEAR_TEXT_COLOR = TIMELINE_COLORS.yearText
const DRAG_CIRCLE_COLOR = TIMELINE_COLORS.dragCircle
const MILESTONE_COLOR_DEFAULT = TIMELINE_COLORS.milestoneDefault
const PROGRESS_COLOR = TIMELINE_COLORS.progress

const YEAR_FONT_SIZE = TIMELINE_TYPOGRAPHY.yearFontSize
const DRAG_LABEL_FONT_SIZE = TIMELINE_TYPOGRAPHY.dragLabelFontSize

const LINE_STROKE_WIDTH = TIMELINE_STROKES.line
const CIRCLE_STROKE_WIDTH = TIMELINE_STROKES.circle

export function HorizontalTimeline({
    startDate,
    endDate,
    currentDate,
    onDateChange,
    milestoneEvents = [],
}: HorizontalTimelineProps) {
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

    // Calculate current progress using shared utility
    const currentProgress = useMemo(
        () => calculateDateProgress(currentDate, startDate, endDate),
        [currentDate, startDate, endDate],
    )

    // Current position on track
    const currentX = trackStartX + trackWidth * currentProgress

    // Get month abbreviation using shared utility
    const currentMonth = useMemo(
        () => getMonthAbbreviation(currentDate),
        [currentDate],
    )

    // Handle drag interaction - convert clientX to date
    const handleDrag = useCallback(
        (clientX: number) => {
            if (!containerRef.current || trackWidth <= 0) return

            const rect = containerRef.current.getBoundingClientRect()
            const x = clientX - rect.left
            const progress = (x - trackStartX) / trackWidth
            onDateChange(dateFromProgress(progress, startDate, endDate))
        },
        [startDate, endDate, onDateChange, trackStartX, trackWidth],
    )

    // Use shared drag interaction hook
    const { isDragging, handleDragStart } = useDragInteraction({
        onDrag: handleDrag,
        orientation: "horizontal",
    })

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
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
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
