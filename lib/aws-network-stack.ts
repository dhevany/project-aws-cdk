
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

// Network Stack
export class NetworkStack extends cdk.Stack {

  // Export VPC so other stacks can use it
  public readonly vpc: ec2.Vpc;

  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // =====================================
    // 1. CREATE VPC
    // =====================================

    this.vpc = new ec2.Vpc(this, 'DevOpsVPC', {

      vpcName: 'DevOps-VPC',

      ipAddresses: ec2.IpAddresses.cidr('10.20.0.0/16'),

      maxAzs: 2,

      natGateways: 1,

      // =====================================
      // 2. SUBNET CONFIGURATION
      // =====================================

      subnetConfiguration: [

        // Public Subnets
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },

        // Private Application Subnets
        {
          name: 'Application',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },

        // Private Database Subnets
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },

      ],

    });

    // =====================================
    // 3. TAG THE VPC
    // =====================================

    cdk.Tags.of(this.vpc).add(
      'Project',
      'AWS-CDK-DevOps'
    );

    cdk.Tags.of(this.vpc).add(
      'Environment',
      'Development'
    );

    // =====================================
    // 4. CLOUDFORMATION OUTPUTS
    // =====================================

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'DevOpsVpcId',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Public Subnet IDs',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Application Private Subnet IDs',
    });

    new cdk.CfnOutput(this, 'DatabaseSubnetIds', {
      value: this.vpc.isolatedSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Database Isolated Subnet IDs',
    });

  }
}
