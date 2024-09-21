// copied from @loaders.gl/shapefile package since it doesn't export this type
import { load, Loader } from "@loaders.gl/core"
import { ShapefileLoader } from "@loaders.gl/shapefile"
import { GeoJSONFeature, GeoJSONFeatureSchema } from "zod-geojson"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { LoaderReturnType } from "@loaders.gl/loader-utils"

export interface SHXOutput {
    offsets: Int32Array;
    lengths: Int32Array;
}

export interface SHPHeader {
    /** SHP Magic number */
    magic: number;

    /** Number of bytes in file */
    length: number;
    version: number;
    type: number;
    bbox: {
        minX: number;
        minY: number;
        minZ: number;
        minM: number;
        maxX: number;
        maxY: number;
        maxZ: number;
        maxM: number;
    };
}

interface ShapefileOutput {
    encoding?: string;
    prj?: string;
    shx?: SHXOutput;
    header: SHPHeader;
    // expect each of these to be a GeoJSON Feature https://geojson.org/
    data: object[];
}

interface ValidatedShapefile extends ShapefileOutput {
    features?: GeoJSONFeature[]
    parseError?: string
}

const makeShapefileQuery = (filename: string) => async (): Promise<ValidatedShapefile> => {
    const unvalidatedResult = await load<Loader<ShapefileOutput>>(`/shapefiles/${filename}`, ShapefileLoader)
    try {
        const features: GeoJSONFeature[] = unvalidatedResult.data.map(feature => GeoJSONFeatureSchema.parse(feature))
        // console.log({unvalidatedResult, features})
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

export const useAllClustersShapefile = (): UseQueryResult<ValidatedShapefile> =>
    useShapefile('all-clusters.shp')
