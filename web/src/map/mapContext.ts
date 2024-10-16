import { useContext, createContext } from "react"
import { MapRef } from "react-map-gl"

export const MapContext = createContext<MapRef | undefined>(undefined)
export const useMap = () => useContext(MapContext)