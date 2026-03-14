"use client"

import type { Feature } from "geojson"
import { Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { BBox } from "@/lib/featureBbox"
import { type SearchResult, useSearchIndex } from "@/lib/useSearchIndex"
import { useMap } from "@/map/mapContext"

interface FloatingSearchProps {
    features: Feature[]
}

export const FloatingSearch = ({ features }: FloatingSearchProps) => {
    const { map } = useMap()
    const { search } = useSearchIndex(features)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [open, setOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

    const handleQueryChange = useCallback(
        (value: string) => {
            setQuery(value)
            clearTimeout(debounceRef.current)
            if (!value.trim()) {
                setResults([])
                setSelectedIndex(-1)
                return
            }
            debounceRef.current = setTimeout(() => {
                const r = search(value)
                setResults(r)
                setSelectedIndex(-1)
                setOpen(r.length > 0)
            }, 150)
        },
        [search],
    )

    // Clean up timeout on unmount
    useEffect(() => () => clearTimeout(debounceRef.current), [])

    const flyTo = useCallback(
        (bbox: BBox) => {
            const mapInstance = map?.getMap()
            if (!mapInstance) return
            const isMobile = window.innerWidth < 640
            const padding = isMobile ? 80 : 160
            mapInstance.fitBounds(
                [
                    [bbox[0], bbox[1]],
                    [bbox[2], bbox[3]],
                ],
                { padding, duration: 1500 },
            )
        },
        [map],
    )

    const selectResult = useCallback(
        (result: SearchResult) => {
            flyTo(result.bbox)
            setQuery("")
            setResults([])
            setOpen(false)
            inputRef.current?.blur()
        },
        [flyTo],
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
            } else if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault()
                selectResult(results[selectedIndex])
            } else if (e.key === "Escape") {
                setOpen(false)
                setResults([])
                inputRef.current?.blur()
            }
        },
        [results, selectedIndex, selectResult],
    )

    return (
        <div className="print-hidden fixed top-4 left-4 right-4 z-[60] sm:right-auto sm:w-72">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search clusters or groups..."
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) setOpen(true)
                    }}
                    onBlur={() => {
                        // Delay to allow click on result
                        setTimeout(() => setOpen(false), 200)
                    }}
                    className="w-full rounded-lg bg-white py-2 pl-9 pr-3 shadow-lg outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-400"
                />
            </div>
            {open && results.length > 0 && (
                <ul className="mt-1 max-h-80 overflow-y-auto rounded-lg bg-white shadow-lg ring-1 ring-gray-200">
                    {results.map((r, i) => (
                        <li
                            key={`${r.type}-${r.label}`}
                            onMouseDown={() => selectResult(r)}
                            className={`cursor-pointer px-3 py-2 ${
                                i === selectedIndex
                                    ? "bg-blue-50"
                                    : "hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium uppercase text-gray-400">
                                    {r.type}
                                </span>
                                <span className="whitespace-nowrap font-medium">{r.label}</span>
                                {r.matchContext && (
                                    <span className="text-xs text-blue-500">
                                        {r.matchContext}
                                    </span>
                                )}
                            </div>
                            {r.sublabel && (
                                <div className="text-sm text-gray-500">
                                    {r.sublabel}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
