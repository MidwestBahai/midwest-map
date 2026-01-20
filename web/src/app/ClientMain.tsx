"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { DebugProvider } from "@/app/DebugContext"
import { FloatingControls } from "@/components/FloatingControls"
import { FullScreenLinkButton } from "@/components/FullScreenLinkButton"
import { CategoryHighlightProvider } from "@/map/categoryHighlightContext"
import { FloatingMapKey } from "@/map/floatingMapKey"
import { RegionMap } from "@/map/regionMap"

const queryClient = new QueryClient()

function ClientMainInner({
    mapboxAccessToken,
    debug,
}: {
    mapboxAccessToken: string
    debug: boolean
}) {
    const searchParams = useSearchParams()

    // Parse date from URL query param, default to today
    const dateParam = searchParams.get("date")
    const initialDate = dateParam ? new Date(dateParam) : new Date()
    const isValidDate = !Number.isNaN(initialDate.getTime())

    const [showClusters, setShowClusters] = useState(true)
    const [currentDate, setCurrentDate] = useState<Date>(
        isValidDate ? initialDate : new Date(),
    )

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
                        initialTimelineOpen={Boolean(dateParam && isValidDate)}
                    />
                </CategoryHighlightProvider>
            </QueryClientProvider>
        </DebugProvider>
    )
}

export const ClientMain = ({
    mapboxAccessToken,
    debug,
}: {
    mapboxAccessToken: string
    debug: boolean
}) => {
    return (
        <Suspense>
            <ClientMainInner
                mapboxAccessToken={mapboxAccessToken}
                debug={debug}
            />
        </Suspense>
    )
}
