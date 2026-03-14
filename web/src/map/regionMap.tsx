"use client"

import { deepEqual } from "fast-equals"
import type { Feature } from "geojson"
import type { MapMouseEvent } from "mapbox-gl"
import Head from "next/head"
import { useCallback, useEffect, useRef, useState } from "react"
import MapboxMap, { type MapRef } from "react-map-gl/mapbox"
import { useDebug } from "@/app/DebugContext"
import type { LabelOptions } from "@/app/print/types"
import { FloatingSearch } from "@/components/FloatingSearch"
import validatedData from "@/data/clusters-timeline.geo.json"
import type { LatLongRect } from "@/lib/latLongRect"
import { matchesScope } from "@/lib/scopeFilter"
import { useWindowSize } from "@/lib/useWindowSize"
import { ClusterLayers } from "@/map/clusterLayers"
import { CountyBoundaries } from "@/map/countyBoundaries"
import { initialBounds } from "@/map/initialMapBounds"
import { MapProvider } from "@/map/mapContext"
import { MapExperiments } from "@/map/mapExperiments"
import type { LayerMode } from "@/map/types"

// Simple view state for persistence (subset of mapbox's full ViewState)
export interface ViewState {
    latitude: number
    longitude: number
    zoom: number
}

export interface RegionMapProps {
    mapboxAccessToken: string
    // Layer mode for the interactive map view (clusters, reference, bold)
    layerMode?: LayerMode
    // Print mode is separate from layer modes (used by /print route)
    printMode?: boolean
    initialDate?: Date
    onMapLoaded?: () => void
    // For controlled mode (when parent manages date state)
    currentDate?: Date
    onDateChange?: (date: Date) => void
    // For controlled view state (zoom/pan)
    viewState?: ViewState
    onViewStateChange?: (viewState: ViewState) => void
    // Print mode options
    labelOptions?: LabelOptions
    scope?: string
    // Optional container dimensions (used by print mode for aspect-ratio containers)
    containerWidth?: number
    containerHeight?: number
    // Scaled text size for print labels (proportional to container width)
    printTextSize?: number
}

export const RegionMap = ({
    mapboxAccessToken,
    layerMode = "clusters",
    printMode = false,
    initialDate,
    onMapLoaded,
    currentDate: controlledDate,
    onDateChange,
    viewState: controlledViewState,
    onViewStateChange,
    labelOptions,
    scope,
    containerWidth,
    containerHeight,
    printTextSize,
}: RegionMapProps) => {
    const windowSize = useWindowSize()
    const effectiveWidth = containerWidth ?? windowSize.width
    const effectiveHeight = containerHeight ?? windowSize.height
    const { showGeoJsonDetails, showCollisionBoxes } = useDebug()

    const [hoverFeature, setHoverFeature] = useState<Feature | undefined>(
        undefined,
    )
    const [internalDate, setInternalDate] = useState<Date>(
        initialDate ?? new Date(),
    )

    // Support both controlled and uncontrolled modes
    const selectedDate = controlledDate ?? internalDate
    const _setSelectedDate = onDateChange ?? setInternalDate

    const onHover = useCallback(
        (event: MapMouseEvent) => {
            const { features } = event
            const newHoverFeature = features?.[0]
            // Only compare properties to see if a new cluster is hovered — the feature object itself is different each time.
            // Technically could just compare ID, but deep equality seems more robust.
            // Maybe we should figure out why?
            if (
                !deepEqual(
                    newHoverFeature?.properties,
                    hoverFeature?.properties,
                )
            )
                setHoverFeature(newHoverFeature)
        },
        [hoverFeature],
    )

    const mapRef = useRef<MapRef>(null)
    const [mapRefState, setMapRefState] = useState<MapRef | undefined>()

    useEffect(() => {
        const map = mapRef.current?.getMap()
        if (showCollisionBoxes && map && !map.showCollisionBoxes)
            map.showCollisionBoxes = true
    })

    // Zod validates, but the TypeScript types are not strictly compatible, so we have to cast.
    // TODO See time series updates in comments here: https://docs.google.com/spreadsheets/d/1NplBKdFrqkTsiqxfHgh6wciuCb8wopp97s_h8eRRJIQ/edit?gid=1531826735#gid=1531826735
    const features = validatedData.features as Feature[]
    const isReference = layerMode === "reference"
    const isBold = layerMode === "bold"

    // It's okay if <Map> is also rendered on the server — the canvas won't be created, just a placeholder div.
    // See https://github.com/visgl/react-map-gl/issues/568
    return (
        <>
            <Head>
                <link
                    href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css"
                    rel="stylesheet"
                />
            </Head>
            <MapboxMap
                mapboxAccessToken={mapboxAccessToken}
                {...(controlledViewState
                    ? {
                          viewState: {
                              ...controlledViewState,
                              bearing: 0,
                              pitch: 0,
                              padding: { top: 0, bottom: 0, left: 0, right: 0 },
                              width: effectiveWidth,
                              height: effectiveHeight,
                          },
                          onMove: (e) =>
                              onViewStateChange?.({
                                  latitude: e.viewState.latitude,
                                  longitude: e.viewState.longitude,
                                  zoom: e.viewState.zoom,
                              }),
                      }
                    : { initialViewState: initialBounds(windowSize) })}
                style={{
                    width: containerWidth ? "100%" : "100vw",
                    height: containerHeight ? "100%" : "100vh",
                }}
                mapStyle={
                    printMode || isBold
                        ? "mapbox://styles/mapbox/empty-v9" // Minimal style for print and bold modes
                        : isReference
                          ? "mapbox://styles/mapbox/streets-v12"
                          : "mapbox://styles/mapbox/light-v11" // clusters mode
                }
                interactiveLayerIds={
                    printMode
                        ? []
                        : validatedData.features.map(
                              (f) => `cluster-${f.properties?.Cluster}`,
                          )
                }
                onMouseMove={printMode ? undefined : onHover}
                onLoad={() => {
                    setMapRefState(mapRef.current ?? undefined)
                    // For print mode, notify when map is loaded
                    if (printMode && onMapLoaded) {
                        // Wait for tiles to render
                        const map = mapRef.current?.getMap()
                        if (map) {
                            const checkIdle = () => {
                                if (
                                    map.isStyleLoaded() &&
                                    map.areTilesLoaded()
                                ) {
                                    onMapLoaded()
                                } else {
                                    map.once("idle", checkIdle)
                                }
                            }
                            checkIdle()
                        }
                    }
                }}
                ref={mapRef}
            >
                <MapProvider mapRef={mapRefState}>
                    {!printMode && <FloatingSearch features={features} />}
                    {/* County boundaries - only visible in print mode */}
                    {printMode && <CountyBoundaries scope={scope} />}

                    {/* Render in two passes to ensure symbols are always above fills */}
                    {/* Pass 1: Fill and line layers */}
                    {features.map((feature) => (
                        <ClusterLayers
                            key={`fill-${feature.properties?.Cluster}`}
                            feature={feature}
                            hoverFeature={printMode ? undefined : hoverFeature}
                            largestRect={pickLargestRect(feature)}
                            currentDate={selectedDate}
                            boundariesOnly={isReference}
                            printMode={printMode}
                            boldColors={isBold}
                            labelOptions={labelOptions}
                            renderMode="fill"
                            visible={matchesScope(feature, scope)}
                        />
                    ))}
                    {/* Pass 2: Symbol/text layers (rendered after all fills) */}
                    {!isReference &&
                        features.map((feature) => (
                            <ClusterLayers
                                key={`symbol-${feature.properties?.Cluster}`}
                                feature={feature}
                                hoverFeature={
                                    printMode ? undefined : hoverFeature
                                }
                                largestRect={pickLargestRect(feature)}
                                currentDate={selectedDate}
                                boundariesOnly={false}
                                printMode={printMode}
                                boldColors={isBold}
                                labelOptions={labelOptions}
                                renderMode="symbol"
                                visible={matchesScope(feature, scope)}
                                printTextSize={printTextSize}
                            />
                        ))}
                    {hoverFeature && showGeoJsonDetails && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                padding: "1em",
                                backgroundColor: "white",
                                color: "black",
                            }}
                        >
                            <p>
                                {JSON.stringify(
                                    hoverFeature.properties,
                                    undefined,
                                    1,
                                )}
                            </p>
                        </div>
                    )}
                    <MapExperiments />
                </MapProvider>
            </MapboxMap>
        </>
    )
}

const pickLargestRect = (feature: Feature) => {
    const clusterName = feature.properties?.Cluster
    if (
        typeof clusterName === "string" &&
        clusterName in validatedData.largestClusterRects
    ) {
        const largestRects = validatedData.largestClusterRects as Record<
            string,
            LatLongRect
        >
        return largestRects[clusterName]
    }
}
