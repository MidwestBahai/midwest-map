import { useContext, createContext, useEffect, useState, PropsWithChildren } from "react"
import { MapRef } from "react-map-gl/mapbox"

interface MapContextValue {
    mapRef: MapRef | undefined
    // REM units per meter on the map, at the equator
    remPerMeter: number
    initialized: boolean
}

const INITIAL_MAP_CONTEXT: MapContextValue = {
    mapRef: undefined,
    remPerMeter: 0,
    initialized: true,
}

const UNINITIALIZED: MapContextValue = {
    mapRef: undefined,
    remPerMeter: 0,
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
            const zoomListener = () => {
                setContext((prev) => ({
                    ...prev,
                    remPerMeter: 1 / (156543 * Math.pow(2, map.getZoom())),
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
    if (result && !result.initialized) {
        throw new Error("MapContext not initialized; wrap with <MapProvider>")
    }
    return result
}