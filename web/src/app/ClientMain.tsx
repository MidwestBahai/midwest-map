"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense, useState } from "react"
import { DebugProvider } from "@/app/DebugContext"
import { FloatingControls } from "@/components/FloatingControls"
import { FullScreenLinkButton } from "@/components/FullScreenLinkButton"
import { CategoryHighlightProvider } from "@/map/categoryHighlightContext"
import { FloatingMapKey } from "@/map/floatingMapKey"
import { RegionMap } from "@/map/regionMap"

const queryClient = new QueryClient()

export const ClientMain = ({
    mapboxAccessToken,
    debug,
}: {
    mapboxAccessToken: string
    debug: boolean
}) => {
    const [showClusters, setShowClusters] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())

    return (
        <DebugProvider debug={debug}>
            <QueryClientProvider client={queryClient}>
                <CategoryHighlightProvider>
                    <RegionMap
                        mapboxAccessToken={mapboxAccessToken}
                        showClusters={showClusters}
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                    />
                    <Suspense>
                        <FullScreenLinkButton />
                    </Suspense>
                    {showClusters && <FloatingMapKey />}
                    <FloatingControls
                        mode="main"
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        showClusters={showClusters}
                        onToggleClusters={() => setShowClusters(!showClusters)}
                    />
                </CategoryHighlightProvider>
            </QueryClientProvider>
        </DebugProvider>
    )
}
