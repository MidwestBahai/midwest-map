import { WidthHeight } from "./useWindowSize"

interface MapBounds {
    sw: { lat: number, lng: number },
    ne: { lat: number, lng: number },
}

const INITIAL_MAP_BOUNDS = JSON.parse(process.env.NEXT_PUBLIC_MAP_BOUNDS!) as MapBounds

const INITIAL_VIEW = {
    latitude: (INITIAL_MAP_BOUNDS.sw.lat + INITIAL_MAP_BOUNDS.ne.lat) / 2,
    longitude: (INITIAL_MAP_BOUNDS.sw.lng + INITIAL_MAP_BOUNDS.ne.lng) / 2,
    zoom: 6,
}

const computeZoom = (windowSize: WidthHeight): number => {
    // Initial Zoom — subtracting 4 shows all three states; 3.7 cuts off edges a little
    // Overall states shape is 1.37 taller than it is wide, so require more map height when figuring out fit.
    return Math.log2(Math.min(windowSize.width, windowSize.height / 1.37)) - 3.85
}

export const initialBounds = (windowSize?: WidthHeight) => windowSize && ({
    ...INITIAL_VIEW,
    zoom: computeZoom(windowSize),
})