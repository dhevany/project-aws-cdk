
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  rdsSG: ec2.ISecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(
    scope: Construct,
    id: string,
    props: DatabaseStackProps
  ) {
    super(scope, id, props);

    // =====================================
    // 1. POSTGRESQL RDS DATABASE
    // =====================================

    this.database = new rds.DatabaseInstance(
      this,
      'DevOpsPostgresDB',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16,
        }),

        vpc: props.vpc,

        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },

        securityGroups: [props.rdsSG],

        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),

        allocatedStorage: 20,
        storageType: rds.StorageType.GP2,
        storageEncrypted: true,

        multiAz: false,
        publiclyAccessible: false,

        databaseName: 'devopsdb',

        credentials: rds.Credentials.fromGeneratedSecret(
          'postgres'
        ),

        backupRetention: cdk.Duration.days(1),

        deletionProtection: false,

        // Lab only: removes the database on destroy.
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deleteAutomatedBackups: true,
      }
    );

    // =====================================
    // 2. DATABASE ENDPOINT OUTPUT
    // =====================================

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'PostgreSQL Database Endpoint',
    });

    // =====================================
    // 3. SECRETS MANAGER OUTPUT
    // =====================================

    if (this.database.secret) {
      new cdk.CfnOutput(this, 'DatabaseSecretArn', {
        value: this.database.secret.secretArn,
        description: 'RDS Credentials Secret ARN',
      });
    }
  }
}
