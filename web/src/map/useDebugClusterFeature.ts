import type { Feature } from "geojson"
import { useEffect } from "react"
import { useMap } from "@/map/mapContext"

export const useDebugClusterFeature = (
    index: number,
    clusterName: string,
    feature: Feature,
) => {
    const { map } = useMap()
    useEffect(() => {
        if (map && feature.properties?.Cluster === clusterName) {
            const fillLayer = map.getLayer(`cluster-${index}`)
            const symbolLayer = map.getLayer(`symbol-${index}`)
            console.log({
                fillLayer,
                symbolLayer,
                properties: feature.properties,
                map,
            })
        }
    }, [
        map,
        index,
        clusterName,
        feature.properties?.Cluster,
        feature.properties,
    ])
}
