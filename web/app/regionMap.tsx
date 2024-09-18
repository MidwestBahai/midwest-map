"use client"

import Map, { Layer, Source } from "react-map-gl"
import React, { useEffect } from "react"
import { useWindowSize } from "./useWindowSize"
import { initialBounds } from "./initialMapBounds"
import Head from "next/head"
import { FillLayerSpecification } from "mapbox-gl"
import { useAllClustersShapefile } from "./useAllClustersShapefile"

const clusterLayerStyle: Partial<FillLayerSpecification> = { // LayerProps = {
    type: "fill",
    paint: {
        "fill-color": "rgba(200, 200, 255, .3)",
    }
}

const randomColor = () => {
    const r = Math.random()*255
    const g = Math.random()*(255 - r)
    const b = Math.random()*(255 - r - g)
    return `rgba(${r}, ${g}, ${b}, .3)`
}

export const RegionMap = ({mapboxAccessToken}: {mapboxAccessToken: string}) => {
    const windowSize = useWindowSize()

    const { isPending, error, data } = useAllClustersShapefile()

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
            >
                {data?.features?.map((feature, index) => (
                    <Source type="geojson" data={feature} key={index}>
                        <Layer
                            type="fill"
                            paint={{ "fill-color": randomColor() }}
                            id={`cluster-${index}`}
                        />
                    </Source>
                ))}
            </Map>
        </>
    )
}
