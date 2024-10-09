import { GeoJSONFeature } from "zod-geojson"

// copied from @loaders.gl/shapefile package since it doesn't export these types
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

export interface ShapefileOutput {
    encoding?: string;
    prj?: string;
    shx?: SHXOutput;
    header: SHPHeader;
    // expect each of these to be a GeoJSON Feature https://geojson.org/
    data: object[];
}

export interface ValidatedShapefile extends ShapefileOutput {
    features?: GeoJSONFeature[]
    parseError?: string
}