import { metadata } from "./layout"
import { RegionMap } from "./regionMap"

export default function Home() {
    return (
        <>
            <RegionMap mapboxAccessToken={process.env.MAPBOX_TOKEN!}/>
            <h1 className="text-5xl font-bold">{`${metadata.title}`}</h1>
            <em className="text-3xl">{metadata.description}</em>
        </>
    )
}
