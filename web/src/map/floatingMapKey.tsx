"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLocalState } from "@/lib/useLocalState"
import { ClusterGroup, clusterGroups } from "@/data/clusterGroups"
import { clusterLineColor, milestoneColor } from "@/map/clusterColor"
import { Milestone } from "@/data/milestoneLabels"
import { objectEntries, objectKeys } from "ts-extras"
import { useWindowSize } from "../lib/useWindowSize"
import { useCategoryHighlight } from "./categoryHighlightContext"

// Remove the "Unknown" cluster group
const displayClusterGroups = objectEntries(clusterGroups)
    .filter(([grouping]) => grouping !== "Unknown")

const displayMilestones: Partial<Record<Milestone, string>> = {
    n: "No Program of Growth",
    e: "Emerging",
    m1: "1st Milestone",
    m2: "2nd Milestone",
    m3: "3rd Milestone",
    m3r: "Reservoir",
}

export const FloatingMapKey = () => {
    const windowSize = useWindowSize()
    const { categoryHighlight, setCategoryHighlight, clearCategoryHighlight } = useCategoryHighlight()
    const [initialOpen, setInitialOpen] = useState(false)
    const [isOpen, setIsOpen] = useLocalState<boolean>("map-key-open", true)
    const toggleOpen = useCallback(
        () => {
            setIsOpen(!isOpen)
            // wait for the animation to finish and then clear highlights
            // (a mouseenter can fire, then the element disappears, and the mouseleave never fires)
            if (isOpen) setTimeout(() => clearCategoryHighlight(), 400)
        },
        [clearCategoryHighlight, isOpen, setIsOpen]
    )
    const isReallyOpen = isOpen && initialOpen

    // Run this exactly once, on load. Force colors to be rendered on client rather than pre-rendered
    // during static generation, when Canvas isn't available.
    useEffect(() => {
        // start out closed on mobile
        if (windowSize.width < 640)
            setIsOpen(false)
        setInitialOpen(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="fixed bottom-4 left-4">
            <Collapsible
                open={isReallyOpen}
                onOpenChange={setIsOpen}
                className={`${isReallyOpen ? 'w-72' : 'w-36'} bg-white rounded-lg shadow-lg overflow-hidden transition-width duration-300`}
            >
                <CollapsibleContent className="CollapsibleContent">
                    <div className="m-4 grid" style={{
                        gridTemplateColumns: 'repeat(7, min-content)',
                    }}>
                        {objectEntries(displayMilestones).map(([milestone, label]) => (
                            <div
                                className={`cursor-pointer text-sm text-nowrap origin-left -rotate-90 translate-x-[74px] translate-y-[70px]  w-2 h-36 ${categoryHighlight.milestone === milestone ? 'font-semibold' : ''}`}
                                key={milestone}
                                onMouseEnter={() => setCategoryHighlight({milestone})}
                                onMouseLeave={clearCategoryHighlight}
                            >
                                {label}
                            </div>
                        ))}
                        <span/>
                        {displayClusterGroups.map(([clusterGroup, details]) => (
                            <Fragment key={clusterGroup}>
                                {objectKeys(displayMilestones).map((milestone) => (
                                    <ColorSwatch key={milestone} milestone={milestone} clusterGroup={clusterGroup}/>
                                ))}
                                <span
                                    className={`cursor-pointer text-sm text-nowrap content-center ${categoryHighlight.clusterGroup === clusterGroup ? 'font-semibold' : ''}`}
                                    onMouseEnter={() => setCategoryHighlight({clusterGroup: clusterGroup})}
                                    onMouseLeave={clearCategoryHighlight}
                                >
                                    {details.cities[0]}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                </CollapsibleContent>
                <div
                    className="p-4 bg-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-300 transition-colors duration-200"
                    onClick={toggleOpen}
                >
                    <h2 className="text-lg font-semibold">Map Key</h2>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4"/>
                            ) : (
                                <ChevronDown className="h-4 w-4"/>
                            )}
                            <span className="sr-only">Toggle map key</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>
            </Collapsible>
        </div>
    )
}

const ColorSwatch = ({milestone, clusterGroup}: {
    milestone: Milestone
    clusterGroup: ClusterGroup
}) => {
    // add hover effect
    const { categoryHighlight, setCategoryHighlight, clearCategoryHighlight} = useCategoryHighlight()
    const highlighted =
        // both grouping & milestone are highlighted
        categoryHighlight.milestone === milestone && categoryHighlight.clusterGroup === clusterGroup
        // only a milestone is highlighted
        || categoryHighlight.milestone === milestone && !categoryHighlight.clusterGroup
        // only a grouping is highlighted
        || categoryHighlight.clusterGroup === clusterGroup && !categoryHighlight.milestone
    return (
        <div
            className="w-6 h-6 rounded"
            style={{
                backgroundColor: milestoneColor(milestone, clusterGroups[clusterGroup].baseHue, highlighted ? 90 : undefined),
                border: `3px solid ${highlighted ? milestoneColor(milestone, clusterGroups[clusterGroup].baseHue, 180) : 'white'}`,
            }}
            aria-hidden="true"
            onMouseEnter={() => setCategoryHighlight({milestone, clusterGroup: clusterGroup})}
            onMouseLeave={clearCategoryHighlight}
        />
    )
}
