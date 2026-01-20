import type { LatLongRect } from "./latLongRect"

describe("LatLongRect", () => {
    it("has the correct structure", () => {
        const rect: LatLongRect = {
            minLat: 10,
            maxLat: 20,
            minLong: 30,
            maxLong: 40,
        }

        expect(rect.minLat).toBe(10)
        expect(rect.maxLat).toBe(20)
        expect(rect.minLong).toBe(30)
        expect(rect.maxLong).toBe(40)
    })

    it("can represent a zero-area rectangle", () => {
        const point: LatLongRect = {
            minLat: 15,
            maxLat: 15,
            minLong: 25,
            maxLong: 25,
        }

        expect(point.minLat).toBe(point.maxLat)
        expect(point.minLong).toBe(point.maxLong)
    })
})
