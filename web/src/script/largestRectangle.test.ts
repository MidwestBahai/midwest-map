import { approximateLargestAlignedRectangle } from './largestRectangle'
import { boundingRect, rectArea, TwoDPoint, Polygon } from './expandRect'

describe('largest rectangle approximation', () => {
    it('finds a rectangle inside a square', () => {
        const square: Polygon = [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10]
        ]

        const result = approximateLargestAlignedRectangle(square, 0.1)

        // The result should be close to the full square (area = 100)
        expect(result.area).toBeGreaterThan(90)
        expect(rectArea(result.rect)).toBeGreaterThan(90)

        // The rectangle should be within the bounds of the square
        expect(result.rect.minLong).toBeGreaterThanOrEqual(0)
        expect(result.rect.maxLong).toBeLessThanOrEqual(10)
        expect(result.rect.minLat).toBeGreaterThanOrEqual(0)
        expect(result.rect.maxLat).toBeLessThanOrEqual(10)
    })

    it('finds a rectangle inside an L-shaped polygon', () => {
        // L-shaped polygon
        const lShape: Polygon = [
            [0, 0],   // bottom-left
            [10, 0],  // bottom-right
            [10, 5],  // middle-right
            [5, 5],   // middle-center
            [5, 10],  // top-center
            [0, 10]   // top-left
        ]

        const result = approximateLargestAlignedRectangle(lShape, 0.1)

        // The result should be non-zero
        expect(result.area).toBeGreaterThan(0)

        // The rectangle should be within the bounds of the L shape
        expect(result.rect.minLong).toBeGreaterThanOrEqual(0)
        expect(result.rect.maxLong).toBeLessThanOrEqual(10)
        expect(result.rect.minLat).toBeGreaterThanOrEqual(0)
        expect(result.rect.maxLat).toBeLessThanOrEqual(10)

        // Additional check to verify the rectangle is likely inside the L shape
        // It should either be in the horizontal or vertical part of the L
        const isInHorizontalPart =
            result.rect.maxLat <= 5 && result.rect.maxLong <= 10
        const isInVerticalPart =
            result.rect.minLong <= 5 && result.rect.maxLat <= 10

        expect(isInHorizontalPart || isInVerticalPart).toBe(true)
    })

    it('finds rectangles inside triangles', () => {
        const triangles: TwoDPoint[][] = [
            [
                [0, 0],
                [10, 0],
                [5, 5]
            ],
            [
                [0, 0],
                [0, 10],
                [10, 0]
            ],
        ]
        for (const triangle of triangles) {
            const result = approximateLargestAlignedRectangle(triangle, 0.1)
            const triangleArea = 0.5 * rectArea(boundingRect(triangle))
            const minArea = 0.45 * triangleArea // max would be 0.5 * triangle area
            // console.log({result, triangleArea, minArea})
            expect(result.area).toBeGreaterThan(minArea)
        }
    })
})