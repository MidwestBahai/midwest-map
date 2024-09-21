"use client"

import Map from "react-map-gl"
import React, { useCallback, useEffect } from "react"
import { useWindowSize } from "./useWindowSize"
import { initialBounds } from "./initialMapBounds"
import Head from "next/head"
import { MapMouseEvent } from "mapbox-gl"
import { useShapefile } from "./useAllClustersShapefile"
import { GeoJSONFeature } from "zod-geojson"
import { deepEqual } from "fast-equals"
import { ClusterLayers } from "./clusterLayers"

export const RegionMap = ({mapboxAccessToken}: {mapboxAccessToken: string}) => {
    const windowSize = useWindowSize()

    const { isPending, error, data } = useShapefile(
        // "IN_clusters.shp"
        "all-clusters.shp"
    )

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

    useEffect(() => {
        if (error)
            console.error({isPending, error})
    }, [isPending, error])

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
                mapStyle="mapbox://styles/mapbox/streets-v11"
                interactiveLayerIds={data?.features?.map((_, index) => `cluster-${index}`)}
                onMouseMove={onHover}
            >
                {data?.features?.map((feature, index) => (
                    <ClusterLayers key={index} data={feature} index={index} hoverFeature={hoverFeature}/>
                ))}
                {hoverFeature && (
                    <div style={{position: 'absolute', top: 0, left: 0, padding: '1em', backgroundColor: 'white', color: 'black'}}>
                        <p>{JSON.stringify(hoverFeature.properties, undefined, 1)}</p>
                    </div>
                )}
            </Map>
        </>
    )
}
