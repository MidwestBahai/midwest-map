"use client"

import { useEffect, useState } from "react"

export interface WidthHeight {
    width: number
    height: number
}

const getSize = (): WidthHeight => ({
    width: window.innerWidth,
    height: window.innerHeight,
})

export const useWindowSize = (): WidthHeight => {
    // On the server, window is undefined.
    // See this thread for discussion: https://www.reddit.com/r/nextjs/comments/1bhfikg/window_is_not_defined_error_in_nextjs_14_app/
    const [size, setSize] = useState<WidthHeight>(typeof window === 'object' ? getSize() : {width: 0, height: 0})

    useEffect(() => {
        const handleSize = () => setSize(getSize())
        handleSize() // initial size
        window.addEventListener('resize', handleSize)
        return () => window.removeEventListener('resize', handleSize)
    }, [])

    return size
}
