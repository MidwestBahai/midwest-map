"use client"

import { useEffect, useState } from "react"
import { type ClusterGroup, clusterGroups } from "@/data/clusterGroups"
import type { Milestone } from "@/data/milestoneLabels"
import { milestoneColor } from "@/map/clusterColor"
import { DraggableBox, type DraggablePosition } from "./DraggableBox"


interface DraggableLegendProps {
    groupKey: Exclude<ClusterGroup, "Unknown">
    position: DraggablePosition
    onPositionChange: (position: DraggablePosition) => void
    containerRef: React.RefObject<HTMLDivElement | null>
    /** Scale factor for font sizes and swatch dimensions (1.0 = default at ~600px container) */
    scale?: number
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
    scale = 1,
}: DraggableLegendProps) {
    const [isClient, setIsClient] = useState(false)

    const groupData = clusterGroups[groupKey]
    const groupName = groupData.displayName

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

    const fontSize = Math.round(12 * scale)
    const swatchW = Math.round(20 * scale)
    const swatchH = Math.round(16 * scale)
    const pad = Math.round(8 * scale)
    const gap = Math.round(8 * scale)
    const spacing = Math.round(4 * scale)

    return (
        <DraggableBox
            position={position}
            onPositionChange={onPositionChange}
            containerRef={containerRef}
            className="bg-white border border-gray-400 shadow-sm"
        >
            {/* Header */}
            <div
                className="bg-gray-100 border-b border-gray-300 font-semibold"
                style={{
                    fontSize,
                    padding: `${spacing}px ${pad}px`,
                }}
            >
                {groupName} group
            </div>

            {/* Milestone swatches */}
            <div style={{ padding: pad, display: "flex", flexDirection: "column", gap: spacing }}>
                {printMilestones.map(({ key, label }) => (
                    <div key={key} className="flex items-center" style={{ gap }}>
                        <div
                            className="border border-black flex-shrink-0"
                            style={{
                                width: swatchW,
                                height: swatchH,
                                backgroundColor: milestoneColor(
                                    key,
                                    groupData.baseHue,
                                    undefined,
                                    true,
                                ),
                                printColorAdjust: "exact",
                                WebkitPrintColorAdjust: "exact",
                            }}
                        />
                        <span className="whitespace-nowrap" style={{ fontSize }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </DraggableBox>
    )
}
