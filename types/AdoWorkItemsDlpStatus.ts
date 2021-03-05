// TYPES
export enum DlpStatus {
  UNSCANNED = 'UNSCANNED',
  NO_ISSUES = 'NO_ISSUES',
  ISSUES_FOUND = 'ISSUES_FOUND',
  OVERRIDE = 'OVERRIDE'
}

export enum StatusFields {
  Title = 'titleStatus',
  Details = 'detailsStatus',
  AcceptanceCriteria = 'acceptanceCriteriaStatus',
  ReproductionSteps = 'reproductionStepsStatus',
  Description = 'descriptionStatus',
  SystemInfo = 'systemInfoStatus',
  Analysis = 'analysisStatus'
}

interface IStatusField {
  status: DlpStatus
  issues: Array<{
    score: number
    text: string
  }>
}

export interface DlpStatusItem {
  projectId: string
  resourceId: string
  dlpStatus: DlpStatus
  [StatusFields.Title]: IStatusField
  [StatusFields.Details]: IStatusField
  [StatusFields.AcceptanceCriteria]: IStatusField
  [StatusFields.ReproductionSteps]: IStatusField
  [StatusFields.Description]: IStatusField
  [StatusFields.SystemInfo]: IStatusField
  [StatusFields.Analysis]: IStatusField
}