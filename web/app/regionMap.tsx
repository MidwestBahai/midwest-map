"use client"

import Map from "react-map-gl"
import React, { useEffect } from "react"
import { useWindowSize } from "./useWindowSize"
import { initialBounds } from "./initialMapBounds"
import { useQuery } from "@tanstack/react-query"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { load } from "@loaders.gl/core"
import Head from "next/head"

export const RegionMap = ({mapboxAccessToken}: {mapboxAccessToken: string}) => {
    const windowSize = useWindowSize()

    const { isPending, error, data } = useQuery({
        queryKey: ['all-clusters.shp'],
        queryFn: () => load('/shapefiles/all-clusters.shp', ShapefileLoader)
    })

    useEffect(() => {
        if (data)
            console.log(data)
        if (isPending || error)
            console.log({isPending, error})
    }, [isPending, error, data])

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
            />
        </>
    )
}
