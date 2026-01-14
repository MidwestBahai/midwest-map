"use client"

interface FloatingLayerToggleProps {
    showClusters: boolean
    onToggle: () => void
}

export const FloatingLayerToggle = ({
    showClusters,
    onToggle,
}: FloatingLayerToggleProps) => {
    return (
        <div className="fixed bottom-6 right-24 z-30">
            <button
                className="relative bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                onClick={onToggle}
                aria-label={showClusters ? "Hide clusters" : "Show clusters"}
                title={showClusters ? "Hide clusters" : "Show clusters"}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700"
                >
                    {showClusters ? (
                        // Layers icon (stacked squares)
                        <>
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                        </>
                    ) : (
                        // Map icon (when clusters hidden)
                        <>
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                            <line x1="8" y1="2" x2="8" y2="18" />
                            <line x1="16" y1="6" x2="16" y2="22" />
                        </>
                    )}
                </svg>
            </button>
        </div>
    )
}
