import { load, Loader } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { GeoJSONFeature, GeoJSONFeatureSchema } from "zod-geojson"
import { ShapefileOutput, ValidatedShapefile } from "@/app/_lib/ShapefileTypes"
import { fetchFile } from "@/app/_lib/FetchFile"
import { writeFile } from "node:fs/promises"

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

const filename = process.argv[2]
if (!filename) {
    console.error("Usage: ImportShapefiles <filename>")
    process.exit(1)
}

load<Loader<ShapefileOutput>>(
    `file://public/shapefiles/${filename}`,
    ShapefileLoader,
    { fetch: fetchFile },
).then(async unvalidatedResult => {
    const features: GeoJSONFeature[] = unvalidatedResult.data.map(feature => GeoJSONFeatureSchema.parse(feature))
    const validatedShapefile: ValidatedShapefile = {...unvalidatedResult, features}
    // console.log(JSON.stringify(validatedShapefile, null, 2))
    await writeFile('./app/_data/clusters.geo.json', JSON.stringify(validatedShapefile, null, 1))
})