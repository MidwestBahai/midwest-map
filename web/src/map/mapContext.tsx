import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react"
import { MapRef } from "react-map-gl/mapbox"
import { LatLongRect } from "@/lib/latLongRect"

interface MapContextValue {
    map: MapRef | undefined
    degreesToRem: (latLongRect: LatLongRect) => RemRect
    initialized: boolean
}

export interface RemRect {
    width: number,
    height: number,
}

const PIXELS_PER_REM = 16
const METERS_PER_DEGREE = 111215 // at the equator -- avg of latitude 111,111, longitude 111,320

// https://docs.mapbox.com/help/glossary/zoom-level/#zoom-levels-and-geographical-distance
const remPerDegreeAtEquator = (zoom: number): number => {
    const metersPerPixel = Math.pow(2, zoom) * 156543 * 0.5
    const degreesPerPixel = METERS_PER_DEGREE / metersPerPixel
    return PIXELS_PER_REM * degreesPerPixel
}

const makeDegreesToRem = (zoom: number) => {
    const remPerDegree = remPerDegreeAtEquator(zoom)
    return (latLongRect: LatLongRect): RemRect => {
        // Mercator projection, so latitude gets stretched, and longitude can be considered rectangular
        const midLat = (latLongRect.minLat + latLongRect.maxLat) * .5
        const latCorrection = 1 / Math.cos(midLat * Math.PI / 180)
        // size the rectangle is rendered in terms of degrees at the equator
        const degreesHeight = latCorrection * (latLongRect.maxLat - latLongRect.minLat)
        const degreesWidth = latLongRect.maxLong - latLongRect.minLong
        return {
            width: degreesWidth * remPerDegree,
            height: degreesHeight * remPerDegree,
        }
    }
}

const INITIAL_MAP_CONTEXT: MapContextValue = {
    map: undefined,
    degreesToRem: makeDegreesToRem(0),
    initialized: true,
}

const UNINITIALIZED: MapContextValue = {
    map: undefined,
    degreesToRem: () => {
        throw new Error("MapContext not initialized; wrap with <MapProvider>")
    },
    initialized: false,
}

export const MapContext = createContext<MapContextValue>(UNINITIALIZED)

export const MapProvider = ({
    mapRef, children
}: PropsWithChildren<{
    mapRef: MapRef | undefined,
}>) => {
    const map = mapRef?.getMap()
    const [context, setContext] = useState<MapContextValue>(INITIAL_MAP_CONTEXT)
    useEffect(() => {
        // listen to zoom changes
        if (map) {
            if (!context.map) {
                setContext((prev) => ({
                    ...prev,
                    map: mapRef,
                }))
            }
            const zoomListener = () => {
                // console.log("zoom changed", map.getZoom())
                setContext((prev) => ({
                    ...prev,
                    degreesToRem: makeDegreesToRem(map.getZoom()),
                }))
            }
            map.on("zoom", zoomListener)
            return () => map.off("zoom", zoomListener)
        }
        else return () => {}
    }, [map])
    const remPerMeter = 1 / (156543 * Math.pow(2, mapRef?.getMap().getZoom() ?? 0))
    return (
        <MapContext.Provider value={context}>
            {children}
        </MapContext.Provider>
    )
}

export const useMap = () => {
    const result = useContext(MapContext)
    // if (result && !result.initialized) {
    //     throw new Error("MapContext not initialized; wrap with <MapProvider>")
    // }
    return result
}
