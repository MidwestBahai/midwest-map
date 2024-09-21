import { ClientMain } from "./ClientMain"

export default function Home() {
    return (
        <>
            {/*<h1 className="text-5xl font-bold">{`${metadata.title}`}</h1>*/}
            {/*<em className="text-3xl">{metadata.description}</em>*/}
            <ClientMain
                mapboxAccessToken={process.env.MAPBOX_TOKEN!}
                debug={Boolean(process.env.DEBUG)}
            />
        </>
    )
}
