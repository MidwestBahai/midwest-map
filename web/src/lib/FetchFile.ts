import * as fs from "node:fs"

/**
 *  A fetch-like function that supports the `file://` protocol.
 * Adapted from loaders.gl polyfills' fetch-node.ts
 */
export async function fetchFile(
    url: string,
    _options?: RequestInit,
): Promise<Response> {
    const FILE_PROTOCOL_REGEX = /^file:\/\//
    // Note: file://... will fetch from current working directory, and file:///... will fetch from / (the filesystem root).
    const path = url.replace(FILE_PROTOCOL_REGEX, "")
    if (path === url)
        throw new Error("fetchFile only supports file:// protocol")
    if (path.endsWith(".gz"))
        throw new Error(
            "this hacked version of fetchFile does not support gzipped files, but loaders.gl does.",
        )

    try {
        // Now open the stream
        const body = await new Promise<fs.ReadStream>((resolve, reject) => {
                const stream = fs.createReadStream(path, { encoding: null })
            stream.once("readable", () => resolve(stream))
            stream.on("error", (error) => reject(error))
        })

        // @ts-expect-error
        const response = new Response(body, {
            headers: getHeadersForFile(path),
            status: 200,
            statusText: "OK",
        })
        Object.defineProperty(response, "url", { value: url })
        return response
    } catch (error) {
        // console.error(error)
        const errorMessage = (error as Error).message
        const status = 400
        const statusText = errorMessage
        const headers = {}
        const response = new Response(errorMessage, {
            headers,
            status,
            statusText,
        })
        Object.defineProperty(response, "url", { value: url })
        return response
    }
}

function getHeadersForFile(path: string): Headers {
    const stats = fs.statSync(path)
    return new Headers({
        "content-length": `${stats.size}`,
    })
}
