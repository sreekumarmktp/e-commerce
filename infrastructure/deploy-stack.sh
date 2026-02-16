#!/bin/bash

# CloudFormation Stack Deployment Script
# This script deploys or updates the e-commerce CloudFormation stack

set -e  # Exit on error

# Configuration
AWS_REGION="${AWS_REGION:-ap-south-2}"
STACK_NAME="${STACK_NAME:-e-commerce-stack}"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== CloudFormation Stack Deployment ===${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials are not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

# Check if DB_PASSWORD is set
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Warning: DB_PASSWORD environment variable is not set${NC}"
    read -sp "Enter database password: " DB_PASSWORD
    echo ""
fi

echo -e "${GREEN}Configuration:${NC}"
echo "  Region: $AWS_REGION"
echo "  Stack Name: $STACK_NAME"
echo "  Environment: $ENVIRONMENT_NAME"
echo ""

# Get VPC and Subnet information
echo -e "${GREEN}Fetching VPC and Subnet information...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION | tr '\t' ',')

if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
    echo -e "${RED}Error: Could not find default VPC${NC}"
    exit 1
fi

echo "  VPC ID: $VPC_ID"
echo "  Subnets: $SUBNETS"
echo ""

# Check if stack exists
echo -e "${GREEN}Checking if stack exists...${NC}"
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
    echo -e "${YELLOW}Stack exists. This will be an UPDATE operation.${NC}"
    OPERATION="update"
else
    echo -e "${GREEN}Stack does not exist. This will be a CREATE operation.${NC}"
    OPERATION="create"
fi
echo ""

# Confirm deployment
read -p "Do you want to proceed with stack $OPERATION? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Deploy the stack
echo -e "${GREEN}Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
  --template-file infrastructure/aws-stack.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    "EnvironmentName=$ENVIRONMENT_NAME" \
    "DBPassword=$DB_PASSWORD" \
    "VpcId=$VPC_ID" \
    "Subnets=$SUBNETS" \
  --region $AWS_REGION

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Stack deployment successful!${NC}"
    echo ""
    
    # Get stack outputs
    echo -e "${GREEN}Stack Outputs:${NC}"
    aws cloudformation describe-stacks \
      --stack-name $STACK_NAME \
      --query "Stacks[0].Outputs" \
      --output table \
      --region $AWS_REGION
    
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "  1. Verify Lambda function: aws lambda get-function --function-name $ENVIRONMENT_NAME-empty-s3-bucket --region $AWS_REGION"
    echo "  2. Check CloudWatch logs: aws logs tail /aws/lambda/$ENVIRONMENT_NAME-empty-s3-bucket --follow --region $AWS_REGION"
    echo "  3. Test stack deletion (optional): aws cloudformation delete-stack --stack-name $STACK_NAME --region $AWS_REGION"
else
    echo ""
    echo -e "${RED}✗ Stack deployment failed${NC}"
    echo ""
    echo -e "${YELLOW}Check CloudFormation events for details:${NC}"
    echo "  aws cloudformation describe-stack-events --stack-name $STACK_NAME --region $AWS_REGION --max-items 20"
    exit 1
fi
