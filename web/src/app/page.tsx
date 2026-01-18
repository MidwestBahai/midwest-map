import { ClientMain } from "@/app/ClientMain"

export default function Home() {
    const mapboxToken = process.env.MAPBOX_TOKEN
    if (!mapboxToken) {
        throw new Error("MAPBOX_TOKEN environment variable is required")
    }

    return (
        <ClientMain
            mapboxAccessToken={mapboxToken}
            debug={Boolean(process.env.DEBUG)}
        />
    )
}
