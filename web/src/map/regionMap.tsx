"use client"

import Map, { MapRef } from "react-map-gl/mapbox"
import { useCallback, useEffect, useRef, useState } from "react"
import Head from "next/head"
import { MapMouseEvent } from "mapbox-gl"
import { deepEqual } from "fast-equals"
import { useWindowSize } from "@/lib/useWindowSize"
import { initialBounds } from "@/map/initialMapBounds"
import { ClusterLayers } from "@/map/clusterLayers"
import { MapContext } from "@/map/mapContext"

import validatedData from "@/data/clusters.geo.json"
import { Feature } from "geojson"
import { LatLongRect } from "@/lib/latLongRect"

export const RegionMap = (
    {mapboxAccessToken, debug}: {mapboxAccessToken: string, debug: boolean}
) => {
    const windowSize = useWindowSize()

    const [ hoverFeature, setHoverFeature ] = useState<Feature | undefined>(undefined)

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

    useEffect(() => {
        const map = mapRef.current?.getMap()
        if (debug && map && !map.showCollisionBoxes)
            map.showCollisionBoxes = true
    })

    // Zod validates, but the TypeScript types are not strictly compatible, so we have to cast.
    const features = validatedData.features as Feature[]

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
                ref={mapRef}
            >
                <MapContext.Provider value={mapRef.current ?? undefined}>
                    {features.map((feature, index) => (
                        <ClusterLayers
                            key={index}
                            data={feature}
                            index={index}
                            hoverFeature={hoverFeature}
                            largestRect={pickLargestRect(feature)}
                            debug={debug}
                        />
                    ))}
                    {hoverFeature && debug && (
                        <div style={{position: 'absolute', top: 0, left: 0, padding: '1em', backgroundColor: 'white', color: 'black'}}>
                            <p>{JSON.stringify(hoverFeature.properties, undefined, 1)}</p>
                        </div>
                    )}
                </MapContext.Provider>
            </Map>
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