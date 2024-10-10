import { load, Loader } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { GeoJSONFeature, GeoJSONFeatureSchema } from "zod-geojson"
import { writeFile } from "node:fs/promises"
import { ShapefileOutput, ValidatedShapefile } from "@/app/_lib/ShapefileTypes"
// not sure why this requires a relative path; can't compile otherwise
import { fetchFile } from "../_lib/FetchFile"

/**
 *  Import Shapefiles into GeoJSON and mix in the data from CSV files about clusters.
 *  This is a pre-build step to be run when cluster data changes.
 *
 *  TODO specific instructions to invoke
 *
 *  Note: This uses http to load the shapefiles, which requires a local webserver.
 *  This is a hack to work around node fetch()'s lack of support for file://... URLs.
 *  A better solution: https://loaders.gl/docs/modules/core/api-reference/fetch-file
 *  But when I tried it, I couldn't get fetchFile() to register, so it fell back to fetch().
 *  https://loaders.gl/docs/modules/core/api-reference/register-loaders
 *  I think fetchFile is included in https://www.npmjs.com/package/@loaders.gl/polyfills
 *
 *  It might work though to simply copy fetchFile() into code here and hot-wire it.
 */
console.log("Importing shapefiles...")

const inputFilename = process.argv[2]
if (!inputFilename) {
    console.error("Usage: ImportShapefiles <filename>")
    process.exit(1)
}

const OUTPUT_FILENAME = './app/_data/clusters.geo.json'

load<Loader<ShapefileOutput>>(
    `file://public/shapefiles/${inputFilename}`,
    ShapefileLoader,
    { fetch: fetchFile },
).then(async unvalidatedResult => {
    const features: GeoJSONFeature[] = unvalidatedResult.data.map(feature => GeoJSONFeatureSchema.parse(feature))
    // omit "data" from result, since it is now in "features"
    const {data, ...rest} = unvalidatedResult
    const validatedShapefile: ValidatedShapefile = {...rest, features}
    // console.log(JSON.stringify(validatedShapefile, null, 2))
    await writeFile(OUTPUT_FILENAME, JSON.stringify(validatedShapefile, null, 1))
    console.log(`Successfully wrote geoJSON data to ${OUTPUT_FILENAME}`)
})
