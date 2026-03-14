import type { Feature } from "geojson"
import { useMemo } from "react"
import { clusterCities } from "@/data/clusterCities"
import { clusterCounties } from "@/data/clusterCounties"
import { clusterGroups } from "@/data/clusterGroups"
import { type BBox, combineBboxes, featureBbox } from "./featureBbox"

export interface SearchResult {
    label: string
    sublabel: string
    type: "cluster" | "group"
    bbox: BBox
    /** Explains why this result matched when the match isn't visible in label/sublabel */
    matchContext?: string
}

interface SearchableKey {
    /** Lowercased searchable string */
    term: string
    /** Human-readable context shown when this key matches (empty = no context needed) */
    context: string
}

interface IndexEntry {
    keys: SearchableKey[]
    result: SearchResult
}

export function useSearchIndex(features: Feature[]) {
    const index = useMemo(() => {
        const entries: IndexEntry[] = []

        // Index by group code → member bboxes
        const groupBboxes = new Map<string, BBox[]>()

        for (const f of features) {
            const p = f.properties
            if (!p?.Cluster) continue

            const bbox = featureBbox(f)
            const code = p.Cluster as string
            const name = (p["Cluster Na"] as string) ?? ""
            const group = (p.Group as string) ?? ""
            const cities = clusterCities[code] ?? []
            const counties = clusterCounties[code] ?? []

            const sublabel =
                cities.length > 0 ? cities.join(", ") : name || group
            const visible = `${code} ${sublabel}`.toLowerCase()

            // Context is shown only when the matched term isn't already visible
            const contextFor = (term: string, context: string) =>
                visible.includes(term.toLowerCase()) ? "" : context

            entries.push({
                keys: [
                    { term: code.toLowerCase(), context: "" },
                    ...(name
                        ? [{ term: name.toLowerCase(), context: contextFor(name, `Name: ${name}`) }]
                        : []),
                    ...cities.map((c) => ({
                        term: c.toLowerCase(),
                        context: contextFor(c, c),
                    })),
                    ...counties.map((c) => ({
                        term: c.toLowerCase(),
                        context: contextFor(c, `${c} County`),
                    })),
                ],
                result: {
                    label: code,
                    sublabel,
                    type: "cluster",
                    bbox,
                },
            })

            if (group) {
                let arr = groupBboxes.get(group)
                if (!arr) {
                    arr = []
                    groupBboxes.set(group, arr)
                }
                arr.push(bbox)
            }
        }

        // Add group entries
        for (const [code, info] of Object.entries(clusterGroups)) {
            if (code === "Unknown") continue
            const bboxes = groupBboxes.get(code)
            if (!bboxes?.length) continue

            entries.push({
                keys: [
                    { term: code.toLowerCase(), context: "" },
                    { term: info.displayName.toLowerCase(), context: "" },
                    { term: "group", context: "" },
                ],
                result: {
                    label: info.displayName,
                    sublabel: `${code} group`,
                    type: "group",
                    bbox: combineBboxes(bboxes),
                },
            })
        }

        return entries
    }, [features])

    return useMemo(
        () => ({
            search(query: string): SearchResult[] {
                if (!query.trim()) return []
                const q = query.trim().toLowerCase()

                const prefixMatches: SearchResult[] = []
                const containsMatches: SearchResult[] = []

                for (const entry of index) {
                    let match = entry.keys.find((k) => k.term.startsWith(q))
                    if (match) {
                        prefixMatches.push({ ...entry.result, matchContext: match.context || undefined })
                    } else {
                        match = entry.keys.find((k) => k.term.includes(q))
                        if (match) {
                            containsMatches.push({ ...entry.result, matchContext: match.context || undefined })
                        }
                    }
                }

                // Prefix matches first, then contains, both sorted alphabetically
                prefixMatches.sort((a, b) => a.label.localeCompare(b.label))
                containsMatches.sort((a, b) => a.label.localeCompare(b.label))

                return [...prefixMatches, ...containsMatches].slice(0, 8)
            },
        }),
        [index],
    )
}
