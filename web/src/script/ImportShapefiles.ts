import { load, Loader } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { GeoJSONFeature, GeoJSONFeatureSchema } from "zod-geojson"
import { writeFile } from "node:fs/promises"

// not sure why these require a relative path; can't compile otherwise
import { ShapefileOutput, ValidatedShapefile } from "../lib/ShapefileTypes"
import { fetchFile } from "../lib/FetchFile"
import { ExpandingRect, LatLongRect } from "./expandRect"
import { approximateLargestAlignedRectangle } from "./largestRectangle"

/**
 *  Import Shapefiles into GeoJSON and mix in the data from CSV files about clusters.
 *  This is a pre-build step to be run when cluster data changes.
 *
 *  To run:
 *    1. pnpm compile-importer
 *    2. pnpm import-shapefiles
 */
console.log("Importing shapefiles...")

const inputFilename = process.argv[2]
if (!inputFilename) {
    console.error("Usage: ImportShapefiles <filename>")
    process.exit(1)
}

const OUTPUT_FILENAME = './src/data/clusters.geo.json'

export interface ShapeFilePlusLargestRects extends ValidatedShapefile {
    // Largest aligned rectangles in each cluster (approximately), labeled by Cluster code (which is keyed by "Cluster" in the GeoJSON properties).
    // Computed by approximateLargestAlignedRectangle().
    largestClusterRects: Record<string, LatLongRect>
}

load<Loader<ShapefileOutput>>(
    `file://public/shapefiles/${inputFilename}`,
    ShapefileLoader,
    { fetch: fetchFile },
).then(async unvalidatedResult => {
    const largestClusterRects: Record<string, LatLongRect> = {}
    const features: GeoJSONFeature[] = unvalidatedResult.data.map(feature => {
        const parsedFeature = GeoJSONFeatureSchema.parse(feature)
        const clusterName = parsedFeature.properties?.Cluster
        if (typeof clusterName !== "string")
            console.error(`Cluster name is not a string: ${clusterName}`)
        else if (parsedFeature.geometry?.type === "Polygon") {
            const polygonRects: ExpandingRect[] = []
            parsedFeature.geometry.coordinates.forEach(polygon => {
                // console.log(`Processing ${clusterName} with ${polygon.length} points`)
                polygonRects.push(approximateLargestAlignedRectangle(polygon as [number, number][]))
            })
            if (polygonRects.length === 0)
                console.error(`No rectangles found for ${parsedFeature.properties?.Cluster}`)
            else
                largestClusterRects[clusterName] = polygonRects.reduce((a, b) => a.area > b.area ? a : b).rect
        }
        return parsedFeature
    })
    // omit "data" from result, since it is now in "features"
    const {data, ...rest} = unvalidatedResult
    const validatedShapefile: ShapeFilePlusLargestRects = {...rest, features, largestClusterRects}
    // console.log(JSON.stringify(validatedShapefile, null, 2))
    await writeFile(OUTPUT_FILENAME, JSON.stringify(validatedShapefile, null, 1))
    console.log(`Wrote geoJSON data to ${OUTPUT_FILENAME}`)
})
