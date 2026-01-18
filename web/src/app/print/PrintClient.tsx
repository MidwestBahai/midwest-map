"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useState, useRef, useEffect } from "react"
import { RegionMap, ViewState } from "@/map/regionMap"
import { initialBounds } from "@/map/initialMapBounds"
import { CategoryHighlightProvider } from "@/map/categoryHighlightContext"
import { DebugProvider } from "@/app/DebugContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DraggableLegend, LegendPosition } from "./DraggableLegend"
import { DraggableBox, DraggablePosition } from "./DraggableBox"
import { ClusterGroup } from "@/data/clusterGroups"

const queryClient = new QueryClient()

// Cluster groups to show legends for (exclude Unknown)
type DisplayClusterGroup = Exclude<ClusterGroup, "Unknown">
const displayGroups: DisplayClusterGroup[] = ["INDY", "CLV", "CBUS", "AA", "GR"]

// localStorage keys for persisting state
const LEGEND_STORAGE_KEY = "print-legend-positions"
const TITLE_STORAGE_KEY = "print-title-position"
const VIEW_STORAGE_KEY = "print-map-view"

// Default legend positions as viewport percentages
// These get converted to pixels on mount based on actual viewport size
const defaultPositionsPercent: Record<DisplayClusterGroup, { xPercent: number; yPercent: number }> = {
    INDY: { xPercent: 3, yPercent: 15 },     // Indianapolis: left side, upper
    GR: { xPercent: 3, yPercent: 35 },       // Grand Rapids: left side, middle
    AA: { xPercent: 3, yPercent: 55 },       // Ann Arbor: left side, lower
    CLV: { xPercent: 85, yPercent: 15 },     // Cleveland: right side, upper
    CBUS: { xPercent: 85, yPercent: 45 },    // Columbus: right side, lower
}

// Convert percentage positions to pixels based on viewport
function getDefaultPixelPositions(width: number, height: number): Record<DisplayClusterGroup, LegendPosition> {
    const result = {} as Record<DisplayClusterGroup, LegendPosition>
    for (const key of displayGroups) {
        const { xPercent, yPercent } = defaultPositionsPercent[key]
        result[key] = {
            x: Math.round((xPercent / 100) * width),
            y: Math.round((yPercent / 100) * height),
        }
    }
    return result
}

// Load legend positions from localStorage
function loadLegendPositions(): Record<DisplayClusterGroup, LegendPosition> | null {
    if (typeof window === "undefined") return null
    try {
        const stored = localStorage.getItem(LEGEND_STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch {
        // Ignore parse errors
    }
    return null
}

// Save legend positions to localStorage
function saveLegendPositions(positions: Record<DisplayClusterGroup, LegendPosition>) {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(LEGEND_STORAGE_KEY, JSON.stringify(positions))
    } catch {
        // Ignore storage errors
    }
}

// Default title position as viewport percentages (top-right corner)
const defaultTitlePositionPercent = { xPercent: 75, yPercent: 2 }

// Convert title percentage position to pixels based on viewport
function getDefaultTitlePosition(width: number, height: number): DraggablePosition {
    return {
        x: Math.round((defaultTitlePositionPercent.xPercent / 100) * width),
        y: Math.round((defaultTitlePositionPercent.yPercent / 100) * height),
    }
}

// Load title position from localStorage
function loadTitlePosition(): DraggablePosition | null {
    if (typeof window === "undefined") return null
    try {
        const stored = localStorage.getItem(TITLE_STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch {
        // Ignore parse errors
    }
    return null
}

// Save title position to localStorage
function saveTitlePosition(position: DraggablePosition) {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(TITLE_STORAGE_KEY, JSON.stringify(position))
    } catch {
        // Ignore storage errors
    }
}

// Load map view state from localStorage
function loadViewState(): ViewState | null {
    if (typeof window === "undefined") return null
    try {
        const stored = localStorage.getItem(VIEW_STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch {
        // Ignore parse errors
    }
    return null
}

// Save map view state to localStorage
function saveViewState(viewState: ViewState) {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(viewState))
    } catch {
        // Ignore storage errors
    }
}

function PrintMapInner({ mapboxAccessToken }: { mapboxAccessToken: string }) {
    const searchParams = useSearchParams()
    const [mapLoaded, setMapLoaded] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Legend positions state - null until initialized on client
    const [legendPositions, setLegendPositions] = useState<Record<DisplayClusterGroup, LegendPosition> | null>(null)

    // Title position state - null until initialized on client
    const [titlePosition, setTitlePosition] = useState<DraggablePosition | null>(null)

    // Map view state - null until initialized on client
    const [viewState, setViewState] = useState<ViewState | null>(null)

    // Initialize legend positions on mount (client-side only)
    useEffect(() => {
        // Try to load from localStorage first
        const stored = loadLegendPositions()
        if (stored) {
            setLegendPositions(stored)
        } else {
            // Calculate defaults based on viewport size
            const defaults = getDefaultPixelPositions(window.innerWidth, window.innerHeight)
            setLegendPositions(defaults)
        }
    }, [])

    // Initialize title position on mount (client-side only)
    useEffect(() => {
        const stored = loadTitlePosition()
        if (stored) {
            setTitlePosition(stored)
        } else {
            const defaultPos = getDefaultTitlePosition(window.innerWidth, window.innerHeight)
            setTitlePosition(defaultPos)
        }
    }, [])

    // Initialize view state on mount
    useEffect(() => {
        const stored = loadViewState()
        if (stored) {
            setViewState(stored)
        } else {
            // Use default bounds based on window size
            const defaults = initialBounds({ width: window.innerWidth, height: window.innerHeight })
            if (defaults) {
                setViewState(defaults)
            }
        }
    }, [])

    // Save legend positions to localStorage when they change
    useEffect(() => {
        if (legendPositions) {
            saveLegendPositions(legendPositions)
        }
    }, [legendPositions])

    // Save title position to localStorage when it changes
    useEffect(() => {
        if (titlePosition) {
            saveTitlePosition(titlePosition)
        }
    }, [titlePosition])

    // Save view state to localStorage when it changes (debounced to avoid performance issues)
    useEffect(() => {
        if (!viewState) return
        const timeout = setTimeout(() => {
            saveViewState(viewState)
        }, 500) // Only save after 500ms of no changes
        return () => clearTimeout(timeout)
    }, [viewState])

    // Parse date from query param, default to today
    const dateParam = searchParams.get("date")
    const initialDate = dateParam ? new Date(dateParam) : new Date()

    // Validate date
    const isValidDate = !isNaN(initialDate.getTime())
    const effectiveDate = isValidDate ? initialDate : new Date()

    // Check if this is current data (within 1 day of today)
    const today = new Date()
    const daysDiff = Math.abs(today.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
    const isCurrentData = daysDiff < 1

    const handleMapLoaded = useCallback(() => {
        setMapLoaded(true)
        // Add a class to the document for Puppeteer to detect
        document.documentElement.classList.add("map-loaded")
    }, [])

    const handleLegendPositionChange = useCallback((groupKey: DisplayClusterGroup, position: LegendPosition) => {
        setLegendPositions(prev => prev ? {
            ...prev,
            [groupKey]: position,
        } : null)
    }, [])

    return (
        <DebugProvider debug={false}>
            <QueryClientProvider client={queryClient}>
                <CategoryHighlightProvider>
                    <div ref={containerRef} className="relative w-screen h-screen bg-white">
                        {viewState && (
                            <RegionMap
                                mapboxAccessToken={mapboxAccessToken}
                                showClusters={true}
                                printMode={true}
                                initialDate={effectiveDate}
                                onMapLoaded={handleMapLoaded}
                                viewState={viewState}
                                onViewStateChange={setViewState}
                            />
                        )}

                        {/* Draggable legends - one per cluster group */}
                        {mapLoaded && legendPositions && displayGroups.map(groupKey => (
                            <DraggableLegend
                                key={groupKey}
                                groupKey={groupKey}
                                position={legendPositions[groupKey]}
                                onPositionChange={(pos) => handleLegendPositionChange(groupKey, pos)}
                                containerRef={containerRef}
                            />
                        ))}

                        {/* Draggable Title */}
                        {mapLoaded && titlePosition && (
                            <DraggableBox
                                position={titlePosition}
                                onPositionChange={setTitlePosition}
                                containerRef={containerRef}
                                className="bg-white/90 px-4 py-2 rounded shadow print:shadow-none"
                                zIndex={20}
                                zIndexDragging={100}
                            >
                                <h1 className="text-xl font-bold text-center">Midwest Region Cluster Advancement</h1>
                                <p className="text-sm text-gray-600 text-center">
                                    As of {effectiveDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · map.midwestbahai.org
                                </p>
                            </DraggableBox>
                        )}

                        {/* Warning banner for historical data */}
                        {!isCurrentData && mapLoaded && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-100 border border-amber-400 text-amber-800 px-4 py-2 rounded shadow">
                                <p className="text-sm font-medium">
                                    Historical view: {effectiveDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                </p>
                            </div>
                        )}

                        {/* Loading indicator (hidden when loaded) */}
                        {!mapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
                                <div className="text-lg">Loading map...</div>
                            </div>
                        )}
                    </div>
                </CategoryHighlightProvider>
            </QueryClientProvider>
        </DebugProvider>
    )
}

export function PrintClient({ mapboxAccessToken }: { mapboxAccessToken: string }) {
    if (!mapboxAccessToken) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500">Mapbox token not configured</p>
            </div>
        )
    }

    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <PrintMapInner mapboxAccessToken={mapboxAccessToken} />
        </Suspense>
    )
}
