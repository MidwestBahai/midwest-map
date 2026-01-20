import { type Loader, load } from "@loaders.gl/core"
import type { LoaderReturnType } from "@loaders.gl/loader-utils"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import type { Feature } from "geojson"
import { type GeoJSONFeature, GeoJSONFeatureSchema } from "zod-geojson"
import type { ShapefileOutput, ValidatedShapefile } from "@/lib/ShapefileTypes"

const makeShapefileQuery =
    (filename: string) => async (): Promise<ValidatedShapefile> => {
        const unvalidatedResult = (await load(
            `/shapefiles/${filename}`,
            ShapefileLoader,
        )) as ShapefileOutput
        try {
            const validatedFeatures: GeoJSONFeature[] =
                unvalidatedResult.data.map((feature) =>
                    GeoJSONFeatureSchema.parse(feature),
                )
            // console.log({filename, unvalidatedResult, features: validatedFeatures, filtered: validatedFeatures.filter(f => f.properties?.Cluster === "IN-07" || f.properties?.Cluster === "IN-04")})
            // Cast from Zod GeoJSONFeature to Feature — they're practically compatible, just not TypeScript compatible
            const features = validatedFeatures as Feature[]
            return { ...unvalidatedResult, features }
        } catch (error) {
            console.error({
                message: "Error parsing geoJSON features.",
                error,
            })
            return { ...unvalidatedResult, parseError: `${error}` }
        }
    }

export const useShapefile = (
    shapefile: string,
): UseQueryResult<ValidatedShapefile> =>
    useQuery<LoaderReturnType<Loader<ValidatedShapefile>>>({
        queryKey: [shapefile],
        queryFn: makeShapefileQuery(shapefile),
    })
