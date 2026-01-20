import { useEffect } from "react"
import { useMap } from "@/map/mapContext"

const _useZoomListeners = () => {
    const { map } = useMap()
    useEffect(() => {
        const removers: Array<() => void> = []
        if (map) {
            const createListener = (event: string) => {
                const listener = (_e: string) => {
                    const zoom = map.getZoom()
                    console.log({ event, zoom })
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
            return () => {
                for (const remove of removers) {
                    remove()
                }
            }
        }
    }, [map])
}

export const MapExperiments = () => {
    // useZoomListeners()
    return null
}
