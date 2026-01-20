import React from "react"

interface DebugContextValue {
    debug: boolean
    initialized: boolean
    showMapGeometry: boolean
    showCollisionBoxes: boolean
    showGeoJsonDetails: boolean
}

const DebugContext = React.createContext<DebugContextValue>({
    debug: false,
    initialized: false,
    showMapGeometry: false,
    showCollisionBoxes: false,
    showGeoJsonDetails: false,
})

export const DebugProvider = ({
    debug,
    children,
}: {
    debug: boolean
    children: React.ReactNode
}) => {
    return (
        <DebugContext.Provider
            value={{
                debug,
                initialized: true,
                showMapGeometry: false,
                showCollisionBoxes: false,
                showGeoJsonDetails: false,
            }}
        >
            {children}
        </DebugContext.Provider>
    )
}

export const useDebug = () => {
    const context = React.useContext(DebugContext)
    if (!context.initialized) {
        throw new Error(
            "DebugContext not initialized; wrap with <DebugProvider>",
        )
    }
    return context
}
