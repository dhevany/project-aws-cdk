
import * as cdk from 'aws-cdk-lib';

import { NetworkStack } from '../lib/aws-network-stack';
import { SecurityStack } from '../lib/aws-security-stack';
import { ApplicationStack } from '../lib/aws-application-stack';
import { DatabaseStack } from '../lib/aws-database-stack';

// Create CDK application
const app = new cdk.App();

// AWS account and region
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// ==========================================
// 1. NETWORK STACK
// ==========================================

const networkStack = new NetworkStack(
  app,
  'NetworkStack',
  {
    env,
  }
);

// ==========================================
// 2. SECURITY STACK
// ==========================================

const securityStack = new SecurityStack(
  app,
  'SecurityStack',
  {
    env,
    vpc: networkStack.vpc,
  }
);


// ==========================================
// 4. APPLICATION STACK
// ==========================================

const applicationStack = new ApplicationStack(
  app,
  'ApplicationStack',
  {
    env,
    vpc: networkStack.vpc,
    albSG: securityStack.albSG,
    ec2SG: securityStack.ec2SG,
  }
);


// ==========================================
// 5. DATABASE STACK
// ==========================================

const databaseStack = new DatabaseStack(
  app,
  'DatabaseStack',
  {
    env,
    vpc: networkStack.vpc,
    rdsSG: securityStack.rdsSG,
  }
);

 // ==========================================
 // STACK DEPENDENCIES
 // ==========================================

securityStack.addStackDependency(networkStack);

applicationStack.addStackDependency(securityStack);

databaseStack.addStackDependency(securityStack);

app.synth();

// Synthesize CDK application
app.synth();
