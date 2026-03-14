export interface PaperDimension {
    width: number // inches
    height: number // inches
    label: string
}

export const PAPER_DIMENSIONS: Record<string, PaperDimension> = {
    letter: { width: 8.5, height: 11, label: "Letter" },
    "letter-landscape": { width: 11, height: 8.5, label: "Letter Landscape" },
    tabloid: { width: 11, height: 17, label: "Tabloid" },
    "tabloid-landscape": { width: 17, height: 11, label: "Tabloid Landscape" },
    a4: { width: 8.27, height: 11.69, label: "A4" },
    "a4-landscape": { width: 11.69, height: 8.27, label: "A4 Landscape" },
    "poster-18x24": { width: 18, height: 24, label: "Poster 18×24" },
    "poster-24x36": { width: 24, height: 36, label: "Poster 24×36" },
}

export const PAPER_OPTIONS = Object.entries(PAPER_DIMENSIONS).map(
    ([key, { label }]) => ({ key, label }),
)

/** Height in px reserved for the collapsed toolbar header */
const TOOLBAR_RESERVE_PX = 40

/** Padding in px between the container and the viewport edges */
const CONTAINER_PADDING_PX = 16

/**
 * Calculate the print container dimensions to fit a paper's aspect ratio
 * within the available viewport space (above the collapsed toolbar).
 */
export function calculateContainerSize(
    viewportWidth: number,
    viewportHeight: number,
    paperId: string,
): { width: number; height: number } {
    const paper = PAPER_DIMENSIONS[paperId]
    if (!paper) return { width: viewportWidth, height: viewportHeight }

    const availableWidth = viewportWidth - CONTAINER_PADDING_PX * 2
    const availableHeight =
        viewportHeight - TOOLBAR_RESERVE_PX - CONTAINER_PADDING_PX * 2
    const paperAspect = paper.width / paper.height

    if (availableWidth / availableHeight > paperAspect) {
        // Available space is wider than paper — constrain by height
        const height = availableHeight
        const width = height * paperAspect
        return { width: Math.round(width), height: Math.round(height) }
    } else {
        // Available space is taller than paper — constrain by width
        const width = availableWidth
        const height = width / paperAspect
        return { width: Math.round(width), height: Math.round(height) }
    }
}
