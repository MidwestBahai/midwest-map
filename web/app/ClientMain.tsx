"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RegionMap } from "./regionMap"

const queryClient = new QueryClient()

// where I was: put a query client provider here and wrap the map in it
export const ClientMain = ({mapboxAccessToken}: {mapboxAccessToken: string}) => (
    <QueryClientProvider client={queryClient}>
        <RegionMap mapboxAccessToken={mapboxAccessToken} />
    </QueryClientProvider>
)