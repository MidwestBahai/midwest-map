import { load } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { GeoJSONFeatureSchema } from "zod-geojson"
import { writeFile } from "node:fs/promises"
import { Feature, FeatureCollection } from "geojson"

// not sure why these require a relative path; can't compile otherwise
import { ShapefileOutput } from "../lib/ShapefileTypes"
import { fetchFile } from "../lib/FetchFile"

/**
 *  Import County shapefile into GeoJSON.
 *  This is a pre-build step to be run when county data changes.
 *
 *  To run:
 *    1. pnpm compile-importer
 *    2. pnpm import-counties
 */
console.log("Importing counties shapefile...")

const INPUT_FILENAME = 'counties.shp'
const OUTPUT_FILENAME = './src/data/counties.geo.json'

load(
    `file://data-sources/shapefiles/${INPUT_FILENAME}`,
    { ...ShapefileLoader, tests: ShapefileLoader.tests as any[] },
    { fetch: fetchFile },
).then(async (unvalidatedResult) => {
    const typedUnvalidatedResult = unvalidatedResult as ShapefileOutput
    const features: Feature[] = typedUnvalidatedResult.data.map(feature => {
        return GeoJSONFeatureSchema.parse(feature) as Feature
    })

    const featureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features,
    }

    await writeFile(OUTPUT_FILENAME, JSON.stringify(featureCollection, null, 1))
    console.log(`Wrote ${features.length} county features to ${OUTPUT_FILENAME}`)
})
