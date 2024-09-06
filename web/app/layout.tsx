import type { Metadata } from "next"
import { PT_Sans } from "next/font/google"
import "./globals.css"
import React from "react"
import ReactMapGl, {ViewState as MapViewState} from "react-map-gl"

const ptSans = PT_Sans({
    weight: ['400', '700'],
    style: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap',
})

export const metadata: Metadata = {
    title: "Midwest Region Map",
    description: "Map of Bahá‘í community progress in Ohio, Michigan, and Indiana",
}

export default function RootLayout({children}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className={`${ptSans.className} w-screen h-screen`}>
        {children}
        </body>
        </html>
    )
}
