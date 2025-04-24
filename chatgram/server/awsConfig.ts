import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.APP_REGION,
  accessKeyId: process.env.APP_ACCESS_KEY_ID!,
  secretAccessKey: process.env.APP_SECRET_ACCESS_KEY!,
});

export const dynamoDB = new AWS.DynamoDB.DocumentClient();