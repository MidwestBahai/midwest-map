// copied from @loaders.gl/shapefile package since it doesn't export this type
import { load, Loader } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { GeoJSONFeature, GeoJSONFeatureSchema } from "zod-geojson"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { LoaderReturnType } from "@loaders.gl/loader-utils"
import { ShapefileOutput, ValidatedShapefile } from "@/app/_lib/ShapefileTypes"

const makeShapefileQuery = (filename: string) => async (): Promise<ValidatedShapefile> => {
    const unvalidatedResult = await load<Loader<ShapefileOutput>>(`/shapefiles/${filename}`, ShapefileLoader)
    try {
        const features: GeoJSONFeature[] = unvalidatedResult.data.map(feature => GeoJSONFeatureSchema.parse(feature))
        console.log({filename, unvalidatedResult, features, filtered: features.filter(f => f.properties?.Cluster === "IN-07" || f.properties?.Cluster === "IN-04")})
        return {...unvalidatedResult, features}
    } catch (error) {
        console.error({message: "Error parsing geoJSON features.", error})
        return {...unvalidatedResult, parseError: `${error}`}
    }
}

export const useShapefile = (shapefile: string): UseQueryResult<ValidatedShapefile> =>
    useQuery<LoaderReturnType<Loader<ValidatedShapefile>>>({
        queryKey: [shapefile],
        queryFn: makeShapefileQuery(shapefile),
    })
