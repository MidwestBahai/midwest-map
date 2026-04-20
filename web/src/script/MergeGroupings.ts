import { readFile, writeFile } from "node:fs/promises"
import { parse } from "csv-parse/sync"
import type { Feature } from "geojson"
import type { LatLongRect } from "../lib/latLongRect"

/**
 * Merge grouping timeline data into the cluster GeoJSON.
 * This runs after MergeAdvancementData and before MapCountiesToClusters:
 *   1. ImportShapefiles.ts → clusters-static.geo.json
 *   2. MergeAdvancementData.ts → clusters-timeline.geo.json
 *   3. MergeGroupings.ts → clusters-timeline.geo.json (adds groupTimeline)
 *   4. MapCountiesToClusters.ts → counties.geo.json
 *
 * To run:
 *   1. pnpm compile-importer
 *   2. pnpm merge-groupings
 */

const CLUSTERS_FILE = "./src/data/clusters-timeline.geo.json"

/** Grouping scheme definitions — each has an effective date and a TSV file */
const GROUPING_SCHEMES = [
    {
        id: "2026",
        effectiveDate: "2026-03-15",
        tsvFile: "./data-sources/groupings/2026-03.tsv",
    },
]

interface GroupingRecord {
    Cluster: string
    Group: string
}

interface GroupTimelineEntry {
    group: string
    from: string
}

async function loadGroupingTsv(tsvFile: string): Promise<Map<string, string>> {
    const fileContent = await readFile(tsvFile, "utf-8")
    const records = parse(fileContent, {
        columns: true,
        delimiter: "\t",
        skip_empty_lines: true,
        trim: true,
    }) as GroupingRecord[]

    const mapping = new Map<string, string>()
    for (const record of records) {
        mapping.set(record.Cluster, record.Group)
    }
    return mapping
}

async function mergeGroupings() {
    console.log("Starting grouping timeline merge...")

    // Load cluster data
    const dataText = await readFile(CLUSTERS_FILE, "utf-8")
    const data = JSON.parse(dataText) as {
        features: Feature[]
        largestClusterRects: Record<string, LatLongRect>
        timelineBounds: { minDate: string | null; maxDate: string | null }
    }

    const clusterIds = new Set(
        data.features
            .map((f) => f.properties?.Cluster as string)
            .filter(Boolean),
    )

    // Load all grouping schemes
    const schemes: Array<{
        id: string
        effectiveDate: string
        mapping: Map<string, string>
    }> = []

    for (const scheme of GROUPING_SCHEMES) {
        console.log(
            `Loading grouping scheme "${scheme.id}" from ${scheme.tsvFile}...`,
        )
        const mapping = await loadGroupingTsv(scheme.tsvFile)
        schemes.push({ ...scheme, mapping })

        // Warn about clusters in TSV but not in GeoJSON
        for (const clusterId of mapping.keys()) {
            if (!clusterIds.has(clusterId)) {
                console.warn(
                    `  ⚠️  Cluster "${clusterId}" in ${scheme.tsvFile} not found in GeoJSON`,
                )
            }
        }

        // Warn about clusters in GeoJSON but not in TSV
        let missing = 0
        for (const clusterId of clusterIds) {
            if (!mapping.has(clusterId)) {
                console.warn(
                    `  ⚠️  Cluster "${clusterId}" not in scheme "${scheme.id}" — keeps legacy group`,
                )
                missing++
            }
        }
        if (missing === 0) {
            console.log(`  ✅ All ${clusterIds.size} clusters have mappings`)
        }
    }

    // Build groupTimeline on each feature
    for (const feature of data.features) {
        const props = feature.properties
        if (!props) continue

        const clusterId = props.Cluster as string
        const legacyGroup = props.Group as string

        // Start with the legacy group from the shapefile
        const timeline: GroupTimelineEntry[] = [
            { group: legacyGroup, from: "2000-01-01" },
        ]

        // Append entries from each scheme
        let latestGroup = legacyGroup
        for (const scheme of schemes) {
            const newGroup = scheme.mapping.get(clusterId)
            if (newGroup) {
                timeline.push({ group: newGroup, from: scheme.effectiveDate })
                if (
                    !schemes.some(
                        (s) =>
                            s.effectiveDate > scheme.effectiveDate &&
                            s.mapping.has(clusterId),
                    )
                ) {
                    latestGroup = newGroup
                }
            }
        }

        props.groupTimeline = timeline
        // Update static Group to the latest for backward compat
        props.Group = latestGroup
    }

    // Write output
    await writeFile(CLUSTERS_FILE, JSON.stringify(data, null, 1))

    console.log(`\n✅ Merged grouping timelines into ${CLUSTERS_FILE}`)
    console.log(`  ${data.features.length} features updated with groupTimeline`)
}

mergeGroupings().catch((error) => {
    console.error("Error merging groupings:", error)
    process.exit(1)
})
