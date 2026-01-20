import { PrintClient } from "./PrintClient"

export default function PrintPage() {
    const mapboxToken = process.env.MAPBOX_TOKEN
    if (!mapboxToken) {
        throw new Error("MAPBOX_TOKEN environment variable is required")
    }

    return <PrintClient mapboxAccessToken={mapboxToken} />
}
