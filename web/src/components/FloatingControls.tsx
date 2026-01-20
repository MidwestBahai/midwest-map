"use client"

import { Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import validatedData from "@/data/clusters-timeline.geo.json"
import { useMilestoneEvents } from "@/lib/useMilestoneEvents"
import { FLOATING_ICON_CLASS, FloatingButton } from "./FloatingButton"
import { FloatingTimelineButton } from "./FloatingTimelineButton"

interface FloatingControlsProps {
    mode: "main" | "print"
    currentDate: Date
    onDateChange: (date: Date) => void
    showClusters?: boolean
    onToggleClusters?: () => void
    initialTimelineOpen?: boolean
}

// Layer toggle icons
const LayersIcon = () => (
    <svg
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={FLOATING_ICON_CLASS}
    >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
)

const MapIcon = () => (
    <svg
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={FLOATING_ICON_CLASS}
    >
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
)

export const FloatingControls = ({
    mode,
    currentDate,
    onDateChange,
    showClusters = true,
    onToggleClusters,
    initialTimelineOpen = false,
}: FloatingControlsProps) => {
    const router = useRouter()
    const milestoneEvents = useMilestoneEvents()
    const isPrintMode = mode === "print"

    // Check if current date is today (meaning timeline is effectively "closed")
    const isToday =
        currentDate.toISOString().split("T")[0] ===
        new Date().toISOString().split("T")[0]

    const handlePrintButtonClick = () => {
        if (isPrintMode) {
            if (isToday) {
                router.push("/")
            } else {
                const dateParam = currentDate.toISOString().split("T")[0]
                router.push(`/?date=${dateParam}`)
            }
        } else {
            if (isToday) {
                router.push("/print")
            } else {
                const dateParam = currentDate.toISOString().split("T")[0]
                router.push(`/print?date=${dateParam}`)
            }
        }
    }

    return (
        <>
            {/* Layer toggle only in non-print mode */}
            {onToggleClusters && !isPrintMode && (
                <FloatingButton
                    position="layers"
                    onClick={onToggleClusters}
                    ariaLabel={showClusters ? "Hide clusters" : "Show clusters"}
                    title={showClusters ? "Hide clusters" : "Show clusters"}
                >
                    {showClusters ? <LayersIcon /> : <MapIcon />}
                </FloatingButton>
            )}

            {/* Print/Export button */}
            <FloatingButton
                position="print"
                onClick={handlePrintButtonClick}
                active={isPrintMode}
                ariaLabel={
                    isPrintMode ? "Exit print mode" : "Export map for printing"
                }
                title={
                    isPrintMode ? "Exit print mode" : "Export map for printing"
                }
            >
                <Printer className={FLOATING_ICON_CLASS} />
            </FloatingButton>

            {/* Timeline button */}
            <div className="print-hidden">
                <FloatingTimelineButton
                    startDate={new Date(validatedData.timelineBounds.minDate)}
                    endDate={new Date(validatedData.timelineBounds.maxDate)}
                    currentDate={currentDate}
                    onDateChange={onDateChange}
                    milestoneEvents={milestoneEvents}
                    initialOpen={initialTimelineOpen}
                />
            </div>
        </>
    )
}
