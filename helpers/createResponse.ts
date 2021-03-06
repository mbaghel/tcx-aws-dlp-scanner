import { APIGatewayProxyResult } from 'aws-lambda';

export const createResponse = (statusCode: number, body: Record<string, unknown>, headers: APIGatewayProxyResult["headers"] = {}): APIGatewayProxyResult => {
  
  return {
    statusCode,
    body: JSON.stringify(body),
    headers
  }
}