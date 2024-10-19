export const milestoneLabels = {
    m3: "M3",
    m3r: "M3, Reservoir",
    m2r: "M2, Reservoir",
    m2: "M2",
    m1: "M1",
    m0: "Emerging",
    e: "Emerging",
    n: "No Program of Growth",
}

export const reservoirs = ["m3r", "m2r"]

export const isReservoir = (milestone: string) => reservoirs.includes(milestone)

export const matchesIncludingReservoir = (a?: string, b?: string) =>
    a && b && (
        a === b || (isReservoir(a) && isReservoir(b))
    )

export type Milestone = keyof typeof milestoneLabels