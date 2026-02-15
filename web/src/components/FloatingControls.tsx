"use client"

import { Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import validatedData from "@/data/clusters-timeline.geo.json"
import { useMilestoneEvents } from "@/lib/useMilestoneEvents"
import type { LayerMode } from "@/map/types"
import { FLOATING_ICON_CLASS, FloatingButton } from "./FloatingButton"
import { FloatingLayerPicker } from "./FloatingLayerPicker"
import { FloatingTimelineButton } from "./FloatingTimelineButton"

interface FloatingControlsProps {
    mode: "main" | "print"
    currentDate: Date
    onDateChange: (date: Date) => void
    layerMode?: LayerMode
    onLayerModeChange?: (mode: LayerMode) => void
    initialTimelineOpen?: boolean
}

export const FloatingControls = ({
    mode,
    currentDate,
    onDateChange,
    layerMode = "clusters",
    onLayerModeChange,
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
            {/* Layer picker only in non-print mode */}
            {onLayerModeChange && !isPrintMode && (
                <FloatingLayerPicker
                    layerMode={layerMode}
                    onLayerModeChange={onLayerModeChange}
                />
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
