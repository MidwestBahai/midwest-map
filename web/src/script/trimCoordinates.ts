/**
 * Recursively round all coordinate numbers in a GeoJSON structure to 4 decimal places (~11m precision).
 */
export function trimCoordinates<T>(geojson: T): T {
    if (Array.isArray(geojson)) {
        return geojson.map((item) =>
            typeof item === "number"
                ? Math.round(item * 10000) / 10000
                : trimCoordinates(item),
        ) as T
    }
    if (geojson !== null && typeof geojson === "object") {
        const result: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(geojson)) {
            result[key] = key === "coordinates" ? trimCoordinates(value) : value
        }
        return result as T
    }
    return geojson
}
