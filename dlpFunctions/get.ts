import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB  } from 'aws-sdk';
import { getDefaultItem } from '../helpers/generateItem';
import { createResponse } from '../helpers/createResponse';
import { DlpStatusItem } from '../types/AdoWorkItemsDlpStatus';

// eslint-disable-next-line
const dynamoDb = new DynamoDB.DocumentClient();

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

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

  try {
    // eslint-disable-next-line
    const getRes = await dynamoDb.get(params).promise();

    let item: DlpStatusItem;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (getRes && getRes.Item) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      item = getRes.Item as DlpStatusItem;
    } else {
      item = getDefaultItem(queryParams.project_id, queryParams.resource_id);
    }
    
    return createResponse(200, { success: true, data: item });

  } catch (err) {
    console.error(err)
    return createResponse(500, { message: "Internal Server Error"})
  }
}