"use client"

import { useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import type { LayerMode } from "@/map/types"
import { LAYER_MODES } from "@/map/types"
import { FLOATING_ICON_CLASS } from "./FloatingButton"

const ICON_CLASS = `${FLOATING_ICON_CLASS} shrink-0`

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
        className={ICON_CLASS}
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
        className={ICON_CLASS}
    >
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
)

// Abstract cluster boundaries — meandering line with T-junction branches
const StatusIcon = () => (
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
        className={ICON_CLASS}
    >
        {/* main boundary meandering across */}
        <polyline points="1,15 5,10 9,13 14,8 19,11 23,9" />
        {/* branch closing the bottom-left cell */}
        <polyline points="9,13 8,19 5,22 2,20 1,15" />
        {/* open branches running off edges */}
        <polyline points="1,1 3,5 5,10" />
        <polyline points="14,8 16,3 18,1" />
        <polyline points="19,11 21,18 23,23" />
    </svg>
)

const LAYER_MODE_OPTIONS: Record<
    LayerMode,
    { icon: React.JSX.Element; label: string }
> = {
    clusters: { icon: <LayersIcon />, label: "Overview" },
    reference: { icon: <MapIcon />, label: "Map" },
    bold: { icon: <StatusIcon />, label: "Clusters" },
}

interface FloatingLayerPickerProps {
    layerMode: LayerMode
    onLayerModeChange: (mode: LayerMode) => void
}

export function FloatingLayerPicker({
    layerMode,
    onLayerModeChange,
}: FloatingLayerPickerProps) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    // Close on Escape
    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false)
                triggerRef.current?.focus()
            }
        }
        document.addEventListener("keydown", handler)
        return () => document.removeEventListener("keydown", handler)
    }, [open])

    const current = LAYER_MODE_OPTIONS[layerMode]

    return (
        <div
            ref={containerRef}
            className="print-hidden fixed bottom-6 right-42 z-[60]"
        >
            {/* Popover panel */}
            <div
                role="menu"
                className={`absolute bottom-full mb-2 right-0 bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-200 origin-bottom-right ${
                    open
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 pointer-events-none"
                }`}
            >
                {LAYER_MODES.map((mode) => {
                    const opt = LAYER_MODE_OPTIONS[mode]
                    const isActive = mode === layerMode
                    return (
                        <button
                            key={mode}
                            type="button"
                            role="menuitemradio"
                            aria-checked={isActive}
                            className={`flex items-center gap-3 w-full px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                                isActive
                                    ? "bg-gray-100 text-gray-900 font-medium"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                            onClick={() => {
                                onLayerModeChange(mode)
                                setOpen(false)
                            }}
                        >
                            {opt.icon}
                            <span>{opt.label}</span>
                            <span
                                className={`ml-auto transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                            >
                                <Check className="w-4 h-4" />
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Trigger button */}
            <button
                ref={triggerRef}
                type="button"
                className="relative rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 bg-white text-gray-700"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label="Select map view"
                title="Select map view"
            >
                {current.icon}
            </button>
        </div>
    )
}
