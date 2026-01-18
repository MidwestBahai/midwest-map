"use client"

import { useState, useEffect } from "react"
import { ClusterGroup, clusterGroups } from "@/data/clusterGroups"
import { milestoneColor } from "@/map/clusterColor"
import { Milestone } from "@/data/milestoneLabels"
import { DraggableBox, DraggablePosition } from "./DraggableBox"

// Re-export for backwards compatibility
export type { DraggablePosition }
export type LegendPosition = DraggablePosition

interface DraggableLegendProps {
    groupKey: Exclude<ClusterGroup, "Unknown">
    position: DraggablePosition
    onPositionChange: (position: DraggablePosition) => void
    containerRef: React.RefObject<HTMLDivElement | null>
}

// Simplified milestone list for print
// - Combine "No PoG" + "Emerging" into one entry (use lighter "n" color)
// - Omit Reservoir (it's just a darker M3)
const printMilestones: { key: Milestone; label: string }[] = [
    { key: "n", label: "No PoG" },
    { key: "m1", label: "M1" },
    { key: "m2", label: "M2" },
    { key: "m3", label: "M3" },
]

export function DraggableLegend({
    groupKey,
    position,
    onPositionChange,
    containerRef,
}: DraggableLegendProps) {
    const [isClient, setIsClient] = useState(false)

    const groupData = clusterGroups[groupKey]
    const groupName = groupData.cities[0] ?? groupKey

    // Ensure colors are computed on client (needs Canvas)
    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return (
            <div
                className="absolute bg-white border border-gray-300 p-2 text-xs"
                style={{ left: 10, top: 10 }}
            >
                Loading...
            </div>
        )
    }

    return (
        <DraggableBox
            position={position}
            onPositionChange={onPositionChange}
            containerRef={containerRef}
            className="bg-white border border-gray-400 shadow-sm"
        >
            {/* Header */}
            <div className="bg-gray-100 px-2 py-1 border-b border-gray-300 text-xs font-semibold">
                {groupName} group
            </div>

            {/* Milestone swatches */}
            <div className="p-2 space-y-1">
                {printMilestones.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                        <div
                            className="w-5 h-4 border border-black flex-shrink-0"
                            style={{
                                backgroundColor: milestoneColor(key, groupData.baseHue, undefined, true),
                            }}
                        />
                        <span className="text-xs whitespace-nowrap">{label}</span>
                    </div>
                ))}
            </div>
        </DraggableBox>
    )
}
