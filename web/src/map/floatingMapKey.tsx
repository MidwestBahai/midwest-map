"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLocalState } from "@/lib/useLocalState"
import { ClusterGroup, clusterGroups } from "@/data/clusterGroups"
import { milestoneColor } from "@/map/clusterColor"
import { Milestone } from "@/data/milestoneLabels"
import { objectEntries, objectKeys } from "ts-extras"

// Remove the "Unknown" cluster group
const displayClusterGroups = objectEntries(clusterGroups)
    .filter(([grouping]) => grouping !== "Unknown")

const displayMilestones: Partial<Record<Milestone, string>> = {
    n: "No Program of Growth",
    e: "Emerging",
    m1: "Milestone 1",
    m2: "Milestone 2",
    m3: "Milestone 3",
    m3r: "Reservoir",
}

export const FloatingMapKey = () => {
    // TODO handle small screen better — maybe start out closed?
    // TODO animate open/close
    const [isOpen, setIsOpen] = useLocalState<boolean>("map-key-open", true)
    const toggleOpen = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen])

    // TODO remove this total hack to force re-rendering of colors
    // useEffect(() => {
    //     const h1 = setTimeout(() => setIsOpen(!isOpen), 100)
    //     const h2 = setTimeout(() => setIsOpen(isOpen), 200)
    //     return () => {
    //         clearTimeout(h1)
    //         clearTimeout(h2)
    //     }
    // }, [])

    return (
        <div className="fixed bottom-4 left-4">
            <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className={`${isOpen ? 'w-72' : 'w-36'} bg-white rounded-lg shadow-lg overflow-hidden transition-width duration-300`}
            >
                <CollapsibleContent className="CollapsibleContent">
                    <div className="m-4 grid gap-1" style={{
                        gridTemplateColumns: 'repeat(7, min-content)',
                    }}>
                        {Object.entries(displayMilestones).map(([milestone, label]) => (
                            <div
                                className="text-sm text-nowrap origin-left -rotate-90 w-2 h-36"
                                style={{ transform: 'rotate(-90deg) translateX(-72px) translateY(74px)'}}
                                key={milestone}>{label}</div>
                        ))}
                        <span/>
                        {displayClusterGroups.map(([group, details]) => (
                            <Fragment key={group}>
                                {objectKeys(displayMilestones).map((milestone) => (
                                    <ColorSwatch key={milestone} milestone={milestone} group={group}/>
                                ))}
                                <span className="text-sm text-nowrap content-center">{details.cities[0]}</span>
                            </Fragment>
                        ))}
                    </div>
                </CollapsibleContent>
                <div className="p-4 bg-gray-100 flex justify-between items-center cursor-pointer" onClick={toggleOpen}>
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

const ColorSwatch = ({milestone, group}: {
    milestone: Milestone
    group: ClusterGroup
}) => {
    // add hover effect
    const [hovered, setHovered] = useState(false)
    return (
        <div
            className='w-6 h-6 rounded'
            style={{backgroundColor: milestoneColor(milestone, clusterGroups[group].baseHue, hovered ? 90 : undefined)}}
            aria-hidden="true"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        />
    )
}
