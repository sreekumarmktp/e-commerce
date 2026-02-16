# Troubleshooting Guide

This guide provides solutions for common issues with the CloudFormation stack and S3 bucket deletion.

## Table of Contents

1. [Stack Deployment Issues](#stack-deployment-issues)
2. [Stack Deletion Issues](#stack-deletion-issues)
3. [Lambda Function Issues](#lambda-function-issues)
4. [S3 Bucket Issues](#s3-bucket-issues)
5. [Database Connection Issues](#database-connection-issues)
6. [Elastic Beanstalk Issues](#elastic-beanstalk-issues)

---

## Stack Deployment Issues

### Issue: Stack Creation Fails with "VPC Not Found"

**Symptoms:**
- CloudFormation shows error: "VPC with id vpc-xxxxx does not exist"
- Stack status: CREATE_FAILED or ROLLBACK_COMPLETE

**Cause:**
- Default VPC doesn't exist in the region
- Incorrect VPC ID provided

**Resolution:**
```bash
# Check if default VPC exists
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region ap-south-2

# If no default VPC, create one
aws ec2 create-default-vpc --region ap-south-2

# Or specify a custom VPC ID
aws cloudformation deploy \
  --template-file infrastructure/aws-stack.yaml \
  --stack-name e-commerce-stack \
  --parameter-overrides VpcId=vpc-xxxxx Subnets=subnet-xxx,subnet-yyy \
  --region ap-south-2
```

### Issue: "Insufficient Permissions" Error

**Symptoms:**
- CloudFormation shows permission denied errors
- Cannot create IAM roles or Lambda functions

**Cause:**
- AWS credentials lack required permissions
- IAM user/role missing CloudFormation, Lambda, or IAM permissions

**Resolution:**
1. Verify your AWS credentials have administrator access or these permissions:
   - cloudformation:*
   - lambda:*
   - iam:CreateRole, iam:AttachRolePolicy
   - s3:*
   - rds:*
   - elasticbeanstalk:*

2. Check current user permissions:
```bash
aws iam get-user --query 'User.Arn'
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```


### Issue: Lambda Function Creation Fails

**Symptoms:**
- CloudFormation event shows: "Resource creation failed for EmptyS3BucketFunction"
- Error message about invalid runtime or handler

**Cause:**
- Python runtime not available in the region
- Inline code has syntax errors

**Resolution:**
1. Verify Python 3.12 is available in your region:
```bash
aws lambda list-runtimes --region ap-south-2
```

2. If Python 3.12 is not available, update the template to use Python 3.11 or 3.10

3. Validate the CloudFormation template:
```bash
aws cloudformation validate-template \
  --template-body file://infrastructure/aws-stack.yaml \
  --region ap-south-2
```

---

## Stack Deletion Issues

### Issue: Stack Deletion Fails with "Bucket Not Empty"

**Symptoms:**
- Stack status: DELETE_FAILED
- CloudFormation event: "The bucket you tried to delete is not empty"
- S3 bucket still contains objects

**Cause:**
- Lambda function didn't execute
- Lambda function failed silently
- Custom Resource didn't trigger Lambda

**Resolution:**

**Step 1: Check Lambda Logs**
```bash
aws logs tail /aws/lambda/production-empty-s3-bucket --since 10m --region ap-south-2
```

**Step 2: Manually Empty Bucket**
```bash
# Get bucket name
BUCKET_NAME="production-ui-$(aws sts get-caller-identity --query Account --output text)"

# Empty bucket
aws s3 rm s3://$BUCKET_NAME/ --recursive --region ap-south-2

# Delete versioned objects if any
aws s3api delete-objects \
  --bucket $BUCKET_NAME \
  --delete "$(aws s3api list-object-versions \
    --bucket $BUCKET_NAME \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
    --region ap-south-2)"
```

**Step 3: Retry Stack Deletion**
```bash
aws cloudformation delete-stack --stack-name e-commerce-stack --region ap-south-2
```

### Issue: Stack Deletion Hangs or Times Out

**Symptoms:**
- Stack status stuck at DELETE_IN_PROGRESS for > 10 minutes
- No progress in CloudFormation events
- Lambda function not logging anything

**Cause:**
- Lambda function timeout
- Custom Resource not responding
- Network connectivity issues

**Resolution:**

**Step 1: Check Stack Events**
```bash
aws cloudformation describe-stack-events \
  --stack-name e-commerce-stack \
  --max-items 20 \
  --region ap-south-2
```

**Step 2: Check Lambda Execution**
```bash
# Check if Lambda was invoked
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=production-empty-s3-bucket \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region ap-south-2
```

**Step 3: Force Delete (Last Resort)**
```bash
# Skip the problematic resource
aws cloudformation continue-update-rollback \
  --stack-name e-commerce-stack \
  --resources-to-skip EmptyS3BucketResource \
  --region ap-south-2
```


### Issue: RDS Instance Won't Delete

**Symptoms:**
- Stack deletion fails at RDS instance
- Error: "Cannot delete DB instance with deletion protection enabled"

**Cause:**
- RDS deletion protection is enabled
- DB snapshots are being created

**Resolution:**
```bash
# Disable deletion protection
aws rds modify-db-instance \
  --db-instance-identifier ecommerce-db \
  --no-deletion-protection \
  --apply-immediately \
  --region ap-south-2

# Wait for modification to complete
aws rds wait db-instance-available \
  --db-instance-identifier ecommerce-db \
  --region ap-south-2

# Retry stack deletion
aws cloudformation delete-stack --stack-name e-commerce-stack --region ap-south-2
```

---

## Lambda Function Issues

### Issue: Lambda Function Returns "Access Denied"

**Symptoms:**
- CloudWatch logs show: "Error: Access Denied"
- Stack deletion fails
- Lambda cannot delete S3 objects

**Cause:**
- IAM role missing S3 permissions
- S3 bucket policy blocking Lambda
- Incorrect bucket name

**Resolution:**

**Step 1: Verify IAM Role Permissions**
```bash
# Get Lambda execution role
ROLE_NAME=$(aws lambda get-function \
  --function-name production-empty-s3-bucket \
  --query 'Configuration.Role' \
  --output text \
  --region ap-south-2 | awk -F'/' '{print $NF}')

# Check role policies
aws iam list-attached-role-policies --role-name $ROLE_NAME
aws iam list-role-policies --role-name $ROLE_NAME
```

**Step 2: Verify Bucket Name**
```bash
# Check bucket name in Custom Resource
aws cloudformation describe-stack-resources \
  --stack-name e-commerce-stack \
  --logical-resource-id EmptyS3BucketResource \
  --query 'StackResources[0].PhysicalResourceId' \
  --region ap-south-2
```

**Step 3: Update IAM Policy (if needed)**
Update the CloudFormation template with correct permissions and redeploy.

### Issue: Lambda Function Times Out

**Symptoms:**
- CloudWatch logs show: "Task timed out after 300.00 seconds"
- Stack deletion fails
- Bucket contains many objects

**Cause:**
- Bucket has > 100,000 objects
- Large files taking too long to delete
- Network latency

**Resolution:**

**Option 1: Increase Timeout**
Edit `infrastructure/aws-stack.yaml`:
```yaml
EmptyS3BucketFunction:
  Type: AWS::Lambda::Function
  Properties:
    Timeout: 900  # Increase to 15 minutes (max)
```

**Option 2: Manually Empty Large Buckets**
```bash
# Empty bucket before deletion
aws s3 rm s3://production-ui-{AccountId}/ --recursive --region ap-south-2
```


### Issue: Lambda Logs Not Appearing

**Symptoms:**
- No logs in CloudWatch for Lambda function
- Cannot debug Lambda execution
- Log group doesn't exist

**Cause:**
- Lambda execution role missing CloudWatch Logs permissions
- Log group not created
- Lambda function never executed

**Resolution:**

**Step 1: Check if Log Group Exists**
```bash
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/production-empty-s3-bucket \
  --region ap-south-2
```

**Step 2: Manually Create Log Group (if needed)**
```bash
aws logs create-log-group \
  --log-group-name /aws/lambda/production-empty-s3-bucket \
  --region ap-south-2
```

**Step 3: Verify IAM Permissions**
Check that the Lambda execution role has CloudWatch Logs permissions.

---

## S3 Bucket Issues

### Issue: Cannot Access S3 Bucket Website

**Symptoms:**
- 403 Forbidden error when accessing bucket URL
- Website not loading
- Objects not publicly accessible

**Cause:**
- Bucket policy not applied
- Public access blocked
- Website configuration missing

**Resolution:**

**Step 1: Verify Bucket Policy**
```bash
BUCKET_NAME="production-ui-$(aws sts get-caller-identity --query Account --output text)"

aws s3api get-bucket-policy \
  --bucket $BUCKET_NAME \
  --region ap-south-2
```

**Step 2: Check Public Access Settings**
```bash
aws s3api get-public-access-block \
  --bucket $BUCKET_NAME \
  --region ap-south-2
```

**Step 3: Verify Website Configuration**
```bash
aws s3api get-bucket-website \
  --bucket $BUCKET_NAME \
  --region ap-south-2
```

### Issue: Files Not Uploading to S3

**Symptoms:**
- Upload fails with permission error
- Cannot write to bucket
- 403 Forbidden on PUT requests

**Cause:**
- IAM user/role lacks S3 write permissions
- Bucket policy restricts uploads
- Incorrect bucket name

**Resolution:**
```bash
# Test upload
echo "test" > test.txt
aws s3 cp test.txt s3://$BUCKET_NAME/test.txt --region ap-south-2

# Check IAM permissions
aws iam get-user-policy --user-name YOUR_USERNAME --policy-name YOUR_POLICY
```

---

## Database Connection Issues

### Issue: Cannot Connect to RDS from Local Machine

**Symptoms:**
- Connection timeout
- "Could not connect to server" error
- Database unreachable

**Cause:**
- Security group not allowing inbound traffic
- RDS not publicly accessible
- Incorrect endpoint or credentials

**Resolution:**

**Step 1: Verify RDS is Publicly Accessible**
```bash
aws rds describe-db-instances \
  --db-instance-identifier ecommerce-db \
  --query 'DBInstances[0].PubliclyAccessible' \
  --region ap-south-2
```

**Step 2: Check Security Group Rules**
```bash
# Get security group ID
SG_ID=$(aws rds describe-db-instances \
  --db-instance-identifier ecommerce-db \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text \
  --region ap-south-2)

# Check inbound rules
aws ec2 describe-security-groups \
  --group-ids $SG_ID \
  --query 'SecurityGroups[0].IpPermissions' \
  --region ap-south-2
```

**Step 3: Add Your IP to Security Group**
```bash
# Get your public IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Add inbound rule
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr $MY_IP/32 \
  --region ap-south-2
```


### Issue: Database Migrations Fail

**Symptoms:**
- Migration script returns error
- "relation already exists" error
- Connection refused

**Cause:**
- Database not accessible
- Migrations already applied
- Incorrect DATABASE_URL

**Resolution:**

**Step 1: Verify DATABASE_URL Format**
```bash
# Correct format
DATABASE_URL="postgres://username:password@endpoint:5432/database_name"

# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier ecommerce-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region ap-south-2
```

**Step 2: Test Connection**
```bash
# Using psql
psql "$DATABASE_URL" -c "SELECT version();"
```

**Step 3: Check Migration Status**
```bash
# From API directory
cd API
npm run migrate:status
```

---

## Elastic Beanstalk Issues

### Issue: Elastic Beanstalk Environment Unhealthy

**Symptoms:**
- Environment health shows "Severe" or "Degraded"
- Application not responding
- 502 Bad Gateway errors

**Cause:**
- Application crashed
- Port mismatch (app not listening on port 8080)
- Environment variables missing
- Database connection failed

**Resolution:**

**Step 1: Check Environment Health**
```bash
aws elasticbeanstalk describe-environment-health \
  --environment-name production-env \
  --attribute-names All \
  --region ap-south-2
```

**Step 2: View Application Logs**
```bash
# Request logs
aws elasticbeanstalk request-environment-info \
  --environment-name production-env \
  --info-type tail \
  --region ap-south-2

# Wait a moment, then retrieve
aws elasticbeanstalk retrieve-environment-info \
  --environment-name production-env \
  --info-type tail \
  --region ap-south-2
```

**Step 3: Check Environment Variables**
```bash
aws elasticbeanstalk describe-configuration-settings \
  --application-name production-api \
  --environment-name production-env \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`]' \
  --region ap-south-2
```

### Issue: Application Deployment Fails

**Symptoms:**
- Deployment shows "Failed"
- Environment rolls back to previous version
- Application version not created

**Cause:**
- Invalid application package
- Missing dependencies
- Build errors
- Health check failures

**Resolution:**

**Step 1: Validate Application Package**
```bash
# Ensure package.json has correct start script
cat API/package.json | grep '"start"'

# Should show: "start": "node dist/index.js"
```

**Step 2: Check Build Process**
```bash
cd API
npm install
npm run build
npm start  # Test locally
```

**Step 3: Review Deployment Events**
```bash
aws elasticbeanstalk describe-events \
  --environment-name production-env \
  --max-records 50 \
  --region ap-south-2
```

---

## General Troubleshooting Tips

### Enable Detailed Logging

Add verbose logging to CloudFormation:
```bash
aws cloudformation describe-stack-events \
  --stack-name e-commerce-stack \
  --region ap-south-2 \
  --output table
```

### Check AWS Service Health

Verify AWS services are operational:
- Visit: https://health.aws.amazon.com/health/status
- Check region: ap-south-2 (Asia Pacific - Hyderabad)

### Validate CloudFormation Template

Before deployment:
```bash
aws cloudformation validate-template \
  --template-body file://infrastructure/aws-stack.yaml \
  --region ap-south-2
```

### Clean Up Failed Stacks

If stack is stuck in failed state:
```bash
# Delete failed stack
aws cloudformation delete-stack \
  --stack-name e-commerce-stack \
  --region ap-south-2

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name e-commerce-stack \
  --region ap-south-2
```

---

## Getting Help

### AWS Support Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **CloudFormation User Guide**: https://docs.aws.amazon.com/cloudformation/
- **Lambda Developer Guide**: https://docs.aws.amazon.com/lambda/
- **AWS Forums**: https://forums.aws.amazon.com/

### Debugging Commands

```bash
# Get stack status
aws cloudformation describe-stacks \
  --stack-name e-commerce-stack \
  --region ap-south-2

# Get stack resources
aws cloudformation describe-stack-resources \
  --stack-name e-commerce-stack \
  --region ap-south-2

# Get stack events (last 20)
aws cloudformation describe-stack-events \
  --stack-name e-commerce-stack \
  --max-items 20 \
  --region ap-south-2

# Get Lambda function details
aws lambda get-function \
  --function-name production-empty-s3-bucket \
  --region ap-south-2

# Tail Lambda logs
aws logs tail /aws/lambda/production-empty-s3-bucket \
  --follow \
  --region ap-south-2
```

### Contact Information

For project-specific issues:
- Check the GitHub repository issues
- Review the design documentation in `.kiro/specs/s3-bucket-deletion-fix/`
- Consult the deployment guide in `infrastructure/`

---

## Preventive Measures

### Before Deployment

1. Validate CloudFormation template
2. Check AWS service quotas
3. Verify IAM permissions
4. Test in a non-production environment

### Before Deletion

1. Backup important data
2. Export database if needed
3. Download S3 bucket contents if required
4. Document current configuration

### Regular Maintenance

1. Monitor CloudWatch logs
2. Review AWS costs regularly
3. Update Lambda runtime versions
4. Keep CloudFormation template in version control
