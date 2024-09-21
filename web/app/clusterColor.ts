import { GeoJSONFeature } from "zod-geojson"

const clusterBaseHue = (properties: GeoJSONFeature["properties"]) => {
    const group = properties?.["Group"] ?? "Unknown"
    switch (group) {
        case "AA":
            return 200 // blue
        case "GR":
            return 30 // orange
        case "INDY":
            return 330 // pink
        case "CLV":
            return 100 // green
        case "CBUS":
            return 270 // purplish
        default:
            return 0
    }
}

const milestoneColorInner = (milestone: string, baseHue: number) => {
    switch (milestone.toLowerCase()) {
        case "m3":
            return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l + 0.2) a b / 0.3)`
        case "m2":
            return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l + 0.1) a b / 0.3)`
        case "m1":
            return `oklab(from hsl(${baseHue}, 100%, 50%) l a b / 0.3)`
        case "m0":
            return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l - 0.1) a b / 0.3)`
        case "n":
            return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l - 0.2) a b / 0.3)`
        case "e":
            return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l - 0.3) a b / 0.3)`
        default:
            return `hsl(0 100% 50% / 0.2)`
    }
}

const colorCache: Record<string, Uint8ClampedArray[]> = {}

const milestoneRgba = (milestone: string, baseHue: number): Uint8ClampedArray => {
    if (colorCache[milestone]?.[baseHue]) return colorCache[milestone][baseHue]
    const lch = milestoneColorInner(milestone, baseHue)
    // Use a canvas to convert the color to RGBA
    // From https://stackoverflow.com/questions/63929820/converting-css-lch-to-rgb
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d", {willReadFrequently: true})
    if (!ctx) return [255, 0, 0, 0] as unknown as Uint8ClampedArray
    ctx.fillStyle = lch
    ctx.fillRect(0, 0, 1, 1)
    const rgbaValues = ctx.getImageData(0, 0, 1, 1).data
    if (!colorCache[milestone]) colorCache[milestone] = []
    colorCache[milestone][baseHue] = rgbaValues
    return rgbaValues
}

const milestoneColor = (milestone: string, baseHue: number, alpha?: number) =>
    rgbaString(milestoneRgba(milestone, baseHue), alpha)

export const rgbaString = (rgba: Uint8ClampedArray, alpha?: number) => `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${(alpha ?? rgba[3]) / 255})`

export const clusterColor = (properties: GeoJSONFeature["properties"], alpha?: number) => {
    const milestone = `${properties?.["M"] ?? "Unknown"}`
    const baseHue = clusterBaseHue(properties)
    return milestoneColor(milestone, baseHue, alpha)
}
