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

const truncate = ( str: any, maxLength: number, ellipsis: boolean = false ) => {
    const s = `${str}`
    return s.length <= maxLength ? s :
        (ellipsis ?
            s.slice(0, maxLength - 1) + "…" :
            s.slice(0, maxLength)
        )
}

export const ClusterText = (
    {feature, largestRect, symbolLayerId, highlighted}: ClusterTextProps
) => {
    const { debug } = useDebug()
    const {degreesToRem} = useMap()
    const [text, setText] = useState<string>("")
    useEffect(() => {
        const remRect = degreesToRem(largestRect)
        const remDescription = `${truncate(remRect.width, 4)} x ${truncate(remRect.height, 4)}`
        // allow line height of about 1.2 REM
        let linesRemaining = remRect.height * 0.8
        // guesstimate how many characters will fit
        const widthToDisplay = remRect.width * 1.7

        // first line: Cluster code, for example "OH-03"
        const lines: Array<string> = ["{Cluster}"]
        const addLine = (line: string, truncate: boolean = true) => {
            if (linesRemaining >= 1) {

                linesRemaining -= 1
                return line
            }
            return ""
        }

        --linesRemaining

        // second line: Cluster name, for example "Franklin County"
        if (linesRemaining >= 1) {
            lines.push(truncate(feature.properties?.["Cluster Na"], widthToDisplay, true))
            linesRemaining -= 1
        }

        if (debug && linesRemaining >= 1) {
            lines.push(remDescription)
            linesRemaining -= 1
        }

        setText(lines.filter(Boolean).join("\n"))
        // const displays = ["{Cluster}", "{M}", debug ? remDescription : ""].filter(Boolean)
    }, [largestRect, degreesToRem])
    return feature.properties && (
        <Source
            type="geojson"
            data={feature}
        >
            <Layer
                type="symbol"
                layout={{
                    "text-field": text,
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