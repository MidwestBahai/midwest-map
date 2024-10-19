import { ClusterGroup } from "../data/clusterGroups"
import { Milestone } from "../data/milestoneLabels"
import { createContext, PropsWithChildren, useCallback, useContext, useState } from "react"

export interface CategoryHighlight {
    clusterGroup?: ClusterGroup
    milestone?: Milestone
}

export interface CategoryHighlightContext {
    categoryHighlight: CategoryHighlight
    setCategoryHighlight: (highlight: CategoryHighlight) => void
    clearCategoryHighlight: () => void
}

const defaultCategoryHighlight: CategoryHighlight = Object.freeze({})

const HighlightContext = createContext<CategoryHighlightContext>({
    categoryHighlight: defaultCategoryHighlight,
    setCategoryHighlight: () => {
        throw new Error("setCategoryHighlight not implemented")
    },
    clearCategoryHighlight: () => {
        throw new Error("clearCategoryHighlight not implemented")
    }
})

export const CategoryHighlightProvider = ({children}: PropsWithChildren<{}>) => {
    const [categoryHighlight, setCategoryHighlight] = useState<CategoryHighlight>({})
    const clearCategoryHighlight = useCallback(() => setCategoryHighlight(defaultCategoryHighlight), [])
    return (
        <HighlightContext.Provider value={{ categoryHighlight, setCategoryHighlight, clearCategoryHighlight }}>
            {children}
        </HighlightContext.Provider>
    )
}

export const useCategoryHighlight = () => useContext(HighlightContext)