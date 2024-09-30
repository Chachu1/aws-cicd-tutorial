import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as dotenv from 'dotenv';

export class AwsCicdTutorialStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Load the environment .env file.
    dotenv.config();

    // Create a table to store some data.
    const table = new dynamodb.Table(this, "VisitorTimeTable", {
      partitionKey: {
        name: "key",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create a Lambda function using a Docker image
    const lambdaFunction = new lambda.DockerImageFunction(this, "LambdaFunction", {
      code: lambda.DockerImageCode.fromImageAsset("lambda-docker"), // Path to the Dockerfile
      environment: {
        VERSION: process.env.VERSION || "0.0",
        TABLE_NAME: table.tableName,
      },
    });

    // Second Lambda Function (Newly added)
    const secondLambdaFunction = new lambda.DockerImageFunction(this, "SecondLambdaFunction", {
      code: lambda.DockerImageCode.fromImageAsset("lambda-docker2"),  // Path to second Dockerfile
      environment: {
        VERSION: process.env.VERSION || "0.0",
      },
    });

    // Grant the Lambda function read/write access to the DynamoDB table
    table.grantReadWriteData(lambdaFunction);

    // Add a function URL for the Lambda function
    const functionUrl = lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ["*"],
      },
    });

    // Output the function URL after deployment
    new cdk.CfnOutput(this, "Url", {
      value: functionUrl.url,
    });
  }
}
