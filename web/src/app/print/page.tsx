import { PrintClient } from "./PrintClient"

export default function PrintPage() {
    return (
        <PrintClient
            mapboxAccessToken={process.env.MAPBOX_TOKEN!}
        />
    )
}
