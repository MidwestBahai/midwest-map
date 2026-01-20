import type { Metadata } from "next"
import { PT_Sans } from "next/font/google"
import "./globals.css"
import type React from "react"

const ptSans = PT_Sans({
    weight: ["400", "700"],
    style: ["normal", "italic"],
    subsets: ["latin"],
    display: "swap",
})

export const metadata: Metadata = {
    title: "Midwest Region Map",
    description:
        "Map of Bahá‘í community progress in Ohio, Michigan, and Indiana",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    // Next adds the rest of the head. I'd prefer to use the <Head> component
    // for this stylesheet -- and move it to the map itself -- but it wasn't working:
    // https://nextjs.org/docs/pages/api-reference/components/head
    return (
        <html lang="en">
            <head>
                <link
                    href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css"
                    rel="stylesheet"
                />
            </head>
            <body className={`${ptSans.className} w-screen h-screen`}>
                {children}
            </body>
        </html>
    )
}
