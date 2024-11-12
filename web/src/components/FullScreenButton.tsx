import { useEffect, useState } from "react"

export const FullScreenButton = () => {
    // Entering full screen mode requires the attribute allow="fullscreen" on the iframe element.
    const [fullScreen, setFullScreen] = useState(false)

    const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null)
    useEffect(() => {
        // inside useEffect to avoid SSR
        const iframe = window.parent.document.querySelector('iframe')
        if (iframe) {
            setIframe(iframe)
        }
    }, [])

    // add a periodic blue border glow to the Full Screen button to call attention to it
    useEffect(() => {
        const interval = setInterval(() => {
            const button = document.querySelector('#full-screen-button')
            if (button) {
                if (fullScreen) button.classList.remove('border-blue-300')
                else button.classList.toggle('border-blue-300')
            }
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    return (<>
        {iframe && !fullScreen && (
            <button
                id={'full-screen-button'}
                onClick={() => {
                    iframe.requestFullscreen()
                    setFullScreen(true)
                }}
                className="absolute top-0 left-0 m-4 p-2 rounded-lg bg-gray-200 font-bold transition-[border] duration-1000 border-4 shadow-lg hover:shadow-xl hover:border-gray-300 hover:bg-gray-300"
            >
                {fullScreen ? 'Exit' : 'Full Screen'}
            </button>
        )}
        {iframe && fullScreen && (
            <button
                id={'full-screen-button'}
                onClick={() => {
                    window.parent.document.exitFullscreen()
                    setFullScreen(false)
                }}
                className="absolute top-0 left-0 m-4 p-2 rounded-lg bg-gray-200 font-bold border-4 shadow-lg hover:shadow-xl hover:border-gray-300 hover:bg-gray-300"
            >
                Exit
            </button>
        )}
    </>)
}