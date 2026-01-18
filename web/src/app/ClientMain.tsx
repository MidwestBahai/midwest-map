"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RegionMap } from "@/map/regionMap"
import { FloatingMapKey } from "@/map/floatingMapKey"
import { CategoryHighlightProvider } from "@/map/categoryHighlightContext"
import { FullScreenLinkButton } from "@/components/FullScreenLinkButton"
import { FloatingLayerToggle } from "@/components/FloatingLayerToggle"
import { ExportButton } from "@/components/ExportButton"
import { ExportModal } from "@/components/ExportModal"
import { Suspense, useState } from "react"
import { DebugProvider } from "@/app/DebugContext"

const queryClient = new QueryClient()

export const ClientMain = (
    {mapboxAccessToken, debug}: {mapboxAccessToken: string, debug: boolean}
) => {
    const [showClusters, setShowClusters] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [showExportModal, setShowExportModal] = useState(false)

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
                        <FullScreenLinkButton/>
                    </Suspense>
                    <FloatingLayerToggle
                        showClusters={showClusters}
                        onToggle={() => setShowClusters(!showClusters)}
                    />
                    {showClusters && <FloatingMapKey/>}
                    <ExportButton onClick={() => setShowExportModal(true)} />
                    <ExportModal
                        isOpen={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        currentDate={currentDate}
                    />
                </CategoryHighlightProvider>
            </QueryClientProvider>
        </DebugProvider>
    )
}
