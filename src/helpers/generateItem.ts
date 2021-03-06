import { DlpStatus, DlpStatusItem, StatusFields } from '../types/AdoWorkItemsDlpStatus';

/**
 * Returns an unscanned DlpStatusItem,
 * used as a base item before dlp scanning and
 * returned when database does not find an item.
 * @param projectId The project ID of the item
 * @param resourceId The resource ID of the item
 */
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