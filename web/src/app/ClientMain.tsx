"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RegionMap } from "@/map/regionMap"
import { FloatingMapKey } from "@/map/floatingMapKey"
import { CategoryHighlightProvider } from "@/map/categoryHighlightContext"
import { FullScreenLinkButton } from "@/components/FullScreenLinkButton"
// import { TimelineControl } from "@/components/TimelineControl"
import { Suspense } from "react"
import { DebugProvider } from "@/app/DebugContext"

const queryClient = new QueryClient()

export const ClientMain = (
    {mapboxAccessToken, debug}: {mapboxAccessToken: string, debug: boolean}
) => {
    // const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1))
    
    return (
        <DebugProvider debug={debug}>
            <QueryClientProvider client={queryClient}>
                <CategoryHighlightProvider>
                    <RegionMap mapboxAccessToken={mapboxAccessToken}/>
                    <Suspense>
                        <FullScreenLinkButton/>
                    </Suspense>
                    <FloatingMapKey/>
                    {/* <TimelineControl
                        startDate={new Date(2011, 0, 1)}
                        endDate={new Date(2025, 11, 31)}
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        milestoneEvents={[
                            { date: new Date(2014, 5, 15), label: "Major milestone" },
                            { date: new Date(2018, 2, 10), label: "Another event" },
                            { date: new Date(2021, 8, 20), label: "Recent update" },
                        ]}
                    /> */}
                </CategoryHighlightProvider>
            </QueryClientProvider>
        </DebugProvider>
    )
}
