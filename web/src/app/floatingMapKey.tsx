"use client"

import * as React from "react"
import { useCallback } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLocalState } from "../lib/useLocalState"

type ColorSwatch = {
    color: string
    label: string
}

const colorSwatches: ColorSwatch[] = [
    { color: "bg-red-500", label: "High Risk" },
    { color: "bg-yellow-500", label: "Medium Risk" },
    { color: "bg-green-500", label: "Low Risk" },
    { color: "bg-blue-500", label: "Water Body" },
    { color: "bg-gray-500", label: "Urban Area" },
    { color: "bg-purple-500", label: "Protected Land" },
]

export default function FloatingMapKey() {
    const [isOpen, setIsOpen] = useLocalState<boolean>("map-key-open", true)
    const toggleOpen = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen])

    return (
        <div className="fixed bottom-4 left-4">
            <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-64 bg-white rounded-lg shadow-lg overflow-hidden"
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
                    <div className="p-4 grid grid-cols-2 gap-4">
                        {colorSwatches.map((swatch) => (
                            <div key={swatch.label} className="flex items-center space-x-2">
                                <div
                                    className={`w-6 h-6 rounded ${swatch.color}`}
                                    aria-hidden="true"
                                />
                                <span className="text-sm">{swatch.label}</span>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}
