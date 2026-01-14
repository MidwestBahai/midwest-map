"use client"

import Map, { MapRef } from "react-map-gl/mapbox"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import { MapMouseEvent } from "mapbox-gl"
import { deepEqual } from "fast-equals"
import { useWindowSize } from "@/lib/useWindowSize"
import { initialBounds } from "@/map/initialMapBounds"
import { ClusterLayers } from "@/map/clusterLayers"
import { MapContext, MapProvider } from "@/map/mapContext"
import { MapExperiments } from "@/map/mapExperiments"
import { FloatingTimelineButton } from "@/components/FloatingTimelineButton"

import validatedData from "@/data/clusters-timeline.geo.json"
import type { TimelineEntry } from "@/data/getMilestoneAtDate"
import { Feature } from "geojson"
import { LatLongRect } from "@/lib/latLongRect"
import { useDebug } from "@/app/DebugContext"

export const RegionMap = (
    {mapboxAccessToken}: {mapboxAccessToken: string}
) => {
    const windowSize = useWindowSize()
    const { showGeoJsonDetails, showCollisionBoxes } = useDebug()

    const [ hoverFeature, setHoverFeature ] = useState<Feature | undefined>(undefined)
    const [ currentDate, setCurrentDate ] = useState<Date>(new Date())

    const onHover = useCallback((event: MapMouseEvent) => {
        const {
            features,
            point: { x, y},
        } = event
        const newHoverFeature = (features && features[0])
        // Only compare properties to see if a new cluster is hovered — the feature object itself is different each time.
        // Technically could just compare ID, but deep equality seems more robust.
        // Maybe we should figure out why?
        if (!deepEqual(newHoverFeature?.properties, hoverFeature?.properties))
            setHoverFeature(newHoverFeature)
    }, [hoverFeature])

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

    // Extract all milestone advancement events from all clusters for timeline markers
    const milestoneEvents = useMemo(() => {
        const events: { date: Date; label: string; color?: string }[] = []
        for (const feature of features) {
            const timeline = feature.properties?.timeline as TimelineEntry[] | undefined
            const clusterName = feature.properties?.Cluster as string | undefined
            if (timeline && clusterName) {
                for (const entry of timeline) {
                    events.push({
                        date: new Date(entry.date),
                        label: `${clusterName}: ${entry.milestone}`,
                    })
                }
            }
        }
        return events
    }, [features])

    // It's okay if <Map> is also rendered on the server — the canvas won't be created, just a placeholder div.
    // See https://github.com/visgl/react-map-gl/issues/568
    return (
        <>
            <Head>
                <link href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css" rel="stylesheet"/>
            </Head>
            <Map
                mapboxAccessToken={mapboxAccessToken}
                initialViewState={initialBounds(windowSize)}
                style={{width: '100vw', height: '100vh'}}
                mapStyle="mapbox://styles/mapbox/light-v11"
                // mapStyle="mapbox://styles/mapbox/dark-v11"
                interactiveLayerIds={validatedData.features.map((_, index) => `cluster-${index}`)}
                onMouseMove={onHover}
                onLoad={() => setMapRefState(mapRef.current ?? undefined)}
                ref={mapRef}
            >
                <MapProvider mapRef={mapRefState}>
                    {features.map((feature, index) => (
                        <ClusterLayers
                            key={index}
                            feature={feature}
                            index={index}
                            hoverFeature={hoverFeature}
                            largestRect={pickLargestRect(feature)}
                            currentDate={currentDate}
                        />
                    ))}
                    {hoverFeature && showGeoJsonDetails && (
                        <div style={{position: 'absolute', top: 0, left: 0, padding: '1em', backgroundColor: 'white', color: 'black'}}>
                            <p>{JSON.stringify(hoverFeature.properties, undefined, 1)}</p>
                        </div>
                    )}
                    <MapExperiments/>
                </MapProvider>
            </Map>
            <FloatingTimelineButton
                startDate={new Date('2011-01-01')}
                endDate={new Date('2025-12-31')}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                milestoneEvents={milestoneEvents}
            />
        </>
    )
}

const pickLargestRect = (feature: Feature) => {
    const clusterName = feature.properties?.Cluster
    if (typeof clusterName === "string" && clusterName in validatedData.largestClusterRects) {
        const largestRects = validatedData.largestClusterRects as Record<string, LatLongRect>
        return largestRects[clusterName]
    }
}
