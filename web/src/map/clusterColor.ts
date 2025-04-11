"use client" // canvas, which we use to compute colors, only exists on the browser

import { clusterGroups, getClusterGroup } from "@/data/clusterGroups"
import { GeoJsonProperties } from "geojson"

const clusterBaseHue = (properties: GeoJsonProperties) =>
    clusterGroups[getClusterGroup(properties)].baseHue

const alpha = .5

const milestoneColorInner = (milestone: string, baseHue: number) => {
    switch (milestone.toLowerCase()) {
        case "m3r":
        case "m2r":
            // alpha: make it less transparent
            return `oklch(.2 .35 ${baseHue} / ${1 - .6 * (1 - alpha)})`
        case "m3":
            return `oklch(.2 .35 ${baseHue} / ${1 - .8 * (1 - alpha)})`
        case "m2":
            return `oklch(.4 .35 ${baseHue} / ${alpha})`
        case "m1":
            return `oklch(.7 .21 ${baseHue} / ${alpha})`
        case "e":
        case "m0":
            return `oklch(.8 .12 ${baseHue} / ${alpha})`
        case "n":
            return `oklch(.9 .07 ${baseHue} / ${alpha})`
        default:
            return `hsl(0 100% 50% / 0.2)`
    }
}

const colorCache: Record<string, Uint8ClampedArray[]> = {}

const milestoneRgba = (milestone: string, baseHue: number): Uint8ClampedArray => {
    if (typeof document === 'undefined') return [255, 0, 0, 0] as unknown as Uint8ClampedArray
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

export const milestoneColor = (milestone: string, baseHue: number, alpha?: number) =>
    rgbaString(milestoneRgba(milestone, baseHue), alpha)

export const rgbaString = (rgba: Uint8ClampedArray, alpha?: number) => `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${(alpha ?? rgba[3]) / 255})`

export const clusterFillColor = (properties: GeoJsonProperties, highlighted: boolean) =>
    clusterColor(properties, highlighted ? 90 : undefined)

export const clusterLineColor = (properties: GeoJsonProperties, highlighted: boolean) =>
    clusterColor(properties, highlighted ? 180 : undefined)

export const clusterColor = (properties: GeoJsonProperties, alpha?: number) => {
    const baseHue = clusterBaseHue(properties)
    return milestoneColor(milestone(properties), baseHue, alpha)
}

const milestone = (properties: GeoJsonProperties) => `${properties?.["M"] ?? "Unknown"}`

export const clusterLabelColor = (properties: GeoJsonProperties, highlighted: boolean) => {
    switch (milestone(properties).toLowerCase()) {
        case "m3r":
        case "m2r":
        case "m3":
            return highlighted ? "black" : "white"
        case "m2":
        case "m1":
        case "e":
        case "m0":
        case "n":
        default:
            return "black"
    }
}