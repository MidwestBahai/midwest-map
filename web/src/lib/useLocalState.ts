"use client"

import { type Dispatch, useEffect, useState } from "react"
import type { JsonValue } from "type-fest"

export const useLocalState = <T extends JsonValue>(
    key: string,
    initialValue: T,
): [T, Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        if (typeof localStorage === "undefined") return initialValue // on server
        const stored = localStorage?.getItem(key)
        if (stored) return JSON.parse(stored)
        return initialValue
    })

    const json = JSON.stringify(state)

    useEffect(() => {
        if (typeof localStorage !== "undefined")
            localStorage?.setItem(key, json)
    }, [key, json])

    return [state, setState]
}
