import { Feature } from "geojson"
import { Layer, Source } from "react-map-gl/mapbox"
import { clusterLabelColor } from "@/map/clusterColor"
import { LatLongRect } from "@/lib/latLongRect"
import { useMap } from "@/map/mapContext"
import { useEffect, useState } from "react"
import { useDebug } from "@/app/DebugContext"

interface ClusterTextProps {
    feature: Feature,
    largestRect: LatLongRect,
    symbolLayerId: string,
    highlighted: boolean,
}

const truncate = ( str: any, maxLength: number ) => {
    const s = `${str}`
    return s.length > maxLength ? s.slice(0, maxLength) : str
}

export const ClusterText = (
    {feature, largestRect, symbolLayerId, highlighted}: ClusterTextProps
) => {
    const { debug } = useDebug()
    const {degreesToRem} = useMap()
    const [remDescription, setRemDescription] = useState<string>("")
    useEffect(() => {
        const remRect = degreesToRem(largestRect)
        setRemDescription(`${truncate(remRect.width, 6)} x ${truncate(remRect.height, 6)}`)
    }, [largestRect, degreesToRem])
    const displays = ["{Cluster}", "{M}", debug ? remDescription : ""].filter(Boolean)
    return feature.properties && (
        <Source
            type="geojson"
            data={feature}
        >
            <Layer
                type="symbol"
                layout={{
                    "text-field": displays.join("\n"),
                    "text-size": 13,
                    "text-anchor": "center",
                    // "text-font": ["Roboto Black", "Arial Unicode MS Bold"],
                }}
                paint={{
                    "text-color": clusterLabelColor(feature.properties, highlighted),
                }}
                id={symbolLayerId}
            />
        </Source>
    )
}