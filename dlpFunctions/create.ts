import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as _ from 'lodash';
import { htmlToText } from 'html-to-text';

import { identifyPII, PresidioRes } from '../helpers/presidio';
import { getDefaultItem } from '../helpers/generateItem';
import {
  FieldMapItem,
  WORKITEM_TYPE_FIELD_PATHS,
  WORKITEM_TYPES,
  PROJECT_ID_FIELD_PATH,
  RESOURCE_ID_FIELD_PATHS,
  TARGET_FIELDS
} from '../helpers/field-path-map';
import { DlpStatus, StatusFields } from '../types/AdoWorkItemsDlpStatus';

interface FieldMapRecord {
  startIndex: number | null
  endIndex: number | null
  fieldMapItem: FieldMapItem
  found: boolean
  isString: boolean
  rawValue: string | null
  processedValue: string | null
}

const dynamoDb = new DynamoDB.DocumentClient();

export const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const bodyObj: unknown = JSON.parse(event.body);
 
  // eslint-disable-next-line
  const projectId: string | null = _.get(bodyObj, PROJECT_ID_FIELD_PATH, null) as string | null;
  if (!projectId) {
    throw new Error(`Did not find expected property at path: ${PROJECT_ID_FIELD_PATH.join(', ')}`);
  }

  let resourceId: string | null;
  for (const path of RESOURCE_ID_FIELD_PATHS) {
    // eslint-disable-next-line
    resourceId = _.get(bodyObj, path, null) as string | null;
    if (resourceId) {
      break;
    }
  }
  if (!resourceId) {
    throw new Error(`Did not find expected property at path: ${RESOURCE_ID_FIELD_PATHS.map(path => path.join('.')).join(', ')}`);
  }

  let workItemType: WORKITEM_TYPES | null;
  for (const path of WORKITEM_TYPE_FIELD_PATHS) {
    // eslint-disable-next-line
    workItemType = _.get(bodyObj, path, null) as WORKITEM_TYPES | null;
    if (workItemType) {
      break;
    }
  } 
  if (!workItemType) {
    throw new Error(`Did not find expected property at path: ${WORKITEM_TYPE_FIELD_PATHS.map(path => path.join('.')).join(', ')}`)
  }

  const fieldMap = TARGET_FIELDS[workItemType];
  if (!fieldMap) {
    throw new Error(`Unexpected resource of type ${workItemType}. Accepted values: ${Object.keys(TARGET_FIELDS).join(', ')}.`)
  }

  const records: FieldMapRecord[] = [];
  let recordString = '';

  for (const fieldItem of fieldMap) {
    let fieldValue: string | null = null;
    for (const fieldPath of fieldItem.fieldPaths) {
      // eslint-disable-next-line
      fieldValue = _.get(bodyObj, fieldPath, null) as string | null;
      if (fieldValue) {
        break;
      }
    }
    // eslint-disable-next-line
    if (!fieldValue || !_.isString(fieldValue)) {
      records.push({
        startIndex: null,
        endIndex: null,
        fieldMapItem: fieldItem,
        found: !!fieldValue,
        // eslint-disable-next-line
        isString: _.isString(fieldValue) as boolean,
        rawValue: null,
        processedValue: null
      });
      continue;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const plainTextFieldValue = htmlToText(fieldValue) as string;
    records.push({
      startIndex: recordString.length,
      endIndex: recordString.length + plainTextFieldValue.length + 1,
      fieldMapItem: fieldItem,
      found: true,
      isString: true,
      rawValue: fieldValue,
      processedValue: plainTextFieldValue
    });
    recordString = `${recordString}${plainTextFieldValue}\n`;
  }

  const piiDetailList: PresidioRes = await identifyPII(recordString);

  const item = getDefaultItem(projectId, resourceId);

  // eslint-disable-next-line
  if (_.isNil(piiDetailList)) {
    for (const statusField of Object.values(StatusFields)) {
      item[statusField].status = DlpStatus.NO_ISSUES;
      item[statusField].issues = [];
    }
    item.dlpStatus = DlpStatus.NO_ISSUES;

    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: item
    }
    await dynamoDb.put(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'OK'})
    }
  }

  for (const piiDetail of piiDetailList) {
    const startIdx = piiDetail.start;
    for (const recordItem of records) {
      if (!recordItem.isString || !recordItem.found) {
        continue;
      }
      if (recordItem.startIndex <= startIdx && startIdx < recordItem.endIndex) {
        const piiMatch = recordString.slice(piiDetail.start, piiDetail.end);
        item[recordItem.fieldMapItem.dbField].status = DlpStatus.ISSUES_FOUND;
        item[recordItem.fieldMapItem.dbField].issues.push({
          text: piiMatch,
          score: piiDetail.score
        })
        break;
      }
    }
  }

  for (const statusField of Object.values(StatusFields)) {
    if (item[statusField].status === DlpStatus.UNSCANNED) {
      item[statusField].status = DlpStatus.NO_ISSUES;
      item[statusField].issues = [];
    }
  }

  let dlpStatus = DlpStatus.NO_ISSUES;
  for (const statusField of Object.values(StatusFields)) {
    if (item[statusField].status === DlpStatus.ISSUES_FOUND) {
      dlpStatus = DlpStatus.ISSUES_FOUND;
      break;
    }
  }
  item.dlpStatus = dlpStatus;

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: item
  }

  await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'OK'})
  }
}