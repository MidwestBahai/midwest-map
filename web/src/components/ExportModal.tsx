"use client"

import { useState } from "react"
import { X, Download, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
    currentDate: Date
}

// Size presets matching the export service
const SIZE_PRESETS = [
    { key: "letter", label: "Letter (8.5x11\")", width: 1275, height: 1650 },
    { key: "tabloid", label: "Tabloid (11x17\")", width: 1650, height: 2550 },
    { key: "poster", label: "Poster (24x36\")", width: 3600, height: 5400 },
] as const

const EXPORT_SERVICE_URL = process.env.NEXT_PUBLIC_EXPORT_SERVICE_URL || "http://localhost:3001"

export const ExportModal = ({ isOpen, onClose, currentDate }: ExportModalProps) => {
    const [selectedPreset, setSelectedPreset] = useState<string>("poster")
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Check if viewing historical data
    const today = new Date()
    const daysDiff = Math.abs(today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    const isHistoricalData = daysDiff > 1

    const handleExport = async () => {
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

            onClose()
        } catch (err) {
            console.error("Export error:", err)
            setError(err instanceof Error ? err.message : "Failed to export map")
        } finally {
            setIsExporting(false)
        }
    }

    if (!isOpen) return null

    const previewUrl = `/print?date=${currentDate.toISOString().split("T")[0]}`

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold">Export Map for Print</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Warning for historical data */}
                {isHistoricalData && (
                    <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800">Historical Data</p>
                            <p className="text-sm text-amber-700">
                                You are exporting data from{" "}
                                <strong>
                                    {currentDate.toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </strong>
                                , not the current date.
                            </p>
                        </div>
                    </div>
                )}

                {/* Preview */}
                <div className="flex-1 p-4 overflow-hidden">
                    <div className="bg-gray-100 rounded-lg overflow-hidden h-[400px]">
                        <iframe
                            src={previewUrl}
                            className="w-full h-full border-0"
                            title="Map preview"
                        />
                    </div>
                </div>

                {/* Size selector */}
                <div className="p-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Export Size
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {SIZE_PRESETS.map(({ key, label }) => (
                            <button
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

                {/* Error message */}
                {error && (
                    <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Download PNG
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
