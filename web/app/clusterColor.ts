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
        case "e":
            return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l - 0.2) a b / 0.3)`
        case "n":
            return `oklab(from hsl(${baseHue}, 100%, 50%) calc(l - 0.2) a b / 0.3)`
        default:
            return "#f00"
    }
}

const colorCache: Record<string, string[]> = {}

const milestoneColor = (milestone: string, baseHue: number = 45) => {
    if (colorCache[milestone]?.[baseHue]) return colorCache[milestone][baseHue]
    const lch = milestoneColorInner(milestone, baseHue)
    // Use a canvas to convert the color to RGBA
    // From https://stackoverflow.com/questions/63929820/converting-css-lch-to-rgb
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d", {willReadFrequently: true})
    if (!ctx) return "#ff0"
    ctx.fillStyle = lch
    ctx.fillRect(0, 0, 1, 1)
    const rgbaValues = ctx.getImageData(0, 0, 1, 1).data
    const rgbaString = `rgba(${rgbaValues[0]}, ${rgbaValues[1]}, ${rgbaValues[2]}, ${rgbaValues[3] / 255})`
    if (!colorCache[milestone]) colorCache[milestone] = []
    colorCache[milestone][baseHue] = rgbaString
    return rgbaString
}

export const clusterColor = (properties: GeoJSONFeature["properties"]) => {
    const milestone = `${properties?.["M"] ?? "Unknown"}`
    const baseHue = clusterBaseHue(properties)
    return milestoneColor(milestone, baseHue)
}
