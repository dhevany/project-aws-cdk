
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SecurityStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class SecurityStack extends cdk.Stack {

  public readonly albSG: ec2.SecurityGroup;
  public readonly ec2SG: ec2.SecurityGroup;
  public readonly rdsSG: ec2.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: SecurityStackProps
  ) {
    super(scope, id, props);

    // =====================================
    // 1. ALB SECURITY GROUP
    // =====================================

    this.albSG = new ec2.SecurityGroup(this, 'ALB-SG', {
      vpc: props.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    this.albSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    // =====================================
    // 2. EC2 SECURITY GROUP
    // =====================================

    this.ec2SG = new ec2.SecurityGroup(this, 'EC2-SG', {
      vpc: props.vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    this.ec2SG.addIngressRule(
      this.albSG,
      ec2.Port.tcp(80),
      'Allow HTTP only from ALB'
    );

    // =====================================
    // 3. RDS SECURITY GROUP
    // =====================================

    this.rdsSG = new ec2.SecurityGroup(this, 'RDS-SG', {
      vpc: props.vpc,
      description: 'Security group for PostgreSQL database',
      allowAllOutbound: false,
    });

    this.rdsSG.addIngressRule(
      this.ec2SG,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL only from EC2'
    );

  }
}
