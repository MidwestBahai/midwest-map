import { metadata } from "./layout"

export default function Home() {
    return (
        <>
            <h1 className="text-5xl font-bold">{`${metadata.title}`}</h1>
            <em className="text-3xl">{metadata.description}</em>
        </>
    )
}
