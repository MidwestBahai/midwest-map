import {
    intersects,
    TwoDPoint,
    Polygon,
    isInsidePolygon,
    boundingRect,
    degenerateRect,
    isContainedByRect,
    expandRect,
    rectArea
} from './expandRect'

import { LatLongRect } from "@/lib/latLongRect"

describe('line segment intersection', () => {
    it('confirms line segments intersect', () => {
        const leftPoint: TwoDPoint = [0, 0]
        const rightPoint: TwoDPoint = [10, 0]
        const topPoint: TwoDPoint = [5, 5]
        const bottomPoint: TwoDPoint = [5, -5]

        expect(intersects(leftPoint, rightPoint, topPoint, bottomPoint)).toBe(true)

        // Test all combinations of horizontal/vertical lines and flipping
        for (const horizontalFirst of [true, false]) {
            for (const flipFirst of [true, false]) {
                for (const flipSecond of [true, false]) {
                    let firstLine = horizontalFirst ? [leftPoint, rightPoint] : [topPoint, bottomPoint]
                    let secondLine = horizontalFirst ? [topPoint, bottomPoint] : [leftPoint, rightPoint]
                    if (flipFirst) firstLine = [firstLine[1], firstLine[0]]
                    if (flipSecond) secondLine = [secondLine[1], secondLine[0]]
                    expect(intersects(firstLine[0], firstLine[1], secondLine[0], secondLine[1])).toBe(true)
                }
            }
        }
    })

    it('confirms parallel lines do not intersect', () => {
        const line1Start: TwoDPoint = [0, 0]
        const line1End: TwoDPoint = [10, 0]
        const line2Start: TwoDPoint = [0, 5]
        const line2End: TwoDPoint = [10, 5]

        expect(intersects(line1Start, line1End, line2Start, line2End)).toBe(false)
    })
})

describe('point in polygon', () => {
    it('correctly identifies points inside a polygon', () => {
        const square: Polygon = [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10]
        ]

        expect(isInsidePolygon([5, 5], square)).toBe(true)
        expect(isInsidePolygon([15, 5], square)).toBe(false)
        expect(isInsidePolygon([5, 15], square)).toBe(false)
        expect(isInsidePolygon([-5, 5], square)).toBe(false)
        expect(isInsidePolygon([5, -5], square)).toBe(false)
    })
})

describe('bounding rectangle', () => {
    it('calculates the correct bounding rectangle for a polygon', () => {
        const polygon: Polygon = [
            [10, 20],
            [30, 40],
            [50, 30],
            [20, 10]
        ]

        const rect = boundingRect(polygon)

        expect(rect.minLong).toBe(10)
        expect(rect.maxLong).toBe(50)
        expect(rect.minLat).toBe(10)
        expect(rect.maxLat).toBe(40)
    })
})

describe('degenerate rectangle', () => {
    it('creates a zero-area rectangle from a point', () => {
        const point: TwoDPoint = [15, 25]
        const rect = degenerateRect(point)

        expect(rect.minLong).toBe(15)
        expect(rect.maxLong).toBe(15)
        expect(rect.minLat).toBe(25)
        expect(rect.maxLat).toBe(25)
        expect(rectArea(rect)).toBe(0)
    })
})

describe('rectangle containment', () => {
    it('correctly identifies when one rectangle contains another', () => {
        const outerRect: LatLongRect = {
            minLong: 0,
            maxLong: 10,
            minLat: 0,
            maxLat: 10
        }

        const innerRect: LatLongRect = {
            minLong: 2,
            maxLong: 8,
            minLat: 2,
            maxLat: 8
        }

        const overlappingRect: LatLongRect = {
            minLong: 5,
            maxLong: 15,
            minLat: 5,
            maxLat: 15
        }

        expect(isContainedByRect(innerRect, outerRect)).toBe(true)
        expect(isContainedByRect(outerRect, innerRect)).toBe(false)
        expect(isContainedByRect(overlappingRect, outerRect)).toBe(false)
        expect(isContainedByRect(outerRect, overlappingRect)).toBe(false)
    })
})

describe('rectangle expansion', () => {
    it('expands a rectangle within a square polygon', () => {
        const square: Polygon = [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10]
        ]

        const initialRect: LatLongRect = {
            minLong: 4,
            maxLong: 6,
            minLat: 4,
            maxLat: 6
        }

        const expanded = expandRect(initialRect, square, .5)

        // Should expand close to the bounds of the square
        expect(expanded.minLong).toBeLessThan(1)
        expect(expanded.maxLong).toBeGreaterThan(9)
        expect(expanded.minLat).toBeLessThan(1)
        expect(expanded.maxLat).toBeGreaterThan(9)

        // Should not exceed the bounds of the square
        expect(expanded.minLong).toBeGreaterThanOrEqual(0)
        expect(expanded.maxLong).toBeLessThanOrEqual(10)
        expect(expanded.minLat).toBeGreaterThanOrEqual(0)
        expect(expanded.maxLat).toBeLessThanOrEqual(10)
    })
})

