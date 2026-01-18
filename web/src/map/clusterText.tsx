import type { Feature } from "geojson"
import { useEffect, useState } from "react"
import { Layer, Source } from "react-map-gl/mapbox"
import { useDebug } from "@/app/DebugContext"
import { type Milestone, milestoneLabels } from "@/data/milestoneLabels"
import type { LatLongRect } from "@/lib/latLongRect"
import { clusterLabelColor } from "@/map/clusterColor"
import { useMap } from "@/map/mapContext"

interface ClusterTextProps {
    feature: Feature
    largestRect: LatLongRect
    symbolLayerId: string
    highlighted: boolean
    effectiveMilestone: string
    advancementDate: Date | null
    printMode?: boolean
}

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]

/**
 * Format advancement date responsively based on available width.
 * Returns null if no date or not enough space.
 */
const formatAdvancementDate = (
    date: Date | null,
    widthAvailable: number,
): string | null => {
    if (!date) return null

    const month = MONTHS[date.getMonth()]
    const year = date.getFullYear()

    // Responsive formats:
    // Wide (14+ chars): "Since Jan 2017"
    // Medium (8+ chars): "Jan 2017"
    // Narrow (4+ chars): "2017"
    // Tiny: null (omit)
    if (widthAvailable >= 14) {
        return `Since ${month} ${year}`
    } else if (widthAvailable >= 8) {
        return `${month} ${year}`
    } else if (widthAvailable >= 4) {
        return `${year}`
    }
    return null
}

const truncate = (
    str: unknown,
    maxLength: number,
    ellipsis: boolean = false,
) => {
    const s = `${str}`
    return s.length <= maxLength
        ? s
        : ellipsis
          ? `${s.slice(0, maxLength - 1)}…`
          : s.slice(0, maxLength)
}

const cleanupClusterName = (original: string) => {
    let result = original
    if (result.endsWith(" Co")) result += "unty"
    if (result.indexOf(" Co ") > 0) result = result.replace(" Co ", " County ")
    return result
}

const milestoneDescription = (milestoneString: string) => {
    const milestoneLabelKey = milestoneString?.toLowerCase()
    if (milestoneLabelKey in milestoneLabels) {
        const milestone = milestoneLabelKey as Milestone
        return milestoneLabels[milestone]
    } else {
        return `Unknown milestone ${milestoneString}`
    }
}

export const ClusterText = ({
    feature,
    largestRect,
    symbolLayerId,
    highlighted,
    effectiveMilestone,
    advancementDate,
    printMode = false,
}: ClusterTextProps) => {
    const { showMapGeometry } = useDebug()
    const { degreesToRem } = useMap()
    const [text, setText] = useState<string>("")
    useEffect(() => {
        // Print mode: show cluster code and milestone (e.g., "IN-01\nM3")
        if (printMode) {
            const clusterCode = feature.properties?.Cluster ?? ""
            // Format milestone for display: "m3" -> "M3", "n" -> "N", "e" -> "E"
            const milestoneDisplay = effectiveMilestone
                .toUpperCase()
                .replace(/R$/, "") // Strip reservoir suffix
            setText(`${clusterCode}\n${milestoneDisplay}`)
            return
        }

        const remRect = degreesToRem(largestRect)
        const remDescription = `${truncate(remRect.width, 4)} x ${truncate(remRect.height, 4)}`
        // allow line height of about 1.2 REM
        let linesRemaining = remRect.height * 0.8
        // guesstimate how many characters will fit
        const widthToDisplay = remRect.width * 1.25

        // first line: Cluster code, for example "OH-03"
        // Top separator candidates so far: slash "/", interpunct "·", en-dash "–"
        const milestoneCode = effectiveMilestone.toUpperCase()
        const lines: Array<string> =
            remRect.width > 5
                ? [`{Cluster} · ${milestoneCode}`]
                : ["{Cluster}", milestoneCode]
        --linesRemaining

        // if there's room, we can leave space for 2 lines
        const addLongLine = (line: string) => {
            if (linesRemaining > 2 && line.length > widthToDisplay) {
                linesRemaining -= 2
                lines.push(truncate(line, widthToDisplay * 1.8, true))
            } else if (linesRemaining > 1) {
                lines.push(truncate(line, widthToDisplay, true))
                --linesRemaining
            }
        }

        // second line: Cluster name, for example "Franklin County"
        const clusterName = cleanupClusterName(
            feature.properties?.["Cluster Na"],
        )
        if (clusterName) addLongLine(clusterName)

        // third line: milestone, for example "M3" or "3rd Milestone"
        const milestone = milestoneDescription(effectiveMilestone)
        if (milestone && remRect.width > 8) addLongLine(milestone)

        // fourth line: advancement date (if applicable)
        const dateStr = formatAdvancementDate(advancementDate, widthToDisplay)
        if (dateStr && linesRemaining >= 1) {
            lines.push(dateStr)
            --linesRemaining
        }

        if (showMapGeometry && linesRemaining >= 1) {
            lines.push(remDescription)
            --linesRemaining
        }

        setText(lines.filter(Boolean).join("\n"))
    }, [
        largestRect,
        degreesToRem,
        feature.properties,
        showMapGeometry,
        effectiveMilestone,
        advancementDate,
        printMode,
    ])
    return (
        feature.properties && (
            <Source type="geojson" data={feature}>
                <Layer
                    type="symbol"
                    layout={{
                        "text-field": text,
                        "text-size": 13,
                        "text-anchor": "center",
                        // "text-font": ["Roboto Black", "Arial Unicode MS Bold"],
                    }}
                    paint={{
                        "text-color": clusterLabelColor(
                            feature.properties,
                            highlighted,
                            effectiveMilestone,
                        ),
                    }}
                    id={symbolLayerId}
                />
            </Source>
        )
    )
}
