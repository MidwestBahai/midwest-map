import { readFile, writeFile } from "node:fs/promises"
import { parse } from "csv-parse/sync"
import type { Feature } from "geojson"
import type { ShapeFilePlusLargestRects } from "./ImportShapefiles"

/**
 * Merge advancement timeline data from TSV file into the static cluster GeoJSON.
 * This is stage 2 of the data pipeline:
 *   1. ImportShapefiles.ts: shapefile → clusters-static.geo.json
 *   2. MergeAdvancementData.ts: clusters-static.geo.json + advancement-dates.tsv → clusters-timeline.geo.json
 *
 * To run:
 *   1. pnpm compile-importer
 *   2. pnpm merge-timeline
 */

const STATIC_CLUSTERS_FILE = "./src/data/clusters-static.geo.json"
const ADVANCEMENT_DATES_FILE = "./data-sources/advancement-dates.tsv"
const OUTPUT_FILE = "./src/data/clusters-timeline.geo.json"

interface AdvancementRecord {
    "Date Advanced": string | null
    Milestone: string
    Cluster: string
    Name: string
    Population: number
}

interface TimelineEntry {
    milestone: string
    date: string
}

interface ClusterTimelineData {
    population?: number
    currentMilestone: string
    timeline: TimelineEntry[]
    firstAdvancement?: string
    latestAdvancement?: string
}

interface EnhancedShapefile extends ShapeFilePlusLargestRects {
    timelineBounds: {
        minDate: string | null
        maxDate: string | null
    }
}

async function loadAdvancementData(): Promise<
    Map<string, ClusterTimelineData>
> {
    console.log("Loading advancement dates from TSV...")
    const fileContent = await readFile(ADVANCEMENT_DATES_FILE, "utf-8")

    const records = parse(fileContent, {
        columns: true,
        delimiter: "\t",
        skip_empty_lines: true,
        cast: (value, context) => {
            if (context.column === "Population") {
                return parseInt(value.replace(/,/g, ""), 10)
            }
            if (context.column === "Date Advanced" && value === "") {
                return null
            }
            return value
        },
    }) as AdvancementRecord[]

    // Group by cluster
    const clusterMap = new Map<string, ClusterTimelineData>()

    for (const record of records) {
        const clusterId = record.Cluster

        let cluster = clusterMap.get(clusterId)
        if (!cluster) {
            cluster = {
                population: record.Population,
                currentMilestone: "N",
                timeline: [],
            }
            clusterMap.set(clusterId, cluster)
        }

        // Only add to timeline if there's a date
        const dateAdvanced = record["Date Advanced"]
        if (dateAdvanced) {
            cluster.timeline.push({
                milestone: record.Milestone,
                date: dateAdvanced,
            })

            // Update first and latest dates
            if (
                !cluster.firstAdvancement ||
                dateAdvanced < cluster.firstAdvancement
            ) {
                cluster.firstAdvancement = dateAdvanced
            }
            if (
                !cluster.latestAdvancement ||
                dateAdvanced > cluster.latestAdvancement
            ) {
                cluster.latestAdvancement = dateAdvanced
            }
        }

        // Update current milestone (highest milestone achieved)
        const milestoneOrder: Record<string, number> = {
            N: 0,
            M1: 1,
            M2: 2,
            M3: 3,
        }
        const currentOrder = milestoneOrder[cluster.currentMilestone] || 0
        const newOrder = milestoneOrder[record.Milestone] || 0

        if (newOrder > currentOrder) {
            cluster.currentMilestone = record.Milestone
        }
    }

    // Sort timelines by date
    for (const cluster of clusterMap.values()) {
        cluster.timeline.sort((a, b) => a.date.localeCompare(b.date))
    }

    return clusterMap
}

async function mergeTimelineData() {
    console.log("Starting timeline data merge...")

    // Load static cluster data
    console.log("Loading static cluster data...")
    const staticDataText = await readFile(STATIC_CLUSTERS_FILE, "utf-8")
    const staticData = JSON.parse(staticDataText) as ShapeFilePlusLargestRects

    // Load advancement data
    const advancementData = await loadAdvancementData()
    console.log(`Loaded advancement data for ${advancementData.size} clusters`)

    // Track statistics
    const stats = {
        clustersWithTimeline: 0,
        clustersWithoutTimeline: [] as string[],
        unmatchedTimelineData: [] as string[],
    }

    // Check for unmatched timeline data (clusters in TSV but not in shapefile)
    const shapefileClusters = new Set(
        (staticData.features || [])
            .map((f) => f.properties?.Cluster)
            .filter((c) => c),
    )

    for (const clusterId of advancementData.keys()) {
        if (!shapefileClusters.has(clusterId)) {
            stats.unmatchedTimelineData.push(clusterId)
        }
    }

    // Merge timeline data into features
    const enhancedFeatures = (staticData.features || []).map(
        (feature: Feature) => {
            const clusterId = feature.properties?.Cluster

            if (!clusterId) {
                console.warn("Feature without Cluster ID:", feature.properties)
                return feature
            }

            const timelineData = advancementData.get(clusterId)

            if (timelineData) {
                stats.clustersWithTimeline++
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        population: timelineData.population,
                        currentMilestone: timelineData.currentMilestone,
                        timeline: timelineData.timeline,
                        firstAdvancement: timelineData.firstAdvancement || null,
                        latestAdvancement:
                            timelineData.latestAdvancement || null,
                    },
                }
            } else {
                stats.clustersWithoutTimeline.push(clusterId)
                // Keep existing milestone from shapefile, add empty timeline
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        currentMilestone: feature.properties?.M || "N",
                        timeline: [],
                        firstAdvancement: null,
                        latestAdvancement: null,
                    },
                }
            }
        },
    )

    // Calculate global timeline bounds
    let minDate: string | null = null
    let maxDate: string | null = null

    for (const data of advancementData.values()) {
        if (
            data.firstAdvancement &&
            (!minDate || data.firstAdvancement < minDate)
        ) {
            minDate = data.firstAdvancement
        }
        if (
            data.latestAdvancement &&
            (!maxDate || data.latestAdvancement > maxDate)
        ) {
            maxDate = data.latestAdvancement
        }
    }

    // Create enhanced shapefile with timeline data
    const enhancedShapefile: EnhancedShapefile = {
        ...staticData,
        features: enhancedFeatures,
        timelineBounds: {
            minDate,
            maxDate,
        },
    }

    // Write output
    await writeFile(OUTPUT_FILE, JSON.stringify(enhancedShapefile, null, 1))

    // Report statistics
    console.log(`\n✅ Merged timeline data into ${OUTPUT_FILE}`)
    console.log(`\nStatistics:`)
    console.log(
        `  - Clusters with timeline data: ${stats.clustersWithTimeline}`,
    )
    console.log(
        `  - Clusters without timeline data: ${stats.clustersWithoutTimeline.length}`,
    )
    if (stats.clustersWithoutTimeline.length > 0) {
        console.log(`    ${stats.clustersWithoutTimeline.join(", ")}`)
    }

    if (stats.unmatchedTimelineData.length > 0) {
        console.error(
            `\n❌ ERROR: Timeline data found for clusters not in shapefile:`,
        )
        console.error(`    ${stats.unmatchedTimelineData.join(", ")}`)
        console.error(
            `\nThis indicates data inconsistency that should be fixed!`,
        )
        process.exit(1)
    }

    console.log(`\nTimeline bounds:`)
    console.log(`  - Earliest advancement: ${minDate || "none"}`)
    console.log(`  - Latest advancement: ${maxDate || "none"}`)
}

// Run the merge
mergeTimelineData().catch((error) => {
    console.error("Error merging timeline data:", error)
    process.exit(1)
})
