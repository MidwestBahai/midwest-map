import React from "react"

interface DebugContextValue {
    debug: boolean
    initialized: boolean
}

const DebugContext = React.createContext<DebugContextValue>({
    debug: false,
    initialized: false,
})

export const DebugProvider = ({
    debug,
    children,
}: {
    debug: boolean
    children: React.ReactNode
}) => {
    return (
        <DebugContext.Provider value={{ debug, initialized: true }}>
            {children}
        </DebugContext.Provider>
    )
}

export const useDebug = () => {
    const context = React.useContext(DebugContext)
    if (!context.initialized) {
        throw new Error("DebugContext not initialized; wrap with <DebugProvider>")
    }
    return context
}