import { readFile, writeFile } from "node:fs/promises"
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
import pointOnFeature from "@turf/point-on-feature"
import type {
    Feature,
    FeatureCollection,
    MultiPolygon,
    Point,
    Polygon,
} from "geojson"

/**
 * Map each county to its containing cluster.
 * Adds clusterCode, clusterState, and clusterGroup properties to each county feature.
 *
 * To run:
 *   1. pnpm compile-importer
 *   2. pnpm map-counties
 */

const COUNTIES_PATH = "./src/data/counties.geo.json"
const CLUSTERS_PATH = "./src/data/clusters-timeline.geo.json"

interface ClusterProperties {
    Cluster: string
    ST: string
    Group: string
}

interface CountyProperties {
    STATEFP: string
    COUNTYFP: string
    NAME: string
    GEOID: string
    [key: string]: unknown
}

interface EnrichedCountyProperties extends CountyProperties {
    clusterCode: string
    clusterState: string
    clusterGroup: string
}

type ClusterFeature = Feature<Polygon | MultiPolygon, ClusterProperties>
type CountyFeature = Feature<Polygon | MultiPolygon, CountyProperties>

/**
 * Check if a point is inside a polygon or any sub-polygon of a MultiPolygon
 */
function pointInCluster(
    point: Feature<Point>,
    cluster: ClusterFeature,
): boolean {
    const geometry = cluster.geometry

    if (geometry.type === "Polygon") {
        return booleanPointInPolygon(point, geometry)
    }

    if (geometry.type === "MultiPolygon") {
        // Check each sub-polygon
        for (const coords of geometry.coordinates) {
            const subPolygon: Polygon = {
                type: "Polygon",
                coordinates: coords,
            }
            if (booleanPointInPolygon(point, subPolygon)) {
                return true
            }
        }
    }

    return false
}

async function main() {
    console.log("Mapping counties to clusters...")

    // Load data files
    const countiesData = JSON.parse(
        await readFile(COUNTIES_PATH, "utf-8"),
    ) as FeatureCollection<Polygon | MultiPolygon, CountyProperties>

    const clustersData = JSON.parse(
        await readFile(CLUSTERS_PATH, "utf-8"),
    ) as FeatureCollection<Polygon | MultiPolygon, ClusterProperties>

    console.log(`Loaded ${countiesData.features.length} counties`)
    console.log(`Loaded ${clustersData.features.length} clusters`)

    const clusters = clustersData.features as ClusterFeature[]
    const unmatched: string[] = []
    let matched = 0

    // Process each county
    const enrichedFeatures = countiesData.features.map((county) => {
        const countyFeature = county as CountyFeature
        const countyName = countyFeature.properties.NAME
        const countyState = countyFeature.properties.STATEFP

        // Get a point guaranteed to be inside the county polygon
        const point = pointOnFeature(countyFeature)

        // Find the cluster containing this point
        let matchingCluster: ClusterFeature | null = null
        for (const cluster of clusters) {
            if (pointInCluster(point, cluster)) {
                matchingCluster = cluster
                break
            }
        }

        if (matchingCluster) {
            matched++
            const enrichedProps: EnrichedCountyProperties = {
                ...countyFeature.properties,
                clusterCode: matchingCluster.properties.Cluster,
                clusterState: matchingCluster.properties.ST,
                clusterGroup: matchingCluster.properties.Group,
            }

            // Log for debugging
            console.log(
                `  ${countyName} County (FIPS ${countyState}) → ${enrichedProps.clusterCode} (${enrichedProps.clusterGroup} group)`,
            )

            return {
                ...countyFeature,
                properties: enrichedProps,
            }
        }

        // No match found - this is an error condition
        unmatched.push(`${countyName} (STATEFP: ${countyState})`)
        return countyFeature
    })

    console.log(
        `\nMatched: ${matched}/${countiesData.features.length} counties`,
    )

    if (unmatched.length > 0) {
        console.error(
            "\n❌ ERROR: The following counties were not matched to any cluster:",
        )
        for (const name of unmatched) {
            console.error(`  - ${name}`)
        }
        process.exit(1)
    }

    // Write enriched data
    const enrichedCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: enrichedFeatures,
    }

    await writeFile(COUNTIES_PATH, JSON.stringify(enrichedCollection, null, 1))
    console.log(`\n✓ Wrote enriched county data to ${COUNTIES_PATH}`)
}

main().catch((error) => {
    console.error("Error:", error)
    process.exit(1)
})
