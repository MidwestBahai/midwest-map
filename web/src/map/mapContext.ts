import { useContext, createContext } from "react"
import { MapRef } from "react-map-gl/mapbox"

export const MapContext = createContext<MapRef | undefined>(undefined)
export const useMap = () => useContext(MapContext)