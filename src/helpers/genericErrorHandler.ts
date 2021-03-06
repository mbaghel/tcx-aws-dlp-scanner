import { APIGatewayProxyEvent, Context, APIGatewayProxyResult, APIGatewayProxyHandler, Callback } from 'aws-lambda'; 

/**
 * Wraps a Lambda handler with a try-catch
 * to ensure a consistent response when unexpected
 * errors occur.
 * @param func The handler to be wrapped
 */
export function WrapHandler(func: APIGatewayProxyHandler) {
  return async (event: APIGatewayProxyEvent, context: Context, callback: Callback<APIGatewayProxyResult>): Promise<void | APIGatewayProxyResult> => {
    try {
      const res = await func(event, context, callback);

      return res;
    } catch (err) {
      console.error();
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error"})
      };
    }
  }
}