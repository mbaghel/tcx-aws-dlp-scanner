import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const create = async (event: APIGatewayProxyEvent) => {

  const bodyObj = JSON.parse(event.body);

  const item = {
    "projectId": bodyObj.project_id,
    "resourceId": bodyObj.resource_id,
    "dlpStatus": bodyObj.dlp_status,
    "titleStatus": {
      status: "NO_ISSUES",
      issues: [{
        score: 0,
        text: 'some text'
      }]
    }
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: item,
    ReturnValues: 'ALL_NEW'
  }

  const putRes = await dynamoDb.put(params).promise();

  const res = {
    statusCode: 200,
    body: JSON.stringify(putRes)
  }

  return res
}