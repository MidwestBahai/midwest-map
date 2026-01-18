"use client"

import { Download } from "lucide-react"

interface ExportButtonProps {
    onClick: () => void
}

export const ExportButton = ({ onClick }: ExportButtonProps) => {
    return (
        <div className="fixed bottom-6 right-42 z-30">
            <button
                className="relative bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                onClick={onClick}
                aria-label="Export map for printing"
                title="Export map for printing"
            >
                <Download className="w-6 h-6 text-gray-700" />
            </button>
        </div>
    )
}
