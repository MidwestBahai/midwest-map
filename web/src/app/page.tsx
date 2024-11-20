import { ClientMain } from "@/app/ClientMain"

export default function Home() {
    return (
        <>
            <ClientMain
                mapboxAccessToken={process.env.MAPBOX_TOKEN!}
                debug={Boolean(process.env.DEBUG)}
            />
        </>
    )
}
