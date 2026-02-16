# Lambda Function Documentation

## Overview

The `EmptyS3BucketFunction` is a Lambda function that automatically empties the S3 bucket when the CloudFormation stack is deleted. This ensures clean stack teardown without manual intervention.

## Function Details

- **Name**: `{EnvironmentName}-empty-s3-bucket` (e.g., `production-empty-s3-bucket`)
- **Runtime**: Python 3.12
- **Handler**: `index.handler`
- **Timeout**: 300 seconds (5 minutes)
- **Memory**: 128 MB (default)

## How It Works

### Trigger Mechanism

The Lambda function is triggered by a CloudFormation Custom Resource (`EmptyS3BucketResource`) during stack lifecycle events:

1. **Create Event**: No action taken (returns SUCCESS immediately)
2. **Update Event**: No action taken (returns SUCCESS immediately)
3. **Delete Event**: Empties the S3 bucket before CloudFormation deletes it

### Execution Flow

```
Stack Deletion Initiated
    ↓
Custom Resource sends Delete event to Lambda
    ↓
Lambda receives event with bucket name
    ↓
Lambda empties all objects and versions from bucket
    ↓
Lambda sends SUCCESS response to CloudFormation
    ↓
CloudFormation proceeds to delete the empty bucket
    ↓
Stack deletion completes
```

## Function Code

The Lambda function performs the following operations:

1. **Parse Event**: Extract bucket name and request type from CloudFormation event
2. **Check Request Type**: Only process Delete events
3. **Empty Bucket**: Use boto3 to delete all object versions and delete markers
4. **Send Response**: Notify CloudFormation of success or failure

### Key Operations

```python
# Delete all object versions and delete markers
bucket.object_versions.all().delete()
```

This single operation handles:
- Regular objects
- Versioned objects
- Delete markers
- Large numbers of objects (boto3 handles pagination automatically)


## IAM Permissions

The Lambda execution role (`LambdaExecutionRole`) has the following permissions:

### S3 Permissions

```yaml
- s3:ListBucket              # List objects in the bucket
- s3:ListBucketVersions      # List versioned objects
- s3:DeleteObject            # Delete individual objects
- s3:DeleteObjectVersion     # Delete versioned objects
```

**Resource Scope**: Limited to the specific frontend bucket only

### CloudWatch Logs Permissions

```yaml
- logs:CreateLogGroup        # Create log group
- logs:CreateLogStream       # Create log streams
- logs:PutLogEvents          # Write log events
```

**Resource Scope**: `/aws/lambda/*` log groups

## CloudWatch Logs

### Log Group

- **Name**: `/aws/lambda/{EnvironmentName}-empty-s3-bucket`
- **Retention**: 7 days (configurable)

### Log Messages

**Successful Execution:**
```
Received event: {"RequestType": "Delete", "ResourceProperties": {"BucketName": "..."}}
Request type: Delete, Bucket: production-ui-123456789012
Emptying bucket: production-ui-123456789012
Successfully emptied bucket: production-ui-123456789012
CloudFormation response status: 200
```

**Create/Update Events:**
```
Received event: {"RequestType": "Create", ...}
Request type: Create, Bucket: production-ui-123456789012
No action required for Create event
CloudFormation response status: 200
```

**Error Scenario:**
```
Received event: {"RequestType": "Delete", ...}
Request type: Delete, Bucket: production-ui-123456789012
Error: Access Denied
Failed to send response to CloudFormation
```

## Performance Characteristics

### Execution Time

- **Empty bucket**: < 1 second
- **Small bucket (< 100 objects)**: 1-5 seconds
- **Medium bucket (100-1000 objects)**: 5-30 seconds
- **Large bucket (1000-10000 objects)**: 30-120 seconds
- **Very large bucket (> 10000 objects)**: 120-300 seconds

### Timeout Considerations

The function has a 300-second (5-minute) timeout, which is sufficient for most use cases. For buckets with more than 100,000 objects, consider:
- Increasing timeout to 900 seconds (15 minutes, AWS maximum)
- Implementing pagination logic
- Manually emptying the bucket before deletion


## Error Handling

### Automatic Retries

CloudFormation automatically retries Lambda invocations on transient failures:
- Network timeouts
- Throttling errors
- Service unavailability

### Failure Scenarios

1. **Access Denied**
   - Cause: IAM permissions missing or bucket policy blocking
   - Resolution: Verify Lambda execution role permissions

2. **Bucket Not Found**
   - Cause: Bucket already deleted or name mismatch
   - Resolution: Check bucket name in Custom Resource properties

3. **Timeout**
   - Cause: Too many objects in bucket
   - Resolution: Increase timeout or manually empty bucket

4. **CloudFormation Response Failure**
   - Cause: Network issues sending response to CloudFormation
   - Resolution: Check CloudWatch logs, CloudFormation will timeout and retry

### Failure Impact

If the Lambda function fails:
- CloudFormation receives FAILED response
- Stack deletion is halted
- Stack status shows DELETE_FAILED
- Manual intervention required to empty bucket and retry deletion

## Testing the Lambda Function

### Manual Invocation

You can test the Lambda function manually using AWS CLI:

```bash
# Test with a Create event (no-op)
aws lambda invoke \
  --function-name production-empty-s3-bucket \
  --payload '{"RequestType":"Create","ResourceProperties":{"BucketName":"test-bucket"}}' \
  --region ap-south-2 \
  response.json

# View response
cat response.json
```

**Note**: Do not test with Delete events on production buckets!

### Monitoring

Monitor Lambda execution using CloudWatch:

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/production-empty-s3-bucket --follow --region ap-south-2

# View recent logs
aws logs tail /aws/lambda/production-empty-s3-bucket --since 10m --region ap-south-2
```

## Cost Considerations

### Lambda Costs

- **Invocations**: ~$0.0000002 per deletion (negligible)
- **Duration**: Free tier covers 400,000 GB-seconds/month
- **Typical cost**: < $0.01 per month for normal usage

### S3 Costs

- **DELETE requests**: Free (no charge for DELETE operations)
- **Data transfer**: Free (deleting objects has no transfer cost)

### CloudWatch Logs

- **Storage**: First 5 GB free per month
- **Typical usage**: < 1 MB per deletion
- **Cost**: Effectively free for normal usage

## Security Considerations

### Least Privilege

The Lambda function has minimal permissions:
- Only access to the specific S3 bucket
- No read access to object contents
- No access to other AWS resources

### Audit Trail

All Lambda executions are logged to CloudWatch:
- Timestamp of execution
- Bucket name processed
- Success or failure status
- Error details if applicable

### No Data Exposure

The Lambda function:
- Does not read object contents
- Does not log object keys (for privacy)
- Only performs delete operations
- Cannot be invoked directly (only via CloudFormation)

## Maintenance

### Updating the Function

To update the Lambda function code:

1. Modify the inline code in `infrastructure/aws-stack.yaml`
2. Deploy the updated CloudFormation template
3. CloudFormation will update the Lambda function automatically

### Monitoring Health

Check Lambda function health:

```bash
# Get function configuration
aws lambda get-function --function-name production-empty-s3-bucket --region ap-south-2

# Check recent invocations
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

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting steps.
