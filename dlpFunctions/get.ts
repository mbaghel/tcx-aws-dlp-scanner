import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB  } from 'aws-sdk';
import { getDefaultItem } from '../helpers/generateItem';

// eslint-disable-next-line
const dynamoDb = new DynamoDB.DocumentClient();

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const queryParams = event.queryStringParameters;

  if (!queryParams || !queryParams.project_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: "project_id is required"
      }),
      headers: {
        "X-Amzn-ErrorType":"InvalidParameterException"
      }
    }
  }
  if (!queryParams.resource_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: "resource_id is required"
      }),
      headers: {
        "X-Amzn-ErrorType":"InvalidParameterException"
      }
    }
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

    if (getRes && getRes.Item) {
      const res: APIGatewayProxyResult = {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: getRes.Item
        })
      }
      return res
    }

    const newItem = getDefaultItem(queryParams.project_id, queryParams.resource_id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: newItem
      })
    }

  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error"
      })
    }
  }
}