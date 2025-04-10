import { load, Loader } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { GeoJSONFeature, GeoJSONFeatureSchema } from "zod-geojson"
import { writeFile } from "node:fs/promises"

// not sure why these require a relative path; can't compile otherwise
import { ShapefileOutput, ValidatedShapefile, ZodValidatedShapefile } from "../lib/ShapefileTypes"
import { fetchFile } from "../lib/FetchFile"
import { Feature } from "geojson"

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

// There is a TypeScript compiler error that may be fixed by https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1944:
// Type 'SharedArrayBuffer' is missing the following properties from type 'ArrayBuffer': resizable, resize, detached, transfer, transferToFixedLength
load<Loader<ShapefileOutput>>(
    `file://public/shapefiles/${inputFilename}`,
    ShapefileLoader,
    { fetch: fetchFile },
).then(async unvalidatedResult => {
    const validatedFeatures: GeoJSONFeature[] = unvalidatedResult.data.map(feature => GeoJSONFeatureSchema.parse(feature))
    const features = validatedFeatures as Feature[]
    // omit "data" from result, since it is now in "features"
    const {data, ...rest} = unvalidatedResult
    const validatedShapefile: ValidatedShapefile = {...rest, features}
    // console.log(JSON.stringify(validatedShapefile, null, 2))
    await writeFile(OUTPUT_FILENAME, JSON.stringify(validatedShapefile, null, 1))
    console.log(`Successfully wrote geoJSON data to ${OUTPUT_FILENAME}`)
})
