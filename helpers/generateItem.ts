import { DlpStatus, DlpStatusItem, StatusFields } from '../types/AdoWorkItemsDlpStatus';

export const getDefaultItem = (projectId: string, resourceId: string | number): DlpStatusItem => {

  if (typeof resourceId === 'number') {
    resourceId = resourceId.toString();
  }

  const unscannedFields = {};

  for (const field of Object.values(StatusFields)) {
    unscannedFields[field] = {
      status: DlpStatus.UNSCANNED,
      issues: []
    }
  }

  const newItem = {
    projectId,
    resourceId,
    dlpStatus: DlpStatus.UNSCANNED,
    ...unscannedFields
  }

  return newItem as DlpStatusItem;
}