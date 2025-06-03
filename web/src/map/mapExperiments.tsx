import { useMap } from "@/map/mapContext"
import { useEffect } from "react"

const useZoomListeners = () => {
    const {map} = useMap()
    useEffect(() => {
        const removers: Array<() => void> = []
        if (map) {
            const createListener = (event: string) => {
                const listener = (e: string) => {
                    const zoom = map.getZoom()
                    console.log({event, zoom})
                }
                map.on(event, listener)
                removers.push(() => map.off(event, listener))
            }
            // createListener("zoomstart")
            createListener("zoom")
            createListener("move")
            // createListener("zoomend")
            createListener("touchstart")
            createListener("touchend")
            return () =>
                removers.forEach(remove => remove())
        }
    }, [map])
}

export const MapExperiments = () => {
    // useZoomListeners()
    return null
}