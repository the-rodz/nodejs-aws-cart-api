import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MyVPC', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    

    const dbInstance = new rds.DatabaseInstance(this, 'RDSInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_10,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('mydbadmin', {
        secretName: 'MyDBCreds',
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: 'dbVinylCart',
    });

    const nestJSLambda = new lambdaNodejs.NodejsFunction(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../dist/main.js'),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbInstance.connections.securityGroups[0]],
      bundling: {
        minify: false,
        sourceMap: true,
        target: 'es2020',
        externalModules: [
          'class-validator',
          '@nestjs/websockets/socket-module',
          '@nestjs/microservices/microservices-module',
          '@nestjs/microservices',
        ],
        nodeModules: [],
      },
      environment: {
        DB_SECRET_ARN: dbInstance.secret!.secretName,
      },
    });

    // Grant lambda permission to read the database secret.
    dbInstance.secret!.grantRead(nestJSLambda);
    
    // Allow communication between dbINstance and lambda function
    dbInstance.connections.allowDefaultPortFrom(nestJSLambda);

    const api = new apigateway.RestApi(this, 'NestjsApiGateway', {
      restApiName: 'Nest Service',
      description: 'This service serves a Nest.js application.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    const nestJSLambdaIntegration = new apigateway.LambdaIntegration(nestJSLambda);

    const proxyResource = api.root.addProxy({
      defaultIntegration: nestJSLambdaIntegration,
      anyMethod: true,
    });

    new cdk.CfnOutput(this, 'NestjsApi', {
      value: api.url,
      description: 'Nest JS Api URL',
    });
  }
}
