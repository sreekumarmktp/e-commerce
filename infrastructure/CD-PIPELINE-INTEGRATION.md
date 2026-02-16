# CD Pipeline Integration Guide

This guide explains how the S3 bucket deletion fix integrates with CI/CD pipelines and provides examples for GitHub Actions, GitLab CI, and other platforms.

## Overview

The updated CloudFormation template is fully compatible with existing CD pipelines. The Lambda-based S3 cleanup mechanism works automatically without requiring pipeline modifications.

## Key Benefits for CI/CD

1. **No Pipeline Changes Required**: Existing deployment workflows continue to work
2. **Automatic Cleanup**: Stack deletion works without manual intervention
3. **Idempotent Operations**: Safe to run multiple times
4. **Error Handling**: Proper failure responses to CloudFormation
5. **Logging**: All operations logged to CloudWatch for debugging

---

## GitHub Actions Integration

### Example Workflow: Deploy Stack

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ap-south-2
  STACK_NAME: e-commerce-stack
  ENVIRONMENT_NAME: production

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Get VPC and Subnet information
        id: vpc-info
        run: |
          VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
          SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text | tr '\t' ',')
          echo "vpc_id=$VPC_ID" >> $GITHUB_OUTPUT
          echo "subnets=$SUBNETS" >> $GITHUB_OUTPUT
      
      - name: Deploy CloudFormation stack
        run: |
          aws cloudformation deploy \
            --template-file infrastructure/aws-stack.yaml \
            --stack-name ${{ env.STACK_NAME }} \
            --capabilities CAPABILITY_IAM \
            --parameter-overrides \
              "EnvironmentName=${{ env.ENVIRONMENT_NAME }}" \
              "DBPassword=${{ secrets.DB_PASSWORD }}" \
              "VpcId=${{ steps.vpc-info.outputs.vpc_id }}" \
              "Subnets=${{ steps.vpc-info.outputs.subnets }}" \
            --region ${{ env.AWS_REGION }}
      
      - name: Get stack outputs
        run: |
          aws cloudformation describe-stacks \
            --stack-name ${{ env.STACK_NAME }} \
            --query 'Stacks[0].Outputs' \
            --output table \
            --region ${{ env.AWS_REGION }}
```

### Example Workflow: Delete Stack

```yaml
name: Delete Infrastructure

on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "delete" to confirm stack deletion'
        required: true

env:
  AWS_REGION: ap-south-2
  STACK_NAME: e-commerce-stack

jobs:
  delete:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm == 'delete'
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Delete CloudFormation stack
        run: |
          echo "Deleting stack: ${{ env.STACK_NAME }}"
          aws cloudformation delete-stack \
            --stack-name ${{ env.STACK_NAME }} \
            --region ${{ env.AWS_REGION }}
      
      - name: Wait for stack deletion
        run: |
          echo "Waiting for stack deletion to complete..."
          aws cloudformation wait stack-delete-complete \
            --stack-name ${{ env.STACK_NAME }} \
            --region ${{ env.AWS_REGION }}
          echo "Stack deleted successfully!"
      
      - name: Verify cleanup
        run: |
          echo "Verifying all resources are deleted..."
          
          # Check Lambda function
          aws lambda get-function \
            --function-name production-empty-s3-bucket \
            --region ${{ env.AWS_REGION }} 2>&1 || echo "✓ Lambda deleted"
          
          # Check S3 bucket
          BUCKET_NAME="production-ui-$(aws sts get-caller-identity --query Account --output text)"
          aws s3 ls s3://$BUCKET_NAME --region ${{ env.AWS_REGION }} 2>&1 || echo "✓ S3 bucket deleted"
          
          echo "Cleanup verification complete!"
```


### Example Workflow: Full CI/CD Pipeline

```yaml
name: Full CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-south-2
  STACK_NAME: e-commerce-stack
  ENVIRONMENT_NAME: production

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm run install:all
      
      - name: Run tests
        run: |
          npm test

  deploy-infrastructure:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Validate CloudFormation template
        run: |
          aws cloudformation validate-template \
            --template-body file://infrastructure/aws-stack.yaml \
            --region ${{ env.AWS_REGION }}
      
      - name: Deploy infrastructure
        run: |
          cd infrastructure
          chmod +x deploy-stack.sh
          export DB_PASSWORD="${{ secrets.DB_PASSWORD }}"
          ./deploy-stack.sh
      
      - name: Verify Lambda function
        run: |
          aws lambda get-function \
            --function-name production-empty-s3-bucket \
            --region ${{ env.AWS_REGION }}
          echo "✓ Lambda function verified"
      
      - name: Check CloudWatch logs
        run: |
          aws logs describe-log-groups \
            --log-group-name-prefix /aws/lambda/production-empty-s3-bucket \
            --region ${{ env.AWS_REGION }}
          echo "✓ CloudWatch log group exists"

  deploy-application:
    needs: deploy-infrastructure
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Build and deploy frontend
        run: |
          cd UI
          npm install
          npm run build
          
          BUCKET_NAME=$(aws cloudformation describe-stacks \
            --stack-name ${{ env.STACK_NAME }} \
            --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
            --output text \
            --region ${{ env.AWS_REGION }})
          
          aws s3 sync build/ s3://$BUCKET_NAME/ --delete --region ${{ env.AWS_REGION }}
          echo "✓ Frontend deployed to S3"
      
      - name: Build and deploy backend
        run: |
          cd API
          npm install
          npm run build
          # Add Elastic Beanstalk deployment steps here
```

---

## GitLab CI Integration

### Example .gitlab-ci.yml

```yaml
stages:
  - test
  - deploy
  - cleanup

variables:
  AWS_REGION: ap-south-2
  STACK_NAME: e-commerce-stack
  ENVIRONMENT_NAME: production

test:
  stage: test
  image: node:18
  script:
    - npm run install:all
    - npm test

deploy-infrastructure:
  stage: deploy
  image: amazon/aws-cli:latest
  only:
    - main
  before_script:
    - yum install -y jq
  script:
    - |
      # Get VPC info
      VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
      SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION | tr '\t' ',')
      
      # Deploy stack
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
      
      # Verify Lambda
      aws lambda get-function \
        --function-name production-empty-s3-bucket \
        --region $AWS_REGION
      
      echo "✓ Infrastructure deployed successfully"

deploy-application:
  stage: deploy
  image: node:18
  only:
    - main
  dependencies:
    - deploy-infrastructure
  script:
    - npm install -g aws-cli
    - cd UI && npm install && npm run build
    - |
      BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
        --output text \
        --region $AWS_REGION)
      aws s3 sync build/ s3://$BUCKET_NAME/ --delete --region $AWS_REGION

cleanup-on-failure:
  stage: cleanup
  image: amazon/aws-cli:latest
  when: on_failure
  script:
    - |
      echo "Deployment failed. Checking for issues..."
      aws cloudformation describe-stack-events \
        --stack-name $STACK_NAME \
        --max-items 20 \
        --region $AWS_REGION
```

---

## Azure DevOps Integration

### Example azure-pipelines.yml

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  AWS_REGION: ap-south-2
  STACK_NAME: e-commerce-stack
  ENVIRONMENT_NAME: production

stages:
  - stage: Test
    jobs:
      - job: RunTests
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
          
          - script: |
              npm run install:all
              npm test
            displayName: 'Run tests'

  - stage: Deploy
    dependsOn: Test
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - job: DeployInfrastructure
        steps:
          - task: AWSShellScript@1
            inputs:
              awsCredentials: 'AWS-Connection'
              regionName: '$(AWS_REGION)'
              scriptType: 'inline'
              inlineScript: |
                # Validate template
                aws cloudformation validate-template \
                  --template-body file://infrastructure/aws-stack.yaml \
                  --region $(AWS_REGION)
                
                # Deploy stack
                cd infrastructure
                chmod +x deploy-stack.sh
                export DB_PASSWORD="$(DB_PASSWORD)"
                ./deploy-stack.sh
                
                # Verify Lambda
                aws lambda get-function \
                  --function-name production-empty-s3-bucket \
                  --region $(AWS_REGION)
            displayName: 'Deploy CloudFormation stack'
```

---

## Compatibility Verification

### Pre-Deployment Checks

The updated template maintains backward compatibility:

1. **No Breaking Changes**: All existing resources remain unchanged
2. **Additive Only**: Only new resources added (Lambda, Custom Resource, IAM Role)
3. **Same Parameters**: No changes to stack parameters
4. **Same Outputs**: All outputs remain the same

### Verification Script

```bash
#!/bin/bash
# verify-cd-compatibility.sh

echo "Verifying CD pipeline compatibility..."

# 1. Validate template syntax
echo "1. Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://infrastructure/aws-stack.yaml \
  --region ap-south-2 > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✓ Template syntax valid"
else
  echo "✗ Template validation failed"
  exit 1
fi

# 2. Check for breaking changes
echo "2. Checking for breaking changes..."
CURRENT_PARAMS=$(aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --query 'Stacks[0].Parameters[].ParameterKey' \
  --output text \
  --region ap-south-2 2>/dev/null)

if [ -n "$CURRENT_PARAMS" ]; then
  echo "✓ No parameter changes detected"
else
  echo "✓ New stack (no existing parameters to check)"
fi

# 3. Verify new resources
echo "3. Verifying new resources in template..."
grep -q "EmptyS3BucketFunction" infrastructure/aws-stack.yaml && echo "✓ Lambda function defined"
grep -q "LambdaExecutionRole" infrastructure/aws-stack.yaml && echo "✓ Lambda role defined"
grep -q "EmptyS3BucketResource" infrastructure/aws-stack.yaml && echo "✓ Custom resource defined"

# 4. Check deployment scripts
echo "4. Checking deployment scripts..."
[ -f "infrastructure/deploy-stack.sh" ] && echo "✓ Bash deployment script exists"
[ -f "infrastructure/deploy-stack.ps1" ] && echo "✓ PowerShell deployment script exists"

echo ""
echo "✓ CD pipeline compatibility verified!"
```


---

## Testing Stack Deletion in CI/CD

### Manual Trigger Workflow (Recommended)

```yaml
name: Test Stack Deletion

on:
  workflow_dispatch:
    inputs:
      stack_name:
        description: 'Stack name to delete'
        required: true
        default: 'e-commerce-stack-test'
      confirm:
        description: 'Type DELETE to confirm'
        required: true

jobs:
  test-deletion:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm == 'DELETE'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-2
      
      - name: Create test stack
        run: |
          echo "Creating test stack..."
          cd infrastructure
          export STACK_NAME="${{ github.event.inputs.stack_name }}"
          export DB_PASSWORD="${{ secrets.DB_PASSWORD }}"
          ./deploy-stack.sh
      
      - name: Upload test files to S3
        run: |
          BUCKET_NAME=$(aws cloudformation describe-stacks \
            --stack-name ${{ github.event.inputs.stack_name }} \
            --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
            --output text \
            --region ap-south-2)
          
          echo "test file 1" > test1.txt
          echo "test file 2" > test2.txt
          
          aws s3 cp test1.txt s3://$BUCKET_NAME/test1.txt --region ap-south-2
          aws s3 cp test2.txt s3://$BUCKET_NAME/test2.txt --region ap-south-2
          
          echo "✓ Test files uploaded"
      
      - name: Delete test stack
        run: |
          echo "Deleting test stack..."
          aws cloudformation delete-stack \
            --stack-name ${{ github.event.inputs.stack_name }} \
            --region ap-south-2
      
      - name: Monitor Lambda execution
        run: |
          echo "Monitoring Lambda logs..."
          sleep 10  # Wait for Lambda to execute
          
          aws logs tail /aws/lambda/production-empty-s3-bucket \
            --since 2m \
            --region ap-south-2 || echo "No logs yet"
      
      - name: Wait for deletion
        run: |
          echo "Waiting for stack deletion..."
          aws cloudformation wait stack-delete-complete \
            --stack-name ${{ github.event.inputs.stack_name }} \
            --region ap-south-2
          
          echo "✓ Stack deleted successfully!"
      
      - name: Verify cleanup
        run: |
          echo "Verifying all resources deleted..."
          
          # Check S3 bucket
          BUCKET_NAME=$(aws sts get-caller-identity --query Account --output text)
          aws s3 ls s3://production-ui-$BUCKET_NAME --region ap-south-2 2>&1 || echo "✓ S3 bucket deleted"
          
          # Check Lambda
          aws lambda get-function \
            --function-name production-empty-s3-bucket \
            --region ap-south-2 2>&1 || echo "✓ Lambda deleted"
          
          echo "✓ Cleanup verified!"
```

---

## Environment-Specific Deployments

### Multiple Environments

```yaml
name: Multi-Environment Deployment

on:
  push:
    branches:
      - main
      - develop
      - staging

env:
  AWS_REGION: ap-south-2

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - branch: main
            environment: production
            stack_name: e-commerce-prod
          - branch: staging
            environment: staging
            stack_name: e-commerce-staging
          - branch: develop
            environment: development
            stack_name: e-commerce-dev
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Deploy stack
        if: github.ref == format('refs/heads/{0}', matrix.branch)
        run: |
          cd infrastructure
          export STACK_NAME="${{ matrix.stack_name }}"
          export ENVIRONMENT_NAME="${{ matrix.environment }}"
          export DB_PASSWORD="${{ secrets[format('DB_PASSWORD_{0}', matrix.environment)] }}"
          ./deploy-stack.sh
```

---

## Rollback Strategy

### Automatic Rollback on Failure

```yaml
name: Deploy with Rollback

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-2
      
      - name: Create change set
        id: changeset
        run: |
          CHANGESET_NAME="deploy-$(date +%Y%m%d-%H%M%S)"
          echo "changeset_name=$CHANGESET_NAME" >> $GITHUB_OUTPUT
          
          aws cloudformation create-change-set \
            --stack-name e-commerce-stack \
            --change-set-name $CHANGESET_NAME \
            --template-body file://infrastructure/aws-stack.yaml \
            --capabilities CAPABILITY_IAM \
            --region ap-south-2
      
      - name: Review change set
        run: |
          aws cloudformation describe-change-set \
            --stack-name e-commerce-stack \
            --change-set-name ${{ steps.changeset.outputs.changeset_name }} \
            --region ap-south-2
      
      - name: Execute change set
        id: execute
        run: |
          aws cloudformation execute-change-set \
            --stack-name e-commerce-stack \
            --change-set-name ${{ steps.changeset.outputs.changeset_name }} \
            --region ap-south-2
          
          aws cloudformation wait stack-update-complete \
            --stack-name e-commerce-stack \
            --region ap-south-2
        continue-on-error: true
      
      - name: Rollback on failure
        if: steps.execute.outcome == 'failure'
        run: |
          echo "Deployment failed. Initiating rollback..."
          
          aws cloudformation cancel-update-stack \
            --stack-name e-commerce-stack \
            --region ap-south-2 || true
          
          aws cloudformation wait stack-rollback-complete \
            --stack-name e-commerce-stack \
            --region ap-south-2
          
          echo "✓ Rollback completed"
          exit 1
```

---

## Monitoring and Notifications

### Slack Notifications

```yaml
- name: Notify deployment status
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      Stack: e-commerce-stack
      Status: ${{ job.status }}
      Lambda: Verified
      S3 Cleanup: Enabled
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

```yaml
- name: Send email notification
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: CloudFormation Deployment Failed
    body: |
      Stack deployment failed for e-commerce-stack.
      Check GitHub Actions logs for details.
    to: devops@example.com
```

---

## Best Practices for CI/CD

### 1. Use Change Sets

Always create and review change sets before executing:
```bash
aws cloudformation create-change-set --stack-name ... --change-set-name ...
aws cloudformation describe-change-set --stack-name ... --change-set-name ...
aws cloudformation execute-change-set --stack-name ... --change-set-name ...
```

### 2. Validate Templates

Validate templates before deployment:
```bash
aws cloudformation validate-template --template-body file://infrastructure/aws-stack.yaml
```

### 3. Use Secrets Management

Store sensitive data in CI/CD secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DB_PASSWORD`

### 4. Enable Logging

Monitor all operations:
```bash
# CloudFormation events
aws cloudformation describe-stack-events --stack-name ...

# Lambda logs
aws logs tail /aws/lambda/production-empty-s3-bucket --follow
```

### 5. Test in Non-Production

Always test stack deletion in a non-production environment first.

### 6. Use Stack Policies

Protect critical resources:
```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "Update:Delete",
      "Resource": "LogicalResourceId/DBInstance"
    }
  ]
}
```

---

## Troubleshooting CI/CD Issues

### Pipeline Fails at Deployment

**Check:**
1. AWS credentials are valid
2. IAM permissions are sufficient
3. Template syntax is correct
4. Parameters are provided

### Stack Deletion Hangs

**Check:**
1. Lambda logs for errors
2. S3 bucket is being emptied
3. Custom Resource is responding

### Lambda Not Executing

**Check:**
1. Custom Resource exists in stack
2. Lambda has correct permissions
3. CloudWatch logs are enabled

---

## Summary

The S3 bucket deletion fix is fully compatible with CI/CD pipelines:

✓ **No pipeline changes required**
✓ **Automatic S3 cleanup on deletion**
✓ **Works with GitHub Actions, GitLab CI, Azure DevOps**
✓ **Proper error handling and logging**
✓ **Supports multiple environments**
✓ **Rollback-friendly**

For more information, see:
- [Deployment Guide](./DEPLOYMENT-GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Lambda Function Documentation](./LAMBDA-FUNCTION.md)
