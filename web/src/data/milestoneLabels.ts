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

export type Milestone = keyof typeof milestoneLabels