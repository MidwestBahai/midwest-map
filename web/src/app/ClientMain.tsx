"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RegionMap } from "@/map/regionMap"
import { FloatingMapKey } from "@/map/floatingMapKey"

const queryClient = new QueryClient()

// where I was: put a query client provider here and wrap the map in it
export const ClientMain = (
    {mapboxAccessToken, debug}: {mapboxAccessToken: string, debug: boolean}
) => (
    <QueryClientProvider client={queryClient}>
        <RegionMap
            mapboxAccessToken={mapboxAccessToken}
            debug={debug}
        />
        <FloatingMapKey/>
    </QueryClientProvider>
)