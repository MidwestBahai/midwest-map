"use client"

import { useEffect } from "react"
import { PAPER_DIMENSIONS } from "./paperDimensions"

/**
 * Injects dynamic <style> for print:
 * 1. @page { size } — tells the browser the paper dimensions
 * 2. @media print { .print-container { zoom } } — scales the on-screen container
 *    to fill the print viewport (paperWidth × 96 CSS px)
 *
 * Without the zoom, the container (e.g. 600px) appears tiny in the print
 * viewport (e.g. 2304px for a 24in-wide poster), because the browser lays
 * out the page at 96 CSS px per inch.
 */
export function usePageSize(
    paperId: string,
    containerWidth?: number,
) {
    useEffect(() => {
        const paper = PAPER_DIMENSIONS[paperId]
        if (!paper) return

        const styleId = "dynamic-page-size"
        let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

        if (!styleEl) {
            styleEl = document.createElement("style")
            styleEl.id = styleId
            document.head.appendChild(styleEl)
        }

        let css = `@page { size: ${paper.width}in ${paper.height}in; margin: 0; }`

        if (containerWidth && containerWidth > 0) {
            const printViewportWidth = paper.width * 96
            const zoom = printViewportWidth / containerWidth
            css += `
@media print {
    .print-container {
        zoom: ${zoom};
    }
}`
        }

        styleEl.textContent = css
    }, [paperId, containerWidth])
}
