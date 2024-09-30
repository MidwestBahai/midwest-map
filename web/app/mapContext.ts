import React, { useContext } from "react"
import { MapRef } from "react-map-gl"

export const MapContext = React.createContext<MapRef | undefined>(undefined)
export const useMap = () => useContext(MapContext)