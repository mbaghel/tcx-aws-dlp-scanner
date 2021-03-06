import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import _ from 'lodash';
import { htmlToText } from 'html-to-text';

import { createResponse } from '../helpers/createResponse';
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
import { WrapHandler } from '../helpers/genericErrorHandler';

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

const createHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const bodyObj: unknown = JSON.parse(event.body);

  let projectId: string;
  let resourceId: string | number;
  let workItemType: WORKITEM_TYPES;
  let fieldMap: FieldMapItem[];
  try {
    projectId = _.get(bodyObj, PROJECT_ID_FIELD_PATH, null) as string;
    if (!projectId) {
      throw new Error(`Did not find expected property at path: ${PROJECT_ID_FIELD_PATH.join(', ')}`);
    }

    for (const path of RESOURCE_ID_FIELD_PATHS) {
      resourceId = _.get(bodyObj, path, null) as string | number;
      if (resourceId) {
        break;
      }
    }
    if (!resourceId) {
      throw new Error(`Did not find expected property at path: ${RESOURCE_ID_FIELD_PATHS.map(path => path.join('.')).join(', ')}`);
    }

    for (const path of WORKITEM_TYPE_FIELD_PATHS) {
      workItemType = _.get(bodyObj, path, null) as WORKITEM_TYPES;
      if (workItemType) {
        break;
      }
    } 
    if (!workItemType) {
      throw new Error(`Did not find expected property at path: ${WORKITEM_TYPE_FIELD_PATHS.map(path => path.join('.')).join(', ')}`)
    }

    fieldMap = TARGET_FIELDS[workItemType];
    if (!fieldMap) {
      throw new Error(`Unexpected resource of type ${workItemType}. Accepted values: ${Object.keys(TARGET_FIELDS).join(', ')}.`)
    }
  } catch (err) {
    if (err && err.message) {
      return createResponse(400, { 
        success: false, 
        message: err.message },
        { "X-Amzn-ErrorType":"ValidationException" }
      );
    } 
  }
  const records: FieldMapRecord[] = [];
  let recordString = '';

  for (const fieldItem of fieldMap) {
    let fieldValue: string | null = null;
    for (const fieldPath of fieldItem.fieldPaths) {
      fieldValue = _.get(bodyObj, fieldPath, null) as string | null;
      if (fieldValue) {
        break;
      }
    }
    if (!fieldValue || !_.isString(fieldValue)) {
      records.push({
        startIndex: null,
        endIndex: null,
        fieldMapItem: fieldItem,
        found: !!fieldValue,
        isString: _.isString(fieldValue) as boolean,
        rawValue: null,
        processedValue: null
      });
      continue;
    }
    
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
    return createResponse(200, { message: "OK" });
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

  return createResponse(200, { message: "OK" })
}

export const create = WrapHandler(createHandler);