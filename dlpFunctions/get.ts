import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB  } from 'aws-sdk';

// eslint-disable-next-line
const dynamoDb = new DynamoDB();

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
      "projectId": {
        S: queryParams.project_id,
      },
      "resourceId": {
        S: queryParams.resource_id,
      },
    },
  }

  try {
    // eslint-disable-next-line
    const item = await dynamoDb.getItem(params).promise();

    const res: APIGatewayProxyResult = {
      statusCode: 200,
      body: JSON.stringify(item)
    }
    return res

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