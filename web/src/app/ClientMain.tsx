"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RegionMap } from "@/map/regionMap"
import { FloatingMapKey } from "@/map/floatingMapKey"
import { CategoryHighlightProvider } from "@/map/categoryHighlightContext"
import { FullScreenLinkButton } from "@/components/FullScreenLinkButton"
import { Suspense } from "react"

const queryClient = new QueryClient()

export const ClientMain = (
    {mapboxAccessToken, debug}: {mapboxAccessToken: string, debug: boolean}
) => {
    return (
        <QueryClientProvider client={queryClient}>
            <CategoryHighlightProvider>
                <RegionMap
                    mapboxAccessToken={mapboxAccessToken}
                    debug={debug}
                />
                <Suspense>
                    <FullScreenLinkButton/>
                </Suspense>
                <FloatingMapKey/>
            </CategoryHighlightProvider>
        </QueryClientProvider>
    )
}
