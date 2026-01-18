"use client"

import { ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react"
import { useState } from "react"

interface PrintToolbarProps {
    currentDate: Date
    className?: string
}

// Size presets matching the export service
const SIZE_PRESETS = [
    { key: "letter", label: "Letter" },
    { key: "tabloid", label: "Tabloid" },
    { key: "poster", label: "Poster" },
] as const

const EXPORT_SERVICE_URL =
    process.env.NEXT_PUBLIC_EXPORT_SERVICE_URL || "http://localhost:3001"

export function PrintToolbar({
    currentDate,
    className = "",
}: PrintToolbarProps) {
    // Panel starts expanded when navigating to /print
    const [isExpanded, setIsExpanded] = useState(true)
    const [selectedPreset, setSelectedPreset] = useState<string>("poster")
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePrint = () => {
        window.print()
    }

    const handleExportPng = async () => {
        setIsExporting(true)
        setError(null)

        try {
            const response = await fetch(`${EXPORT_SERVICE_URL}/render`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    preset: selectedPreset,
                    date: currentDate.toISOString().split("T")[0],
                }),
            })

            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`)
            }

            // Download the image
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `midwest-map-${currentDate.toISOString().split("T")[0]}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Export error:", err)
            setError(
                err instanceof Error ? err.message : "Failed to export map",
            )
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div
            className={`print-hidden fixed bottom-0 left-0 right-0 z-50 ${className}`}
            style={{
                transform: isExpanded
                    ? "translateY(0)"
                    : "translateY(calc(100% - 40px))",
                transition: "transform 400ms cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
        >
            {/* Panel container */}
            <div className="bg-white border-t border-gray-300 shadow-lg">
                {/* Header bar - always visible, acts as collapsed state */}
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    )}
                </button>

                {/* Expanded content */}
                <div className="px-4 pb-4 space-y-4">
                    {/* Size presets */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Export Size
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {SIZE_PRESETS.map(({ key, label }) => (
                                <button
                                    type="button"
                                    key={key}
                                    onClick={() => setSelectedPreset(key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedPreset === key
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                            <svg
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                            </svg>
                            Print / Save PDF
                        </button>

                        <button
                            type="button"
                            onClick={handleExportPng}
                            disabled={isExporting}
                            className="flex-1 min-w-[140px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download PNG
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Help text */}
                    <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                        Drag legends and title to position them
                    </div>
                </div>
            </div>
        </div>
    )
}
