"use client"

import Map, { Layer, Source } from "react-map-gl"
import React, { useCallback, useEffect } from "react"
import { useWindowSize } from "./useWindowSize"
import { initialBounds } from "./initialMapBounds"
import Head from "next/head"
import { MapMouseEvent } from "mapbox-gl"
import { useAllClustersShapefile } from "./useAllClustersShapefile"
import { GeoJSONFeature } from "zod-geojson"
import { deepEqual } from "fast-equals"

const milestoneColorInner = (milestone: string, baseHue: number) => {
    switch (milestone.toLowerCase()) {
        case "m3": return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l + 0.2) a b / 0.3)`
        case "m2": return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l + 0.1) a b / 0.3)`
        case "m1": return `oklab(from hsl(${baseHue}, 100%, 50%) l a b / 0.3)`
        case "m0": return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l - 0.1) a b / 0.3)`
        case "e": return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l - 0.2) a b / 0.3)`
        case "n": return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l - 0.2) a b / 0.3)`
        default: return "#f00"
    }
}

const colorCache: Record<string, string[]> = {}

const milestoneColor = (milestone: string, baseHue: number = 45) => {
    if (colorCache[milestone]?.[baseHue]) return colorCache[milestone][baseHue]
    const lch = milestoneColorInner(milestone, baseHue)
    // Use a canvas to convert the color to RGBA
    // From https://stackoverflow.com/questions/63929820/converting-css-lch-to-rgb
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d", {willReadFrequently: true})
    if (!ctx) return "#ff0"
    ctx.fillStyle = lch
    ctx.fillRect(0, 0, 1, 1)
    const rgbaValues = ctx.getImageData(0, 0, 1, 1).data
    const rgbaString = `rgba(${rgbaValues[0]}, ${rgbaValues[1]}, ${rgbaValues[2]}, ${rgbaValues[3] / 255})`
    if (!colorCache[milestone]) colorCache[milestone] = []
    colorCache[milestone][baseHue] = rgbaString
    return rgbaString
}

const clusterColor = (properties: GeoJSONFeature["properties"]) => {
    const milestone = `${properties?.["M"] ?? "Unknown"}`
    const baseHue = clusterBaseHue(properties)
    return milestoneColor(milestone, baseHue)
}

const clusterBaseHue = (properties: GeoJSONFeature["properties"]) => {
    const group = properties?.["Group"] ?? "Unknown"
    switch (group) {
        case "AA": return 45
        case "GR": return 105
        case "INDY": return 165
        case "CLV": return 225
        case "CBUS": return 285
        default: return 0
    }
}

export const RegionMap = ({mapboxAccessToken}: {mapboxAccessToken: string}) => {
    const windowSize = useWindowSize()

    const { isPending, error, data } = useAllClustersShapefile()

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
                    <Source type="geojson" data={feature} key={index}>
                        <Layer
                            type="fill"
                            paint={{
                                "fill-color": clusterColor(feature.properties),
                                // "fill-color": (feature === hoverFeature) ? "#fff" : randomColor(),
                                // "line-color": (feature === hoverFeature) ? "black" : undefined,
                                // "line-width": (feature === hoverFeature) ? 3: 0,
                            }}
                            id={`cluster-${index}`}
                        >
                        </Layer>
                        <Layer type="symbol" layout={{
                            "text-field": "{Cluster}\n{M}",
                            "text-size": 13,
                            "text-anchor": "center",
                        }} />
                    </Source>
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
