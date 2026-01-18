import type { MapEventType } from "mapbox-gl"
import {
    createContext,
    type PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react"
import type { MapRef } from "react-map-gl/mapbox"
import type { LatLongRect } from "@/lib/latLongRect"

interface MapContextValue {
    map: MapRef | undefined
    degreesToRem: (latLongRect: LatLongRect) => RemRect
    initialized: boolean
}

export interface RemRect {
    width: number
    height: number
}

const PIXELS_PER_REM = 16
const METERS_PER_DEGREE = 111215 // at the equator -- avg of latitude 111,111, longitude 111,320

/**
 * Meters per pixel at zoom level 0, at the equator.
 * The 0.5 is to correct for tile size, from 256 pixels square (OSM) to 512 (MapBox).
 * https://wiki.openstreetmap.org/wiki/Zoom_levels
 * https://docs.mapbox.com/help/glossary/zoom-level/#zoom-levels-and-geographical-distance
 */
const METERS_PER_PIXEL = 156543 * 0.5

const remPerDegreeAtEquator = (zoom: number): number => {
    const metersPerPixel = METERS_PER_PIXEL / 2 ** zoom
    const pixelsPerDegree = METERS_PER_DEGREE / metersPerPixel
    return pixelsPerDegree / PIXELS_PER_REM
}

const makeDegreesToRem = (zoom: number) => {
    const remPerDegree = remPerDegreeAtEquator(zoom)
    return (latLongRect: LatLongRect): RemRect => {
        // Mercator projection, so latitude gets stretched, and longitude can be considered rectangular
        const midLat = (latLongRect.minLat + latLongRect.maxLat) * 0.5
        const latCorrection = 1 / Math.cos((midLat * Math.PI) / 180)
        // size the rectangle is rendered in terms of degrees at the equator
        const degreesHeight =
            latCorrection * (latLongRect.maxLat - latLongRect.minLat)
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

const EVENTS_TO_LISTEN: Array<MapEventType> = [
    "zoom",
    // "moveend",
]

export const MapProvider = ({
    mapRef,
    children,
}: PropsWithChildren<{
    mapRef: MapRef | undefined
}>) => {
    const map = mapRef?.getMap()
    // console.log({map})
    const [context, setContext] = useState<MapContextValue>(INITIAL_MAP_CONTEXT)
    useEffect(() => {
        // listen to zoom changes
        if (map) {
            if (!context.map || context.map !== mapRef) {
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
            // console.log("adding listeners")
            for (const event of EVENTS_TO_LISTEN) map.on(event, zoomListener)
            // call once to initialize
            zoomListener()
            return () => {
                for (const event of EVENTS_TO_LISTEN)
                    map.off(event, zoomListener)
            }
        } else {
            console.debug("map is undefined, waiting for onLoad")
            return () => {}
        }
    }, [map, mapRef, context.map])
    return <MapContext.Provider value={context}>{children}</MapContext.Provider>
}

export const useMap = () => {
    const result = useContext(MapContext)
    // if (result && !result.initialized) {
    //     throw new Error("MapContext not initialized; wrap with <MapProvider>")
    // }
    return result
}
