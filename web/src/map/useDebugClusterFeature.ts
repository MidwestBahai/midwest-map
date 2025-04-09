import { GeoJSONFeature } from "zod-geojson"
import { useMap } from "@/map/mapContext"
import { useEffect } from "react"

export const useDebugClusterFeature = (index: number, clusterName: string, feature: GeoJSONFeature) => {
    const map = useMap()
    useEffect(() => {
        if (map && feature.properties?.Cluster === clusterName) {
            const fillLayer = map.getLayer(`cluster-${index}`)
            const symbolLayer = map.getLayer(`symbol-${index}`)
            console.log({fillLayer, symbolLayer, properties: feature.properties, map})
        }
    }, [map, index])
}