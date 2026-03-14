"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Feature } from "geojson"
import { useSearchParams } from "next/navigation"
import {
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { DebugProvider } from "@/app/DebugContext"
import { clusterGroups, type ClusterGroup } from "@/data/clusterGroups"
import validatedData from "@/data/clusters-timeline.geo.json"
import { TIMING } from "@/lib/constants"
import { matchesScope } from "@/lib/scopeFilter"
import { loadFromStorage, saveToStorage } from "@/lib/storage"
import { CategoryHighlightProvider } from "@/map/categoryHighlightContext"
import { initialBounds } from "@/map/initialMapBounds"
import { RegionMap, type ViewState } from "@/map/regionMap"
import { DraggableBox, type DraggablePosition } from "./DraggableBox"
import { DraggableLegend } from "./DraggableLegend"
import { calculateContainerSize } from "./paperDimensions"
import { PrintToolbar } from "./PrintToolbar"
import { DEFAULT_LABEL_OPTIONS, type LabelOptions } from "./types"
import { usePageSize } from "./usePageSize"

const queryClient = new QueryClient()

// Cluster groups to show legends for (exclude Unknown)
type DisplayClusterGroup = Exclude<ClusterGroup, "Unknown">
const displayGroups = (Object.keys(clusterGroups) as ClusterGroup[]).filter(
    (k): k is DisplayClusterGroup => k !== "Unknown",
)

// localStorage keys for persisting state
const LEGEND_STORAGE_KEY = "print-legend-positions"
const TITLE_STORAGE_KEY = "print-title-position"
const VIEW_STORAGE_KEY = "print-map-view"

// Default legend positions as container percentages
// These get converted to pixels on mount based on actual container size
const defaultPositionsPercent: Record<
    DisplayClusterGroup,
    { xPercent: number; yPercent: number }
> = {
    INDY: { xPercent: 3, yPercent: 15 }, // Indianapolis: left side, upper
    GR: { xPercent: 3, yPercent: 35 }, // Grand Rapids: left side, middle
    AA: { xPercent: 3, yPercent: 55 }, // Ann Arbor: left side, lower
    CLV: { xPercent: 85, yPercent: 15 }, // Cleveland: right side, upper
    CBUS: { xPercent: 85, yPercent: 45 }, // Columbus: right side, lower
}

// Convert percentage positions to pixels based on container dimensions
function getDefaultPixelPositions(
    width: number,
    height: number,
): Record<DisplayClusterGroup, DraggablePosition> {
    const result = {} as Record<DisplayClusterGroup, DraggablePosition>
    for (const key of displayGroups) {
        const { xPercent, yPercent } = defaultPositionsPercent[key]
        result[key] = {
            x: Math.round((xPercent / 100) * width),
            y: Math.round((yPercent / 100) * height),
        }
    }
    return result
}

// Default title position as container percentages (top-right corner)
const defaultTitlePositionPercent = { xPercent: 75, yPercent: 2 }

// Convert title percentage position to pixels based on container dimensions
function getDefaultTitlePosition(
    width: number,
    height: number,
): DraggablePosition {
    return {
        x: Math.round((defaultTitlePositionPercent.xPercent / 100) * width),
        y: Math.round((defaultTitlePositionPercent.yPercent / 100) * height),
    }
}

/**
 * Get subtitle for scope selection (returns null for full region)
 */
function getSubtitleForScope(scope: string): string | null {
    if (scope === "region") return null

    const scopeLabels: Record<string, string> = {
        "state-IN": "Indiana",
        "state-MI": "Michigan",
        "state-OH": "Ohio",
        "group-CLV": "Cleveland Grouping",
        "group-CBUS": "Columbus Grouping",
        "group-GR": "Grand Rapids Grouping",
        "group-INDY": "Indianapolis Grouping",
        "group-AA": "Washtenaw Grouping",
    }

    return scopeLabels[scope] ?? null
}

/**
 * Get which cluster groups have visible clusters in the current scope
 */
function getVisibleGroups(
    features: Feature[],
    scope: string,
): Set<DisplayClusterGroup> {
    const visibleGroups = new Set<DisplayClusterGroup>()
    for (const feature of features) {
        if (matchesScope(feature, scope)) {
            const group = feature.properties?.Group as string | undefined
            if (group && displayGroups.includes(group as DisplayClusterGroup)) {
                visibleGroups.add(group as DisplayClusterGroup)
            }
        }
    }
    return visibleGroups
}

function PrintMapInner({ mapboxAccessToken }: { mapboxAccessToken: string }) {
    const searchParams = useSearchParams()
    const [mapLoaded, setMapLoaded] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Legend positions state - null until initialized on client
    const [legendPositions, setLegendPositions] = useState<Record<
        DisplayClusterGroup,
        DraggablePosition
    > | null>(null)

    // Title position state - null until initialized on client
    const [titlePosition, setTitlePosition] =
        useState<DraggablePosition | null>(null)

    // Map view state - null until initialized on client
    const [viewState, setViewState] = useState<ViewState | null>(null)

    // Print controls state
    const [labelOptions, setLabelOptions] = useState<LabelOptions>(
        DEFAULT_LABEL_OPTIONS,
    )
    const [selectedScope, setSelectedScope] = useState("region")
    const [selectedPaper, setSelectedPaper] = useState("poster-24x36")

    // Container size — tracks paper aspect ratio within available viewport space
    const [containerSize, setContainerSize] = useState(() => {
        if (typeof window === "undefined") return { width: 0, height: 0 }
        return calculateContainerSize(
            window.innerWidth,
            window.innerHeight,
            selectedPaper,
        )
    })

    // Update container size on window resize or paper change
    useEffect(() => {
        const update = () => {
            setContainerSize(
                calculateContainerSize(
                    window.innerWidth,
                    window.innerHeight,
                    selectedPaper,
                ),
            )
        }
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [selectedPaper])

    // Inject dynamic @page CSS for the selected paper size + print zoom
    usePageSize(selectedPaper, containerSize.width)

    // Cast features for filtering (TypeScript compatibility)
    const allFeatures = validatedData.features as Feature[]

    // Scale factor for UI elements (legends, title) — 1.0 at 600px container width
    const uiScale = Math.max(0.5, Math.min(1.2, containerSize.width / 600))

    // Compute which groups are visible based on current scope
    const visibleGroups = useMemo(
        () => getVisibleGroups(allFeatures, selectedScope),
        [allFeatures, selectedScope],
    )

    // Compute subtitle for scope
    const subtitle = useMemo(
        () => getSubtitleForScope(selectedScope),
        [selectedScope],
    )

    // Initialize legend positions on mount (client-side only)
    useEffect(() => {
        // Try to load from localStorage first
        const stored = loadFromStorage<
            Record<DisplayClusterGroup, DraggablePosition>
        >(LEGEND_STORAGE_KEY)
        if (stored) {
            setLegendPositions(stored)
        } else {
            // Calculate defaults based on container size
            const size = calculateContainerSize(
                window.innerWidth,
                window.innerHeight,
                "poster-24x36",
            )
            const defaults = getDefaultPixelPositions(size.width, size.height)
            setLegendPositions(defaults)
        }
    }, [])

    // Initialize title position on mount (client-side only)
    useEffect(() => {
        const stored = loadFromStorage<DraggablePosition>(TITLE_STORAGE_KEY)
        if (stored) {
            setTitlePosition(stored)
        } else {
            const size = calculateContainerSize(
                window.innerWidth,
                window.innerHeight,
                "poster-24x36",
            )
            const defaultPos = getDefaultTitlePosition(size.width, size.height)
            setTitlePosition(defaultPos)
        }
    }, [])

    // Initialize view state on mount
    useEffect(() => {
        const stored = loadFromStorage<ViewState>(VIEW_STORAGE_KEY)
        if (stored) {
            setViewState(stored)
        } else {
            // Use default bounds based on container size
            const size = calculateContainerSize(
                window.innerWidth,
                window.innerHeight,
                "poster-24x36",
            )
            const defaults = initialBounds(size)
            if (defaults) {
                setViewState(defaults)
            }
        }
    }, [])

    // Save legend positions to localStorage when they change
    useEffect(() => {
        if (legendPositions) {
            saveToStorage(LEGEND_STORAGE_KEY, legendPositions)
        }
    }, [legendPositions])

    // Save title position to localStorage when it changes
    useEffect(() => {
        if (titlePosition) {
            saveToStorage(TITLE_STORAGE_KEY, titlePosition)
        }
    }, [titlePosition])

    // Save view state to localStorage when it changes (debounced to avoid performance issues)
    useEffect(() => {
        if (!viewState) return
        const timeout = setTimeout(() => {
            saveToStorage(VIEW_STORAGE_KEY, viewState)
        }, TIMING.debounceMs)
        return () => clearTimeout(timeout)
    }, [viewState])

    // Parse date from query param, default to today
    const dateParam = searchParams.get("date")
    const initialDate = dateParam ? new Date(dateParam) : new Date()
    const isValidDate = !Number.isNaN(initialDate.getTime())

    // Current date state - can be changed via timeline
    const [currentDate, setCurrentDate] = useState<Date>(
        isValidDate ? initialDate : new Date(),
    )

    const handleMapLoaded = useCallback(() => {
        setMapLoaded(true)
        // Add a class to the document for Puppeteer to detect
        document.documentElement.classList.add("map-loaded")
    }, [])

    const handleLegendPositionChange = useCallback(
        (groupKey: DisplayClusterGroup, position: DraggablePosition) => {
            setLegendPositions((prev) =>
                prev
                    ? {
                          ...prev,
                          [groupKey]: position,
                      }
                    : null,
            )
        },
        [],
    )

    return (
        <DebugProvider debug={false}>
            <QueryClientProvider client={queryClient}>
                <CategoryHighlightProvider>
                    {/* Gray viewport background */}
                    <div className="print-page-root w-screen h-screen bg-neutral-300 overflow-hidden print:bg-white">
                        {/* Centering wrapper — positions container above toolbar */}
                        <div
                            className="print-centering-wrapper flex items-center justify-center"
                            style={{ height: "calc(100vh - 40px)" }}
                        >
                            {/* Print container — aspect ratio matches selected paper */}
                            {containerSize.width > 0 && (
                                <div
                                    ref={containerRef}
                                    className="relative bg-white shadow-lg overflow-hidden print-container"
                                    style={{
                                        width: containerSize.width,
                                        height: containerSize.height,
                                    }}
                                >
                                    {viewState && (
                                        <RegionMap
                                            mapboxAccessToken={
                                                mapboxAccessToken
                                            }
                                            printMode={true}
                                            currentDate={currentDate}
                                            onDateChange={setCurrentDate}
                                            onMapLoaded={handleMapLoaded}
                                            viewState={viewState}
                                            onViewStateChange={setViewState}
                                            labelOptions={labelOptions}
                                            scope={selectedScope}
                                            containerWidth={
                                                containerSize.width
                                            }
                                            containerHeight={
                                                containerSize.height
                                            }
                                            printTextSize={Math.max(
                                                7,
                                                Math.min(
                                                    16,
                                                    Math.round(
                                                        13 *
                                                            containerSize.width /
                                                            600,
                                                    ),
                                                ),
                                            )}
                                        />
                                    )}

                                    {/* Draggable legends - one per cluster group (filtered by scope) */}
                                    {mapLoaded &&
                                        legendPositions &&
                                        displayGroups
                                            .filter((groupKey) =>
                                                visibleGroups.has(groupKey),
                                            )
                                            .map((groupKey) => (
                                                <DraggableLegend
                                                    key={groupKey}
                                                    groupKey={groupKey}
                                                    position={
                                                        legendPositions[
                                                            groupKey
                                                        ]
                                                    }
                                                    onPositionChange={(pos) =>
                                                        handleLegendPositionChange(
                                                            groupKey,
                                                            pos,
                                                        )
                                                    }
                                                    containerRef={containerRef}
                                                    scale={uiScale}
                                                />
                                            ))}

                                    {/* Draggable Title */}
                                    {mapLoaded && titlePosition && (
                                        <DraggableBox
                                            position={titlePosition}
                                            onPositionChange={setTitlePosition}
                                            containerRef={containerRef}
                                            className="bg-white/90 rounded shadow print:shadow-none"
                                            style={{
                                                padding: `${8 * uiScale}px ${16 * uiScale}px`,
                                            }}
                                            zIndex={20}
                                            zIndexDragging={100}
                                        >
                                            <h1
                                                className="font-bold text-center"
                                                style={{
                                                    fontSize: `${20 * uiScale}px`,
                                                }}
                                            >
                                                Midwest Region Cluster
                                                Advancement
                                            </h1>
                                            {subtitle && (
                                                <p
                                                    className="italic text-gray-700 text-center"
                                                    style={{
                                                        fontSize: `${16 * uiScale}px`,
                                                    }}
                                                >
                                                    {subtitle}
                                                </p>
                                            )}
                                            <p
                                                className="text-gray-600 text-center"
                                                style={{
                                                    fontSize: `${14 * uiScale}px`,
                                                }}
                                            >
                                                As of{" "}
                                                {currentDate.toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        month: "long",
                                                        year: "numeric",
                                                    },
                                                )}{" "}
                                                · map.midwestbahai.org
                                            </p>
                                        </DraggableBox>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Print toolbar - hidden during actual print */}
                        {mapLoaded && (
                            <PrintToolbar
                                currentDate={currentDate}
                                onDateChange={setCurrentDate}
                                initialShowTimeline={Boolean(
                                    dateParam && isValidDate,
                                )}
                                labelOptions={labelOptions}
                                onLabelOptionsChange={setLabelOptions}
                                selectedScope={selectedScope}
                                onScopeChange={setSelectedScope}
                                selectedPaper={selectedPaper}
                                onPaperChange={setSelectedPaper}
                            />
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

export function PrintClient({
    mapboxAccessToken,
}: {
    mapboxAccessToken: string
}) {
    if (!mapboxAccessToken) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-500">Mapbox token not configured</p>
            </div>
        )
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen">
                    Loading...
                </div>
            }
        >
            <PrintMapInner mapboxAccessToken={mapboxAccessToken} />
        </Suspense>
    )
}
