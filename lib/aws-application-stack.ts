
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

// ========================================
// APPLICATION STACK PROPERTIES
// ========================================

export interface ApplicationStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  albSG: ec2.ISecurityGroup;
  ec2SG: ec2.ISecurityGroup;
}

export class ApplicationStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;

  constructor(
    scope: Construct,
    id: string,
    props: ApplicationStackProps
  ) {
    super(scope, id, props);

    // ========================================
    // 1. EC2 USER DATA
    // ========================================

    const userData = ec2.UserData.forLinux();

    userData.addCommands(
      'dnf update -y',
      'dnf install -y httpd',
      'systemctl enable httpd',
      'mkdir -p /var/www/html',
      'echo "Hello from AWS CDK DevOps Project" > /var/www/html/index.html',
      'echo "OK" > /var/www/html/health',
      'systemctl start httpd'
    );

    // ========================================
    // 2. EC2 LAUNCH TEMPLATE
    // ========================================

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'DevOpsLaunchTemplate',
      {
        machineImage:
          ec2.MachineImage.latestAmazonLinux2023(),

        instanceType:
          new ec2.InstanceType('t3.micro'),

        securityGroup: props.ec2SG,

        userData: userData,

        requireImdsv2: true,
      }
    );

    // ========================================
    // 3. AUTO SCALING GROUP
    // ========================================

    this.asg = new autoscaling.AutoScalingGroup(
  this,
  'DevOpsASG',
  {
    vpc: props.vpc,

    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },

    launchTemplate: launchTemplate,

    minCapacity: 1,
    desiredCapacity: 2,
    maxCapacity: 4,

  healthChecks: autoscaling.HealthChecks.withAdditionalChecks({
    additionalTypes: [
    ],
    gracePeriod: cdk.Duration.minutes(5),
  }),
  }
);

    // ========================================
    // 4. APPLICATION LOAD BALANCER
    // ========================================

    this.alb = new elbv2.ApplicationLoadBalancer(
      this,
      'DevOpsALB',
      {
        vpc: props.vpc,

        internetFacing: true,

        securityGroup: props.albSG,

        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // ========================================
    // 5. HTTP LISTENER
    // ========================================

    const listener = this.alb.addListener(
      'HTTPListener',
      {
        port: 80,
        open: false,
      }
    );

    // ========================================
    // 6. TARGET GROUP
    // ========================================

    listener.addTargets('EC2Targets', {
      port: 80,

      targets: [this.asg],

      healthCheck: {
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        healthyHttpCodes: '200',
      },
    });

    // ========================================
    // 7. CPU AUTO SCALING
    // ========================================

    this.asg.scaleOnCpuUtilization(
      'CPUScalingPolicy',
      {
        targetUtilizationPercent: 50,
      }
    );

    // ========================================
    // 8. OUTPUTS
    // ========================================

    new cdk.CfnOutput(this, 'ALBDNS', {
      value: this.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'ASGName', {
      value: this.asg.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });
  }
}
