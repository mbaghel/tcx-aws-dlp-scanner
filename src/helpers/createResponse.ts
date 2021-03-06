import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Takes params and returns a properly formed response to send to API Gateway.
 * @param statusCode Status code to return in response
 * @param body body object for response
 * @param headers Any custom headers to add to response
 */
export const createResponse = (statusCode: number, body: Record<string, unknown>, headers: APIGatewayProxyResult["headers"] = {}): APIGatewayProxyResult => {
  
  return {
    statusCode,
    body: JSON.stringify(body),
    headers
  }
}