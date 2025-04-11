'use client'

import { useSearchParams } from "next/navigation"
import { useButtonThrob } from "./useButtonThrob"

export const FullScreenLinkButton = () => {
    const searchParams = useSearchParams()
    const showFullScreenLink = searchParams.get('showFullScreenLink') === 'true'
    const isFullScreen = !showFullScreenLink
    const showClose = searchParams.get('showClose') === 'true'

    useButtonThrob('full-screen-button', isFullScreen)
    const handleClose = () => {
        if (typeof window !== 'undefined') window.close()
    }

    return (<>
        {showFullScreenLink && (
            <a
                id={'full-screen-button'}
                href={`?showClose=true`}
                target="_blank"
                className="absolute top-0 left-0 m-4 p-2 rounded-lg bg-gray-200 font-bold transition-[border] duration-1000 border-4 shadow-lg hover:shadow-xl hover:border-gray-300 hover:bg-gray-300"
            >
                {isFullScreen ? 'Exit' : 'Full Screen'}
            </a>
        )}
        {showClose && (
            <button
                id={'full-screen-button'}
                className="absolute top-0 left-0 m-4 p-2 rounded-lg bg-gray-200 font-bold border-4 shadow-lg hover:shadow-xl hover:border-gray-300 hover:bg-gray-300"
                onClick={handleClose}
            >
                Exit
            </button>
        )}
    </>)
}