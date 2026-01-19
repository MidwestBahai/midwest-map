"use client"

import { deepEqual } from "fast-equals"
import type { Feature } from "geojson"
import type { MapMouseEvent } from "mapbox-gl"
import Head from "next/head"
import { useCallback, useEffect, useRef, useState } from "react"
import MapboxMap, { type MapRef } from "react-map-gl/mapbox"
import { useDebug } from "@/app/DebugContext"
import type { LabelOptions } from "@/app/print/types"
import validatedData from "@/data/clusters-timeline.geo.json"
import type { LatLongRect } from "@/lib/latLongRect"
import { useWindowSize } from "@/lib/useWindowSize"
import { ClusterLayers } from "@/map/clusterLayers"
import { CountyBoundaries } from "@/map/countyBoundaries"
import { initialBounds } from "@/map/initialMapBounds"
import { MapProvider } from "@/map/mapContext"
import { MapExperiments } from "@/map/mapExperiments"

// Simple view state for persistence (subset of mapbox's full ViewState)
export interface ViewState {
    latitude: number
    longitude: number
    zoom: number
}

export interface RegionMapProps {
    mapboxAccessToken: string
    showClusters: boolean
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
}

/**
 * Check if a feature matches the scope filter
 */
function matchesScope(feature: Feature, scope: string | undefined): boolean {
    if (!scope || scope === "region") return true

    const clusterCode = feature.properties?.Cluster as string | undefined
    const groupCode = feature.properties?.Group as string | undefined

    if (scope.startsWith("state-")) {
        const stateCode = scope.replace("state-", "")
        return clusterCode?.startsWith(stateCode) ?? false
    }
    if (scope.startsWith("group-")) {
        const targetGroup = scope.replace("group-", "")
        return groupCode === targetGroup
    }
    return true
}

export const RegionMap = ({
    mapboxAccessToken,
    showClusters,
    printMode = false,
    initialDate,
    onMapLoaded,
    currentDate: controlledDate,
    onDateChange,
    viewState: controlledViewState,
    onViewStateChange,
    labelOptions,
    scope,
}: RegionMapProps) => {
    const windowSize = useWindowSize()
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
                              width: windowSize.width,
                              height: windowSize.height,
                          },
                          onMove: (e) =>
                              onViewStateChange?.({
                                  latitude: e.viewState.latitude,
                                  longitude: e.viewState.longitude,
                                  zoom: e.viewState.zoom,
                              }),
                      }
                    : { initialViewState: initialBounds(windowSize) })}
                style={{ width: "100vw", height: "100vh" }}
                mapStyle={
                    printMode
                        ? "mapbox://styles/mapbox/empty-v9" // Minimal style for print
                        : showClusters
                          ? "mapbox://styles/mapbox/light-v11"
                          : "mapbox://styles/mapbox/streets-v12"
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
                    {/* County boundaries - only visible in print mode */}
                    {printMode && <CountyBoundaries visible={printMode} />}

                    {/* Render in two passes to ensure symbols are always above fills */}
                    {/* Pass 1: Fill and line layers */}
                    {features.map((feature) => (
                        <ClusterLayers
                            key={`fill-${feature.properties?.Cluster}`}
                            feature={feature}
                            hoverFeature={
                                printMode ? undefined : hoverFeature
                            }
                            largestRect={pickLargestRect(feature)}
                            currentDate={selectedDate}
                            boundariesOnly={!showClusters}
                            printMode={printMode}
                            labelOptions={labelOptions}
                            renderMode="fill"
                            visible={matchesScope(feature, scope)}
                        />
                    ))}
                    {/* Pass 2: Symbol/text layers (rendered after all fills) */}
                    {showClusters &&
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
                                labelOptions={labelOptions}
                                renderMode="symbol"
                                visible={matchesScope(feature, scope)}
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
