// Utility functions for expanding a rectangle to fit a polygon

import { LatLongRect } from "@/lib/latLongRect"

export type TwoDPoint = [number, number]

export interface ExpandingRect {
    rect: LatLongRect,
    area: number, // for easy ranking
    delta: number, // the last amount this was incremented by
}

export const rectArea = (rect: LatLongRect) => (rect.maxLat - rect.minLat) * (rect.maxLong - rect.minLong)
export const expandingRect = (rect: LatLongRect, delta: number): ExpandingRect => ({
    rect,
    area: rectArea(rect),
    delta,
})

/** See https://en.wikipedia.org/wiki/Point_in_polygon
 *  The ray casting algorithm where an odd number of intersections means the point is inside the polygon.
 *  Thank you copilot. */
export const isInsidePolygon = (point: TwoDPoint, polygon: TwoDPoint[]) => {
    let isInside = false
    const [x, y] = point
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i], [xj, yj] = polygon[j]
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if (intersect) isInside = !isInside
    }
    return isInside
}

export const boundingRect = (polygon: [number, number][]) => ({
    minLat: Math.min(...polygon.map(([_, lat]) => lat)),
    maxLat: Math.max(...polygon.map(([_, lat]) => lat)),
    minLong: Math.min(...polygon.map(([long, _]) => long)),
    maxLong: Math.max(...polygon.map(([long, _]) => long)),
})

export const degenerateRect = (point: TwoDPoint): LatLongRect => ({
    minLat: point[1],
    maxLat: point[1],
    minLong: point[0],
    maxLong: point[0],
})

/** Is a contained by b? */
export const isContainedByRect = (a: LatLongRect, b: LatLongRect) =>
    a.minLat >= b.minLat && a.maxLat <= b.maxLat && a.minLong >= b.minLong && a.maxLong <= b.maxLong

export const removeContainedRects = (rects: ExpandingRect[]): ExpandingRect[] =>
    rects.filter(rect => !rects.some(r => r !== rect && isContainedByRect(r.rect, rect.rect)))

const intersects = (a1: TwoDPoint, a2: TwoDPoint, b1: TwoDPoint, b2: TwoDPoint) => {
    const [x1, y1] = a1, [x2, y2] = a2, [x3, y3] = b1, [x4, y4] = b2
    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if (d === 0) return false
    const u = ((x3 - x1) * (y3 - y4) - (y3 - y1) * (x3 - x4)) / d
    const v = ((x3 - x1) * (y1 - y2) - (y3 - y1) * (x1 - x2)) / d
    return u >= 0 && u <= 1 && v >= 0 && v <= 1
}

const rectangleIntersectsPolygon = (rect: LatLongRect, polygon: TwoDPoint[]) => {
    const [minLat, maxLat, minLong, maxLong] = [rect.minLat, rect.maxLat, rect.minLong, rect.maxLong]
    const corners: TwoDPoint[] = [
        [minLong, minLat], [maxLong, minLat], [maxLong, maxLat], [minLong, maxLat]
    ]
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a1 = polygon[i], a2 = polygon[j]
        for (let k = 0, l = corners.length - 1; k < corners.length; l = k++) {
            const b1 = corners[k], b2 = corners[l]
            if (intersects(a1, a2, b1, b2)) return true
        }
    }
    return false
}

// TODO try expanding multiple directions and saving best from each
/** Expand a rectangle in each direction, round-robin, until it hits the edge of the polygon. */
export const expandRect = (rect: LatLongRect, polygon: TwoDPoint[], delta: number): LatLongRect => {
    let result = rect
    let tmpResult = rect
    const bounding = boundingRect(polygon)

    // first go in all directions until we hit the edge
    do {
        result = tmpResult
        tmpResult = expandAllDirections(result, delta)
        // process.stdout.write('.')
    } while (isContainedByRect(tmpResult, bounding) && !rectangleIntersectsPolygon(tmpResult, polygon))
    // console.log(`Expanded in all directions to ${JSON.stringify(result)}`)

    // then go in each direction, round-robin, until we hit the edge
    tmpResult = result // reset
    let stalled = false
    do {
        stalled = true
        for (const direction of directions) {
            tmpResult = expandInDirections(result, delta, direction)
            if (isContainedByRect(tmpResult, bounding) && !rectangleIntersectsPolygon(tmpResult, polygon)) {
                // process.stdout.write(`${direction}: ${rectArea(result)} –> ${rectArea(tmpResult)}; `)
                result = tmpResult
                stalled = false
            }
        }
    } while (!stalled)
    // console.log(`Expanded in each direction to ${JSON.stringify(result)}`)

    return result
}

const directions = [1, 2, 4, 8]

const allDirections = 15

// Direction is a 4-bit number, with bits representing N, E, S, W
const expandInDirections = (rect: LatLongRect, delta: number, direction: number): LatLongRect => {
    let result = {...rect}
    if (direction & 1) result.maxLat += delta
    if (direction & 2) result.maxLong += delta
    if (direction & 4) result.minLat -= delta
    if (direction & 8) result.minLong -= delta
    return result
}

const expandAllDirections = (rect: LatLongRect, delta: number): LatLongRect =>
    expandInDirections(rect, delta, allDirections)
