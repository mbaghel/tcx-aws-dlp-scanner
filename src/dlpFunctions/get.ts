import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB  } from 'aws-sdk';
import { getDefaultItem } from '../helpers/generateItem';
import { createResponse } from '../helpers/createResponse';
import { DlpStatusItem } from '../types/AdoWorkItemsDlpStatus';
import { WrapHandler } from '../helpers/genericErrorHandler';

const dynamoDb = new DynamoDB.DocumentClient();

const getHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const queryParams = event.queryStringParameters;

  if (!queryParams || !queryParams.project_id) {
    return createResponse(
      400, 
      { success: false, message: "project_id is required" },
      { "X-Amzn-ErrorType": "InvalidParameterException" }
    );
  }
  if (!queryParams.resource_id) {
    return createResponse(
      400, 
      { 
        success: false, 
        message: "resource_id is required"
      },
      { "X-Amzn-ErrorType":"InvalidParameterException" }
    );
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      "projectId": queryParams.project_id,
      "resourceId": queryParams.resource_id,
    }
  }

  const getRes = await dynamoDb.get(params).promise();

  let item: DlpStatusItem;

  if (getRes && getRes.Item) {
    item = getRes.Item as DlpStatusItem;
  } else {
    item = getDefaultItem(queryParams.project_id, queryParams.resource_id);
  }
  
  return createResponse(200, { success: true, data: item }); 
}

export const get = WrapHandler(getHandler);