"use client"

import Map from "react-map-gl"
import React from "react"
import { useWindowSize } from "./useWindowSize"
import { initialBounds } from "./initialMapBounds"

export const RegionMap = ({mapboxAccessToken}: {mapboxAccessToken: string}) => {
    const windowSize = useWindowSize()
    // It's okay if this is also rendered on the server — the canvas won't be created, just a placeholder div.
    // See https://github.com/visgl/react-map-gl/issues/568
    return (
        <Map
            mapboxAccessToken={mapboxAccessToken}
            initialViewState={initialBounds(windowSize)}
            style={{width: '100vw', height: '100vh'}}
            mapStyle="mapbox://styles/mapbox/streets-v11"
        />
    )
}