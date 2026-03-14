import type { Feature } from "geojson"

export type BBox = [west: number, south: number, east: number, north: number]

/** Walk all coordinates in a feature's geometry and return its bounding box. */
export function featureBbox(feature: Feature): BBox {
    const bbox: BBox = [Infinity, Infinity, -Infinity, -Infinity]
    walkCoords(feature.geometry, bbox)
    return bbox
}

/** Merge multiple bounding boxes into one. */
export function combineBboxes(bboxes: BBox[]): BBox {
    const result: BBox = [Infinity, Infinity, -Infinity, -Infinity]
    for (const b of bboxes) {
        if (b[0] < result[0]) result[0] = b[0]
        if (b[1] < result[1]) result[1] = b[1]
        if (b[2] > result[2]) result[2] = b[2]
        if (b[3] > result[3]) result[3] = b[3]
    }
    return result
}

// biome-ignore lint/suspicious/noExplicitAny: GeoJSON geometry types are complex unions
function walkCoords(geom: any, bbox: BBox) {
    if (!geom) return
    if (geom.type === "Point") {
        updateBbox(bbox, geom.coordinates)
    } else if (geom.type === "MultiPoint" || geom.type === "LineString") {
        for (const c of geom.coordinates) updateBbox(bbox, c)
    } else if (geom.type === "Polygon" || geom.type === "MultiLineString") {
        for (const ring of geom.coordinates)
            for (const c of ring) updateBbox(bbox, c)
    } else if (geom.type === "MultiPolygon") {
        for (const poly of geom.coordinates)
            for (const ring of poly) for (const c of ring) updateBbox(bbox, c)
    }
}

function updateBbox(bbox: BBox, coord: [number, number]) {
    if (coord[0] < bbox[0]) bbox[0] = coord[0]
    if (coord[1] < bbox[1]) bbox[1] = coord[1]
    if (coord[0] > bbox[2]) bbox[2] = coord[0]
    if (coord[1] > bbox[3]) bbox[3] = coord[1]
}
