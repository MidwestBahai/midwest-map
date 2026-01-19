"use client"

import { ChevronDown, ChevronUp, Clock, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getTimelineBounds, useMilestoneEvents } from "@/lib/useMilestoneEvents"
import { HorizontalTimeline } from "./HorizontalTimeline"
import { DEFAULT_LABEL_OPTIONS, type LabelOptions } from "./types"

interface PrintToolbarProps {
    className?: string
    currentDate: Date
    onDateChange: (date: Date) => void
    initialShowTimeline?: boolean
    onLabelOptionsChange?: (options: LabelOptions) => void
    onScopeChange?: (scope: string) => void
    onPaperChange?: (paper: string) => void
}

const PAPER_SIZES = [
    { key: "letter", label: "Letter" },
    { key: "letter-landscape", label: "Letter Landscape" },
    { key: "tabloid", label: "Tabloid" },
    { key: "tabloid-landscape", label: "Tabloid Landscape" },
    { key: "a4", label: "A4" },
    { key: "a4-landscape", label: "A4 Landscape" },
    { key: "poster-18x24", label: "Poster 18×24" },
    { key: "poster-24x36", label: "Poster 24×36" },
] as const

const SCOPE_OPTIONS = [
    { key: "region", label: "Full Region" },
    { key: "state-IN", label: "Indiana" },
    { key: "state-MI", label: "Michigan" },
    { key: "state-OH", label: "Ohio" },
    { key: "group-CLV", label: "Cleveland Group" },
    { key: "group-CBUS", label: "Columbus Group" },
    { key: "group-GR", label: "Grand Rapids Group" },
    { key: "group-INDY", label: "Indianapolis Group" },
    { key: "group-AA", label: "Washtenaw Group" },
] as const

export function PrintToolbar({
    className = "",
    currentDate,
    onDateChange,
    initialShowTimeline = false,
    onLabelOptionsChange,
    onScopeChange,
    onPaperChange,
}: PrintToolbarProps) {
    const router = useRouter()
    const [isExpanded, setIsExpanded] = useState(true)
    const [showTimeline, setShowTimeline] = useState(initialShowTimeline)

    const handleToggleTimeline = () => {
        if (showTimeline) {
            // Closing timeline - reset to present
            onDateChange(new Date())
        }
        setShowTimeline(!showTimeline)
    }
    const [selectedPaper, setSelectedPaper] = useState("poster-24x36")
    const [selectedScope, setSelectedScope] = useState("region")
    const [labelOptions, setLabelOptions] =
        useState<LabelOptions>(DEFAULT_LABEL_OPTIONS)

    // Notify parent of initial state and changes
    useEffect(() => {
        onLabelOptionsChange?.(labelOptions)
    }, [labelOptions, onLabelOptionsChange])

    useEffect(() => {
        onScopeChange?.(selectedScope)
    }, [selectedScope, onScopeChange])

    useEffect(() => {
        onPaperChange?.(selectedPaper)
    }, [selectedPaper, onPaperChange])

    const milestoneEvents = useMilestoneEvents()
    const { startDate, endDate } = getTimelineBounds()

    const handlePrint = () => {
        window.print()
    }

    const handleLabelToggle = (key: keyof typeof labelOptions) => {
        setLabelOptions((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div
            className={`print-hidden fixed bottom-0 left-0 right-0 z-50 ${className}`}
            style={{
                transform: isExpanded
                    ? "translateY(0)"
                    : "translateY(calc(100% - 40px))",
                transition: "transform 400ms cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
        >
            <div className="bg-white border-t border-gray-300 shadow-lg">
                {/* Header bar - collapse toggle with title */}
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full h-10 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">
                        Print Controls
                    </span>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                {/* Expanded content */}
                <div className="px-4 py-3 space-y-3">
                    {/* Row 1: Area, Paper, Print button, Exit button */}
                    <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
                        {/* Area dropdown */}
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="scope-select"
                                className="text-sm font-medium text-gray-700 whitespace-nowrap"
                            >
                                Area:
                            </label>
                            <select
                                id="scope-select"
                                value={selectedScope}
                                onChange={(e) =>
                                    setSelectedScope(e.target.value)
                                }
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {SCOPE_OPTIONS.map(({ key, label }) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Paper dropdown */}
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="paper-select"
                                className="text-sm font-medium text-gray-700 whitespace-nowrap"
                            >
                                Paper:
                            </label>
                            <select
                                id="paper-select"
                                value={selectedPaper}
                                onChange={(e) =>
                                    setSelectedPaper(e.target.value)
                                }
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {PAPER_SIZES.map(({ key, label }) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 md:ml-auto">
                            <button
                                type="button"
                                onClick={handleToggleTimeline}
                                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-sm font-medium ${
                                    showTimeline
                                        ? "bg-blue-100 text-blue-600"
                                        : "hover:bg-gray-100 text-gray-600"
                                }`}
                                title="Toggle timeline"
                            >
                                <Clock className="w-4 h-4" />
                                History
                            </button>

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-md transition-colors flex items-center gap-2 text-sm"
                            >
                                <svg
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="6 9 6 2 18 2 18 9" />
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                    <rect x="6" y="14" width="12" height="8" />
                                </svg>
                                Print / Save PDF
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (showTimeline) {
                                        const dateParam = currentDate
                                            .toISOString()
                                            .split("T")[0]
                                        router.push(`/?date=${dateParam}`)
                                    } else {
                                        router.push("/")
                                    }
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 text-sm"
                                title="Exit print mode"
                            >
                                <X className="w-4 h-4" />
                                Exit
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Label toggles */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
                        <span className="text-sm font-medium text-gray-700">
                            Labels:
                        </span>

                        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={labelOptions.showCode}
                                onChange={() => handleLabelToggle("showCode")}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            Codes
                        </label>

                        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={labelOptions.showMilestone}
                                onChange={() =>
                                    handleLabelToggle("showMilestone")
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            Milestones
                        </label>

                        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={labelOptions.showName}
                                onChange={() => handleLabelToggle("showName")}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            Names
                        </label>

                        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={labelOptions.showDate}
                                onChange={() => handleLabelToggle("showDate")}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            Dates
                        </label>
                    </div>

                    {/* Row 3: Timeline (animated expand/collapse) */}
                    <div
                        className="overflow-hidden"
                        style={{
                            display: "grid",
                            gridTemplateRows: showTimeline ? "1fr" : "0fr",
                            transition: "grid-template-rows 300ms ease-in-out",
                        }}
                    >
                        <div className="min-h-0 border-t border-gray-200">
                            <HorizontalTimeline
                                startDate={startDate}
                                endDate={endDate}
                                currentDate={currentDate}
                                onDateChange={onDateChange}
                                milestoneEvents={milestoneEvents}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
