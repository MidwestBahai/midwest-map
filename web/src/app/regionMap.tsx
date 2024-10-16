"use client"

import Map, { MapRef } from "react-map-gl"
import React, { useCallback, useEffect } from "react"
import { useWindowSize } from "@/app/useWindowSize"
import { initialBounds } from "@/app/initialMapBounds"
import Head from "next/head"
import { MapMouseEvent } from "mapbox-gl"
import { GeoJSONFeature } from "zod-geojson"
import { deepEqual } from "fast-equals"
import { ClusterLayers } from "@/app/clusterLayers"
import { MapContext } from "@/app/mapContext"

import validatedData from "@/data/clusters.geo.json"
import { FloatingMapKey } from "./floatingMapKey"

export const RegionMap = (
    {mapboxAccessToken, debug}: {mapboxAccessToken: string, debug: boolean}
) => {
    const windowSize = useWindowSize()

    const [ hoverFeature, setHoverFeature ] = React.useState<GeoJSONFeature | undefined>(undefined)

    const onHover = useCallback((event: MapMouseEvent) => {
        const {
            features,
            point: { x, y},
        } = event
        const newHoverFeature = (features && features[0]) as GeoJSONFeature | undefined
        // Only compare properties to see if a new cluster is hovered — the feature object itself is different each time.
        // Technically could just compare ID, but deep equality seems more robust.
        // Maybe we should figure out why?
        if (!deepEqual(newHoverFeature?.properties, hoverFeature?.properties))
            setHoverFeature(newHoverFeature)
    }, [hoverFeature])

    const mapRef = React.useRef<MapRef>(null)

    useEffect(() => {
        const map = mapRef.current?.getMap()
        if (debug && map && !map.showCollisionBoxes)
            map.showCollisionBoxes = true
    })

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
                    {validatedData.features.map((feature, index) => (
                        <ClusterLayers key={index} data={feature as GeoJSONFeature} index={index} hoverFeature={hoverFeature}/>
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
