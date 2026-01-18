import {
    boundingRect,
    degenerateRect,
    type ExpandingRect,
    expandingRect,
    expandRect,
    isInsidePolygon,
    type Polygon,
    rectArea,
    removeContainedRects,
    type TwoDPoint,
} from "./expandRect"

const pickRandomInteriorPoints = (
    polygon: Polygon,
    count: number,
    maxTries: number,
): Polygon => {
    const result: Polygon = []
    let tries = 0
    while (result.length < count) {
        const point: TwoDPoint = [
            Math.random() *
                (boundingRect(polygon).maxLong -
                    boundingRect(polygon).minLong) +
                boundingRect(polygon).minLong,
            Math.random() *
                (boundingRect(polygon).maxLat - boundingRect(polygon).minLat) +
                boundingRect(polygon).minLat,
        ]
        if (isInsidePolygon(point, polygon)) result.push(point)
        tries++
        if (tries > maxTries)
            throw new Error(
                `Could not find ${count} interior points after ${maxTries} tries — only found ${result.length}.`,
            )
    }
    return result
}

// TODO for a multi-polygon, either pick points in all or pick points in the largest — currently not finding any
/**
 * Approximate the largest rectangle inside a polygon — measured by area — aligned to the axes (that is, no rotated rectangles).
 * Round lat/long to 5 decimal places, which is about 1 meter.
 * @param polygon an array of [longitude, latitude] points that define the polygon.
 * @param epsilon precision that is "good enough", in points of latitude or longitude. Default is 0.01, which is a little less than a mile at the equator.
 */
export const approximateLargestAlignedRectangle = (
    polygon: Polygon,
    epsilon: number = 0.01,
): ExpandingRect => {
    const bounding = boundingRect(polygon)
    if (rectArea(bounding) < epsilon * epsilon * 4)
        throw new Error("Polygon is too small to contain a rectangle")

    // 1. Pick starting points, at random
    const interiorPoints = pickRandomInteriorPoints(polygon, 10, 100)
    // Start with changes that are a 20th of the bounding box
    let delta =
        Math.min(
            bounding.maxLat - bounding.minLat,
            bounding.maxLong - bounding.minLong,
        ) / 20
    if (delta < epsilon)
        throw new Error(
            `Initial delta (${delta}) is smaller than epsilon (${
                epsilon
            }); we may need to increase number of initial points or decrease epsilon.`,
        )
    const degenerateRects = interiorPoints.map(degenerateRect)
    // console.log(`Starting with ${degenerateRects.length} degenerate rectangles: ${JSON.stringify(degenerateRects)}`)

    // 2. Initial expansion into rectangles
    const initialRects = removeContainedRects(
        degenerateRects
            .map((rect) => expandRect(rect, polygon, delta))
            .map(expandingRect)
            .filter(({ area }) => area > 0),
    )
    if (initialRects.length === 0)
        throw new Error(
            "No initial rectangles found; we may need to decrease delta or increase number of initial points.",
        )

    // console.log(`Expanded to ${initialRects.length} initial rectangles: ${JSON.stringify(initialRects)}`)

    // 3. Loop: Decrease delta, expand, and remove those contained in others — until we reach epsilon
    // TODO actually use the rectangle's delta
    // TODO track which have stalled
    let rects = initialRects
    while (delta > epsilon) {
        delta *= 0.5
        rects = removeContainedRects(
            rects
                .map((rect) => expandRect(rect.rect, polygon, delta))
                .map(expandingRect),
        )
    }

    // 4. Find the largest rectangle
    const rawResult = rects.reduce((max, rect) =>
        rect.area > max.area ? rect : max,
    )
    // TODO round to 5 decimal places
    return rawResult
}
