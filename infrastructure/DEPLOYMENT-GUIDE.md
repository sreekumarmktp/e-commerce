# AWS Deployment Guide

Complete guide for deploying the e-commerce application to AWS using CloudFormation.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Updating the Stack](#updating-the-stack)
6. [Deleting the Stack](#deleting-the-stack)
7. [Cost Estimation](#cost-estimation)

---

## Prerequisites

### Required Tools

- **AWS CLI**: Version 2.x or higher
- **AWS Account**: With appropriate permissions
- **Git**: For cloning the repository
- **Node.js**: Version 18+ (for local testing)

### AWS Permissions Required

Your IAM user/role needs these permissions:
- `cloudformation:*`
- `lambda:*`
- `iam:CreateRole`, `iam:AttachRolePolicy`, `iam:PassRole`
- `s3:*`
- `rds:*`
- `elasticbeanstalk:*`
- `ec2:*` (for VPC, Security Groups, Subnets)
- `logs:*` (for CloudWatch Logs)

### AWS CLI Configuration

```bash
# Configure AWS CLI
aws configure

# Verify configuration
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

---

## Architecture Overview

### Infrastructure Components

The CloudFormation stack creates the following resources:

#### Frontend (S3)
- **S3 Bucket**: Hosts static React application
- **Bucket Policy**: Allows public read access
- **Website Configuration**: Serves index.html

#### Backend (Elastic Beanstalk)
- **EB Application**: Node.js application container
- **EB Environment**: Single-instance environment (Free Tier)
- **EC2 Instance**: t3.micro instance running the API
- **Security Group**: Allows HTTP (80) and SSH (22)

#### Database (RDS)
- **PostgreSQL Instance**: db.t3.micro (Free Tier eligible)
- **Storage**: 20 GB
- **Public Access**: Enabled for development
- **Security Group**: Allows PostgreSQL (5432) from EB and external

#### Automation (Lambda)
- **Lambda Function**: Empties S3 bucket on stack deletion
- **Custom Resource**: Triggers Lambda during stack lifecycle
- **IAM Role**: Grants Lambda permissions to S3 and CloudWatch


### Resource Dependencies

```
VPC & Subnets (existing)
    ↓
Security Groups
    ↓
┌─────────────────┬──────────────────┬─────────────────┐
│                 │                  │                 │
RDS Instance    Lambda Function   EB Environment    S3 Bucket
    │               │                  │                 │
    │               │                  │                 ↑
    │               └──────────────────┴─────────────────┘
    │                     Custom Resource
    │                   (triggers on Delete)
    │
    └─────────────────────────────────────────────────────┘
              (EB connects to RDS via DATABASE_URL)
```

---

## Deployment Steps

### Step 1: Prepare the Environment

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd e-commerce

# Verify infrastructure files exist
ls infrastructure/
# Expected: aws-stack.yaml, deploy-stack.sh, deploy-stack.ps1
```

### Step 2: Set Environment Variables

```bash
# Set database password (required)
export DB_PASSWORD="YourSecurePassword123!"

# Optional: Customize stack name and region
export STACK_NAME="e-commerce-stack"
export AWS_REGION="ap-south-2"
export ENVIRONMENT_NAME="production"
```

**PowerShell:**
```powershell
$env:DB_PASSWORD = "YourSecurePassword123!"
$env:STACK_NAME = "e-commerce-stack"
$env:AWS_REGION = "ap-south-2"
$env:ENVIRONMENT_NAME = "production"
```

### Step 3: Deploy the Stack

**Using Bash:**
```bash
cd infrastructure
chmod +x deploy-stack.sh
./deploy-stack.sh
```

**Using PowerShell:**
```powershell
cd infrastructure
.\deploy-stack.ps1
```

**Using AWS CLI Directly:**
```bash
# Get VPC and Subnet information
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region ap-south-2)
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region ap-south-2 | tr '\t' ',')

# Deploy stack
aws cloudformation deploy \
  --template-file infrastructure/aws-stack.yaml \
  --stack-name e-commerce-stack \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    "EnvironmentName=production" \
    "DBPassword=$DB_PASSWORD" \
    "VpcId=$VPC_ID" \
    "Subnets=$SUBNETS" \
  --region ap-south-2
```

### Step 4: Monitor Deployment

```bash
# Watch stack events in real-time
aws cloudformation describe-stack-events \
  --stack-name e-commerce-stack \
  --region ap-south-2 \
  --query 'StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table

# Check stack status
aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --query 'Stacks[0].StackStatus' \
  --output text \
  --region ap-south-2
```

**Expected Status Progression:**
1. `CREATE_IN_PROGRESS` (5-15 minutes)
2. `CREATE_COMPLETE` (deployment successful)

### Step 5: Retrieve Stack Outputs

```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --query 'Stacks[0].Outputs' \
  --output table \
  --region ap-south-2
```

**Expected Outputs:**
- **APIEndpoint**: Elastic Beanstalk URL (e.g., `http://production-123456789012.ap-south-2.elasticbeanstalk.com`)
- **UIEndpoint**: S3 website URL (e.g., `http://production-ui-123456789012.s3-website.ap-south-2.amazonaws.com`)
- **FrontendBucketName**: S3 bucket name (e.g., `production-ui-123456789012`)
- **DBEndpoint**: RDS endpoint (e.g., `ecommerce-db.xxxxx.ap-south-2.rds.amazonaws.com`)


---

## Post-Deployment Configuration

### Step 1: Run Database Migrations

```bash
# Get RDS endpoint from stack outputs
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`DBEndpoint`].OutputValue' \
  --output text \
  --region ap-south-2)

# Set DATABASE_URL
export DATABASE_URL="postgres://dbadmin:$DB_PASSWORD@$DB_ENDPOINT:5432/ecommerce_db"

# Run migrations from API directory
cd ../API
npm install
npm run migrate:prod
```

### Step 2: Seed Database

```bash
# Seed with initial data (admin user, categories, products)
npm run seed:prod
```

### Step 3: Build and Deploy Frontend

```bash
# Build React application
cd ../UI
npm install
npm run build

# Get S3 bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text \
  --region ap-south-2)

# Upload build to S3
aws s3 sync build/ s3://$BUCKET_NAME/ --region ap-south-2 --delete
```

### Step 4: Build and Deploy Backend

```bash
# Build API application
cd ../API
npm run build

# Create deployment package
zip -r ../api-deployment.zip . -x "node_modules/*" -x ".git/*"

# Create application version
aws elasticbeanstalk create-application-version \
  --application-name production-api \
  --version-label v1.0.0 \
  --source-bundle S3Bucket=elasticbeanstalk-ap-south-2-$(aws sts get-caller-identity --query Account --output text),S3Key=api-deployment.zip \
  --region ap-south-2

# Deploy to environment
aws elasticbeanstalk update-environment \
  --environment-name production-env \
  --version-label v1.0.0 \
  --region ap-south-2
```

### Step 5: Verify Deployment

```bash
# Check Elastic Beanstalk health
aws elasticbeanstalk describe-environment-health \
  --environment-name production-env \
  --attribute-names All \
  --region ap-south-2

# Test API endpoint
API_URL=$(aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text \
  --region ap-south-2)

curl $API_URL/health

# Test UI endpoint
UI_URL=$(aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`UIEndpoint`].OutputValue' \
  --output text \
  --region ap-south-2)

curl -I $UI_URL
```

---

## Updating the Stack

### Update CloudFormation Template

```bash
# Make changes to infrastructure/aws-stack.yaml

# Validate template
aws cloudformation validate-template \
  --template-body file://infrastructure/aws-stack.yaml \
  --region ap-south-2

# Create change set to preview changes
aws cloudformation create-change-set \
  --stack-name e-commerce-stack \
  --change-set-name update-$(date +%Y%m%d-%H%M%S) \
  --template-body file://infrastructure/aws-stack.yaml \
  --capabilities CAPABILITY_IAM \
  --region ap-south-2

# Review change set
aws cloudformation describe-change-set \
  --stack-name e-commerce-stack \
  --change-set-name update-YYYYMMDD-HHMMSS \
  --region ap-south-2

# Execute change set
aws cloudformation execute-change-set \
  --stack-name e-commerce-stack \
  --change-set-name update-YYYYMMDD-HHMMSS \
  --region ap-south-2
```

### Update Application Code

**Frontend:**
```bash
cd UI
npm run build
aws s3 sync build/ s3://$BUCKET_NAME/ --region ap-south-2 --delete
```

**Backend:**
```bash
cd API
npm run build
# Create new application version and deploy (see Step 4 above)
```

---

## Deleting the Stack

### Important: Automatic S3 Cleanup

The stack includes a Lambda function that automatically empties the S3 bucket during deletion. No manual cleanup required!

### Deletion Steps

**Step 1: Backup Data (Optional)**
```bash
# Backup database
pg_dump "$DATABASE_URL" > backup.sql

# Download S3 bucket contents
aws s3 sync s3://$BUCKET_NAME/ ./s3-backup/ --region ap-south-2
```

**Step 2: Initiate Stack Deletion**
```bash
aws cloudformation delete-stack \
  --stack-name e-commerce-stack \
  --region ap-south-2
```

**Step 3: Monitor Deletion**
```bash
# Watch deletion progress
aws cloudformation describe-stack-events \
  --stack-name e-commerce-stack \
  --region ap-south-2 \
  --query 'StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType]' \
  --output table

# Check Lambda logs (S3 cleanup)
aws logs tail /aws/lambda/production-empty-s3-bucket \
  --follow \
  --region ap-south-2
```

**Step 4: Verify Deletion**
```bash
# Check stack status (should return error when deleted)
aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --region ap-south-2 2>&1

# Expected: "Stack with id e-commerce-stack does not exist"
```

### Deletion Timeline

- **Lambda execution**: 1-30 seconds (empties S3 bucket)
- **S3 bucket deletion**: 10-30 seconds
- **RDS deletion**: 5-10 minutes (includes final snapshot)
- **EB environment termination**: 5-10 minutes
- **Total time**: 10-20 minutes


---

## Cost Estimation

### AWS Free Tier Eligible

The following resources are Free Tier eligible (first 12 months):

- **EC2 (via Elastic Beanstalk)**: 750 hours/month of t2.micro or t3.micro
- **RDS**: 750 hours/month of db.t3.micro, 20 GB storage
- **S3**: 5 GB storage, 20,000 GET requests, 2,000 PUT requests
- **Lambda**: 1 million requests/month, 400,000 GB-seconds compute
- **CloudWatch Logs**: 5 GB ingestion, 5 GB storage

### Estimated Monthly Costs (After Free Tier)

**Minimal Usage (Development):**
- EC2 (t3.micro): ~$7.50/month
- RDS (db.t3.micro): ~$15/month
- S3 (5 GB): ~$0.12/month
- Lambda: ~$0.00 (negligible)
- Data Transfer: ~$1/month
- **Total**: ~$23.62/month

**Moderate Usage (Production):**
- EC2 (t3.small): ~$15/month
- RDS (db.t3.small): ~$30/month
- S3 (20 GB): ~$0.46/month
- Lambda: ~$0.00 (negligible)
- Data Transfer: ~$5/month
- **Total**: ~$50.46/month

### Cost Optimization Tips

1. **Use Free Tier**: Deploy within first 12 months for free usage
2. **Stop When Not Needed**: Delete stack when not actively developing
3. **Monitor Usage**: Set up AWS Budgets and billing alerts
4. **Right-Size Instances**: Start with t3.micro, scale up only if needed
5. **Clean Up Regularly**: Delete unused stacks and resources

### Setting Up Cost Alerts

```bash
# Create budget alert
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

---

## New Resources Added for S3 Deletion Fix

### Lambda Function

**Resource**: `EmptyS3BucketFunction`
- **Purpose**: Automatically empties S3 bucket on stack deletion
- **Runtime**: Python 3.12
- **Timeout**: 300 seconds
- **Cost**: Free (within Lambda free tier)

### Lambda Execution Role

**Resource**: `LambdaExecutionRole`
- **Purpose**: Grants Lambda permissions to S3 and CloudWatch
- **Permissions**:
  - S3: ListBucket, DeleteObject, DeleteObjectVersion
  - CloudWatch: CreateLogGroup, CreateLogStream, PutLogEvents

### Custom Resource

**Resource**: `EmptyS3BucketResource`
- **Purpose**: Triggers Lambda function during stack lifecycle
- **Events**: Create, Update, Delete
- **Action**: Only processes Delete events

### Resource Dependencies

The S3 bucket now depends on the Custom Resource:
```yaml
FrontendBucket:
  Type: AWS::S3::Bucket
  DependsOn: EmptyS3BucketResource
```

This ensures:
1. Custom Resource is created before the bucket
2. Custom Resource is deleted after the bucket (triggering cleanup)
3. Bucket is empty before CloudFormation attempts deletion

---

## Troubleshooting

For detailed troubleshooting steps, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### Quick Diagnostics

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --query 'Stacks[0].StackStatus' \
  --region ap-south-2

# View recent events
aws cloudformation describe-stack-events \
  --stack-name e-commerce-stack \
  --max-items 20 \
  --region ap-south-2

# Check Lambda logs
aws logs tail /aws/lambda/production-empty-s3-bucket \
  --since 10m \
  --region ap-south-2

# Verify resources
./verify-resources.sh  # or verify-resources.ps1
```

---

## Additional Resources

### Documentation

- [Lambda Function Documentation](./LAMBDA-FUNCTION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Manual Verification Guide](../.kiro/specs/s3-bucket-deletion-fix/MANUAL-VERIFICATION.md)
- [Deletion Testing Guide](../.kiro/specs/s3-bucket-deletion-fix/DELETION-TESTING.md)

### AWS Documentation

- [CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Elastic Beanstalk Developer Guide](https://docs.aws.amazon.com/elasticbeanstalk/)
- [RDS User Guide](https://docs.aws.amazon.com/rds/)
- [S3 User Guide](https://docs.aws.amazon.com/s3/)

### Verification Tools

```bash
# Verify all resources exist
./verify-resources.sh

# Quick verification
cat QUICK-VERIFY.md
```

---

## Support

For issues or questions:
1. Check the troubleshooting guide
2. Review CloudFormation events and logs
3. Consult AWS documentation
4. Check the project repository for updates
