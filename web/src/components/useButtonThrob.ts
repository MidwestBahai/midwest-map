import { useEffect } from "react"

// add a periodic blue border glow to a button to call attention to it
export const useButtonThrob = (elementId: string, isFullScreen: boolean = false) => {
    useEffect(() => {
        const interval = setInterval(() => {
            const button = document.querySelector(`#${elementId}`)
            if (button) {
                if (isFullScreen) button.classList.remove('border-blue-300')
                else button.classList.toggle('border-blue-300')
            }
        }, 4000)
        return () => clearInterval(interval)
    }, [elementId, isFullScreen])
}