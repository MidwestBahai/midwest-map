/**
 * Load a value from localStorage.
 * Returns null if not found, on SSR, or on parse error.
 */
export function loadFromStorage<T>(key: string): T | null {
    if (typeof window === "undefined") return null
    try {
        const stored = localStorage.getItem(key)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch {
        // Ignore parse errors
    }
    return null
}

/**
 * Save a value to localStorage.
 * Silently fails on SSR or storage errors.
 */
export function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // Ignore storage errors
    }
}
