import { Feature, GeoJsonProperties } from "geojson"
import { Layer, Source } from "react-map-gl/mapbox"
import { clusterLabelColor } from "@/map/clusterColor"
import { LatLongRect } from "@/lib/latLongRect"
import { useMap } from "@/map/mapContext"
import { useEffect, useState } from "react"
import { useDebug } from "@/app/DebugContext"
import { Milestone, milestoneLabels } from "@/data/milestoneLabels"

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

const milestoneDescriptions = {
    "1": "1st Milestone",
    "2": "2nd Milestone",
    "3": "3rd Milestone",
}

const cleanupClusterName = (original: string) => {
    let result = original
    if (result.endsWith(" Co"))
        result += "unty"
    if (result.indexOf(" Co ") > 0)
        result = result.replace(" Co ", " County ")
    return result
}

const milestoneDescription = (properties: GeoJsonProperties, remAvailable: number) => {
    const milestoneString = properties?.["M"]
    const milestoneLabelKey = milestoneString?.toLowerCase()
    if (milestoneLabelKey in milestoneLabels) {
        const milestone = milestoneLabelKey as Milestone
        return milestoneLabels[milestone]
    }
    else {
        return `Unknown milestone ${milestoneString}`
    }
}

export const ClusterText = (
    {feature, largestRect, symbolLayerId, highlighted}: ClusterTextProps
) => {
    const { showMapGeometry } = useDebug()
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
        // Top separator candidates so far: slash "/", interpunct "·", en-dash "–"
        const lines: Array<string> = remRect.width > 5 ? ["{Cluster} · {M}"] : ["{Cluster}", "{M}"]
        --linesRemaining

        // if there's room, we can leave space for 2 lines
        const addLongLine = (line: string) => {
            if (linesRemaining > 2 && line.length > widthToDisplay) {
                linesRemaining -= 2
                lines.push(truncate(line, widthToDisplay * 1.8, true))
            }
            else if (linesRemaining > 1) {
                lines.push(truncate(line, widthToDisplay, true))
                --linesRemaining
            }
        }

        // second line: Cluster name, for example "Franklin County"
        const clusterName = cleanupClusterName(feature.properties?.["Cluster Na"])
        if (clusterName)
            addLongLine(clusterName)

        // third line: milestone, for example "M3" or "3rd Milestone"
        const milestone = milestoneDescription(feature.properties, remRect.width)
        if (milestone && remRect.width > 8)
            addLongLine(milestone)

        if (showMapGeometry && linesRemaining >= 1) {
            lines.push(remDescription)
            --linesRemaining
        }

        setText(lines.filter(Boolean).join("\n"))
    }, [largestRect, degreesToRem, feature.properties, showMapGeometry])
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