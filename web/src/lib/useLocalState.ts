"use client"

import { JsonValue } from "type-fest"
import { Dispatch, useEffect, useState } from "react"

export const useLocalState = <T extends JsonValue>(
    key: string,
    initialValue: T
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