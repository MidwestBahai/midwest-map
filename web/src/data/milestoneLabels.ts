export const milestoneLabels = {
    m3: "3rd Milestone",
    m3r: "3rd Milestone, Reservoir",
    m2r: "2nd Milestone, Reservoir",
    m2: "2nd Milestone",
    m1: "1st Milestone",
    m0: "Emerging",
    e: "Emerging",
    n: "No Program of Growth",
}

export const reservoirs = ["m3r", "m2r"]

export const isReservoir = (milestone: string) => reservoirs.includes(milestone)

/** Does cluster milestone `a` match highlighted milestone `b`?
 *  Reservoir clusters match both their base milestone and the reservoir category. */
export const matchesIncludingReservoir = (a?: string, b?: string) =>
    a &&
    b &&
    (a === b ||
        (isReservoir(a) && (isReservoir(b) || a.replace("r", "") === b)))

export type Milestone = keyof typeof milestoneLabels
