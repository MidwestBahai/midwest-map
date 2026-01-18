import express, { Request, Response } from "express"
import puppeteer, { Browser, Page } from "puppeteer"

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3001
const WEB_URL = process.env.WEB_URL || "http://localhost:3000"

// Size presets
const SIZE_PRESETS: Record<string, { width: number; height: number }> = {
    letter: { width: 1275, height: 1650 },      // 8.5x11" at 150 DPI
    tabloid: { width: 1650, height: 2550 },     // 11x17" at 150 DPI
    poster: { width: 3600, height: 5400 },      // 24x36" at 150 DPI
    "poster-hd": { width: 7200, height: 10800 }, // 24x36" at 300 DPI
}

// Reusable browser instance
let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
    if (!browser) {
        console.log("Launching browser...")
        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                // Allow large canvas sizes
                "--disable-gpu-sandbox",
            ],
        })
        console.log("Browser launched")
    }
    return browser
}

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", webUrl: WEB_URL })
})

// Render endpoint
interface RenderRequest {
    url?: string
    date?: string
    width?: number
    height?: number
    preset?: string
    waitForSelector?: string
    waitTimeout?: number
}

app.post("/render", async (req: Request, res: Response) => {
    const {
        url,
        date,
        width,
        height,
        preset = "poster",
        waitForSelector = ".map-loaded",
        waitTimeout = 60000,
    } = req.body as RenderRequest

    // Build URL
    const targetUrl = url || `${WEB_URL}/print${date ? `?date=${date}` : ""}`

    // Get dimensions from preset or explicit values
    const presetDims = SIZE_PRESETS[preset] || SIZE_PRESETS.poster
    const finalWidth = width || presetDims.width
    const finalHeight = height || presetDims.height

    console.log(`Rendering ${targetUrl} at ${finalWidth}x${finalHeight}`)

    let page: Page | null = null

    try {
        const browserInstance = await getBrowser()
        page = await browserInstance.newPage()

        // Set viewport to requested dimensions
        await page.setViewport({
            width: finalWidth,
            height: finalHeight,
            deviceScaleFactor: 1,
        })

        // Navigate to the page
        await page.goto(targetUrl, {
            waitUntil: "networkidle0",
            timeout: waitTimeout,
        })

        // Wait for the map to be loaded (indicated by CSS class)
        if (waitForSelector) {
            console.log(`Waiting for selector: ${waitForSelector}`)
            await page.waitForSelector(waitForSelector, { timeout: waitTimeout })
        }

        // Additional wait for tiles to finish loading
        await page.waitForFunction(
            () => {
                // Check if Mapbox map is fully loaded
                const mapElement = document.querySelector(".mapboxgl-map")
                if (!mapElement) return false
                // Check for loading indicators
                const loading = document.querySelector(".mapboxgl-ctrl-loading")
                return !loading
            },
            { timeout: waitTimeout }
        )

        // Small additional delay for final rendering
        await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log("Taking screenshot...")
        const screenshot = await page.screenshot({
            type: "png",
            fullPage: false,
            encoding: "binary",
        })

        console.log(`Screenshot taken: ${screenshot.length} bytes`)

        res.set("Content-Type", "image/png")
        res.set("Content-Disposition", `attachment; filename="midwest-map-${date || "current"}.png"`)
        res.send(screenshot)
    } catch (error) {
        console.error("Render error:", error)
        res.status(500).json({
            error: "Failed to render map",
            message: error instanceof Error ? error.message : "Unknown error",
        })
    } finally {
        if (page) {
            await page.close()
        }
    }
})

// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("Shutting down...")
    if (browser) {
        await browser.close()
    }
    process.exit(0)
})

app.listen(PORT, () => {
    console.log(`Export service listening on port ${PORT}`)
    console.log(`Web app URL: ${WEB_URL}`)
    console.log("Available presets:", Object.keys(SIZE_PRESETS).join(", "))
})
