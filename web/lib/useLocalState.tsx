import { JsonValue } from "type-fest"
import * as React from "react"

export const useLocalState = <T extends JsonValue>(
    key: string,
    initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = React.useState<T>(() => {
        const stored = localStorage.getItem(key)
        if (stored) return JSON.parse(stored)
        return initialValue
    })

    const json = JSON.stringify(state)

    React.useEffect(() => {
        localStorage.setItem(key, json)
    }, [key, json])

    return [state, setState]
}