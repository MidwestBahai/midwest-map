"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RegionMap } from "@/map/regionMap"
import { FloatingMapKey } from "@/map/floatingMapKey"
import { CategoryHighlightProvider } from "@/map/categoryHighlightContext"
import { FullScreenLinkButton } from "@/components/FullScreenLinkButton"
import { FloatingLayerToggle } from "@/components/FloatingLayerToggle"
import { Suspense, useState } from "react"
import { DebugProvider } from "@/app/DebugContext"

const queryClient = new QueryClient()

export const ClientMain = (
    {mapboxAccessToken, debug}: {mapboxAccessToken: string, debug: boolean}
) => {
    const [showClusters, setShowClusters] = useState(true)

    return (
        <DebugProvider debug={debug}>
            <QueryClientProvider client={queryClient}>
                <CategoryHighlightProvider>
                    <RegionMap mapboxAccessToken={mapboxAccessToken} showClusters={showClusters}/>
                    <Suspense>
                        <FullScreenLinkButton/>
                    </Suspense>
                    <FloatingLayerToggle
                        showClusters={showClusters}
                        onToggle={() => setShowClusters(!showClusters)}
                    />
                    {showClusters && <FloatingMapKey/>}
                </CategoryHighlightProvider>
            </QueryClientProvider>
        </DebugProvider>
    )
}
