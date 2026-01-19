/**
 * Options controlling what information is displayed in cluster labels
 */
export interface LabelOptions {
    showCode: boolean // Cluster code like "IN-01"
    showMilestone: boolean // Milestone like "M3"
    showName: boolean // Cluster name like "Franklin County"
    showDate: boolean // Advancement date like "Jan 2017"
}

export const DEFAULT_LABEL_OPTIONS: LabelOptions = {
    showCode: true,
    showMilestone: true,
    showName: false,
    showDate: false,
}
