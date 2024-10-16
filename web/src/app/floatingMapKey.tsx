"use client"

import * as React from "react"
import { useCallback } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLocalState } from "@/lib/useLocalState"
import { ClusterGroup, clusterGroups } from "@/data/clusterGroups"
import { milestoneColor } from "./clusterColor"
import { Milestone } from "../data/milestoneLabels"
import { objectEntries, objectKeys } from "ts-extras"

// Remove the "Unknown" cluster group
const displayClusterGroups = objectEntries(clusterGroups)
    .filter(([grouping]) => grouping !== "Unknown")

const displayMilestones: Partial<Record<Milestone, string>> = {
    m3r: "Reservoir",
    m3: "Milestone 3",
    m2: "Milestone 2",
    m1: "Milestone 1",
    e: "Emerging",
    n: "No Program of Growth",
}

export const FloatingMapKey = () => {
    // TODO handle small screen better — maybe start out closed?
    // TODO animate open/close
    const [isOpen, setIsOpen] = useLocalState<boolean>("map-key-open", true)
    const toggleOpen = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen])

    return (
        <div className="fixed bottom-4 left-4">
            <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className={`${isOpen ? 'w-72' : 'w-40'} bg-white rounded-lg shadow-lg overflow-hidden transition-width duration-300`}
            >
                <div className="p-4 bg-gray-100 flex justify-between items-center" onClick={toggleOpen}>
                    <h2 className="text-lg font-semibold">Map Key</h2>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronUp className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle map key</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <div className="m-4 grid gap-1" style={{
                        gridTemplateColumns: 'repeat(7, min-content)',
                    }}>
                        {displayClusterGroups.map(([group, details]) => (
                            <>
                                {objectKeys(displayMilestones).map((milestone) => (
                                    <ColorSwatch key={milestone} milestone={milestone} group={group} />
                                ))}
                                <span className="text-sm text-nowrap content-center">{details.cities[0]}</span>
                            </>
                        ))}
                        {Object.entries(displayMilestones).map(([milestone, label]) => (
                            <div className="text-sm text-nowrap origin-center rotate-90 -translate-x-14 -translate-y-16 w-2 h-36" key={milestone}>{label}</div>
                        ))}
                        <span/>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}

const ColorSwatch = ({milestone, group}: {
    milestone: Milestone
    group: ClusterGroup
}) => {
    // add hover effect

    return (
        <div
            className='w-6 h-6 rounded'
            style={{backgroundColor: milestoneColor(milestone, clusterGroups[group].baseHue)}}
            aria-hidden="true"
        />
    )
}
