/**
 * Lambda authorizer that allows sending api key as a query param
 */
module.exports.auth = (event, context, callback) => {
  callback(null, {
    principalId: "api-key-auth",
    usageIdentifierKey: event.queryStringParameters["code"],
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: event.methodArn
        }
      ]
    }
  });
};