import { load, Loader } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { GeoJSONFeatureSchema } from "zod-geojson"
import { writeFile } from "node:fs/promises"
import { Feature } from "geojson"

// not sure why these require a relative path; can't compile otherwise
import { ShapefileOutput, ValidatedShapefile } from "../lib/ShapefileTypes"
import { fetchFile } from "../lib/FetchFile"
import { LatLongRect } from "../lib/latLongRect"
import { boundingRect, ExpandingRect } from "./expandRect"
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

const OUTPUT_FILENAME = './src/data/clusters-static.geo.json'

export interface ShapeFilePlusLargestRects extends ValidatedShapefile {
    // Largest aligned rectangles in each cluster (approximately), labeled by Cluster code (which is keyed by "Cluster" in the GeoJSON properties).
    // Computed by approximateLargestAlignedRectangle().
    largestClusterRects: Record<string, LatLongRect>
}

// There is a TypeScript compiler error after 5.6 that may be fixed by https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1944:
// Type 'SharedArrayBuffer' is missing the following properties from type 'ArrayBuffer': resizable, resize, detached, transfer, transferToFixedLength
load(
    `file://data-sources/shapefiles/${inputFilename}`,
    { ...ShapefileLoader, tests: ShapefileLoader.tests as any[] },
    { fetch: fetchFile },
).then(async (unvalidatedResult) => {
    const typedUnvalidatedResult = unvalidatedResult as ShapefileOutput
    const largestClusterRects: Record<string, LatLongRect> = {}
    const features: Feature[] = typedUnvalidatedResult.data.map(feature => {
        const parsedFeature = GeoJSONFeatureSchema.parse(feature) as Feature
        const clusterName = parsedFeature.properties?.Cluster
        if (typeof clusterName !== "string")
            console.error(`Cluster name is not a string: ${clusterName}`)
        else if (parsedFeature.geometry?.type === "Polygon" || parsedFeature.geometry?.type === "MultiPolygon") {
            const polygonRects: ExpandingRect[] = []

            if (parsedFeature.geometry.type === "Polygon") {
                parsedFeature.geometry.coordinates.forEach(polygon => {
                    // const bounding = boundingRect(polygon as [number, number][])
                    // const minDim = Math.min(bounding.maxLat - bounding.minLat, bounding.maxLong - bounding.minLong)
                    // console.log(`Cluster ${clusterName} min dimension ${minDim} with ${polygon.length} points`)
                    // console.log(`Processing ${clusterName} with ${polygon.length} points`)
                    polygonRects.push(approximateLargestAlignedRectangle(polygon as [number, number][]))
                })
            }

            // Multipolygon is an array of polygons, each of which is an array of points.
            // It means the geographic region is disconnected. We can still just look for the largest single rectangle.
            else parsedFeature.geometry.coordinates.forEach(multiPolygon =>
                multiPolygon.forEach(polygon => {
                    const bounding = boundingRect(polygon as [number, number][])
                    const minDim = Math.min(bounding.maxLat - bounding.minLat, bounding.maxLong - bounding.minLong)
                    if (bounding.maxLat - bounding.minLat < 0.2 || bounding.maxLong - bounding.minLong < 0.2) {
                        console.debug(`Skipping tiny polygon for ${clusterName} with ${polygon.length} points and min dimension ${minDim}`)
                    }
                    else {
                        try {
                            polygonRects.push(approximateLargestAlignedRectangle(polygon as [number, number][]))
                        } catch (e) {
                            console.error(`Error processing ${clusterName}, min dimension ${minDim} with ${polygon.length} points: ${e}`)
                        }
                    }
                })
            )

            if (polygonRects.length === 0)
                console.error(`No rectangles found for ${parsedFeature.properties?.Cluster}`)
            else
                largestClusterRects[clusterName] = polygonRects.reduce((a, b) => a.area > b.area ? a : b).rect
        }
        return parsedFeature
    })
    // omit "data" from result, since it is now in "features"
    const {data, ...rest} = typedUnvalidatedResult
    const validatedShapefile: ShapeFilePlusLargestRects = {...rest, features, largestClusterRects}
    // console.log(JSON.stringify(validatedShapefile, null, 2))
    await writeFile(OUTPUT_FILENAME, JSON.stringify(validatedShapefile, null, 1))
    console.log(`Wrote geoJSON data to ${OUTPUT_FILENAME}`)
})
