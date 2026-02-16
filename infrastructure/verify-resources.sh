#!/bin/bash
# Resource Verification Script for S3 Bucket Deletion Fix
# This script verifies that all new CloudFormation resources were created successfully

set -e

# Configuration
STACK_NAME="${1:-e-commerce-stack}"
VERBOSE="${2:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}$1${NC}"; }
print_error() { echo -e "${RED}$1${NC}"; }
print_info() { echo -e "${CYAN}$1${NC}"; }
print_warning() { echo -e "${YELLOW}$1${NC}"; }

print_info "=========================================="
print_info "CloudFormation Resource Verification"
print_info "Stack: $STACK_NAME"
print_info "=========================================="
echo ""

# Check if AWS CLI is available
print_info "Checking AWS CLI availability..."
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1)
    print_success "✓ AWS CLI found: $AWS_VERSION"
else
    print_error "✗ AWS CLI not found. Please install AWS CLI first."
    print_info "Download from: https://aws.amazon.com/cli/"
    exit 1
fi
echo ""

# Check AWS credentials
print_info "Verifying AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text)
    ARN=$(aws sts get-caller-identity --query 'Arn' --output text)
    print_success "✓ AWS credentials valid"
    print_info "  Account: $ACCOUNT"
    print_info "  User/Role: $ARN"
else
    print_error "✗ AWS credentials not configured or invalid"
    print_info "Run: aws configure"
    exit 1
fi
echo ""

# Verification results
STACK_STATUS_PASS=0
LAMBDA_ROLE_PASS=0
LAMBDA_FUNCTION_PASS=0
CUSTOM_RESOURCE_PASS=0
LOG_GROUP_PASS=0

# 1. Check Stack Status
print_info "1. Checking CloudFormation stack status..."
if STACK_INFO=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].[StackName,StackStatus]' \
    --output json 2>&1); then
    
    STACK_STATUS=$(echo "$STACK_INFO" | jq -r '.[1]')
    
    if [[ "$STACK_STATUS" == "UPDATE_COMPLETE" || "$STACK_STATUS" == "CREATE_COMPLETE" ]]; then
        print_success "✓ Stack status: $STACK_STATUS"
        STACK_STATUS_PASS=1
    else
        print_warning "⚠ Stack status: $STACK_STATUS"
        print_info "  Expected: UPDATE_COMPLETE or CREATE_COMPLETE"
    fi
else
    print_error "✗ Failed to get stack status"
    print_error "  Error: $STACK_INFO"
fi
echo ""

# 2. Check LambdaExecutionRole
print_info "2. Checking LambdaExecutionRole..."
if ROLE_INFO=$(aws cloudformation describe-stack-resource \
    --stack-name "$STACK_NAME" \
    --logical-resource-id LambdaExecutionRole \
    --query 'StackResourceDetail.[ResourceStatus,PhysicalResourceId]' \
    --output json 2>&1); then
    
    ROLE_STATUS=$(echo "$ROLE_INFO" | jq -r '.[0]')
    ROLE_ID=$(echo "$ROLE_INFO" | jq -r '.[1]')
    
    if [[ "$ROLE_STATUS" == "CREATE_COMPLETE" || "$ROLE_STATUS" == "UPDATE_COMPLETE" ]]; then
        print_success "✓ LambdaExecutionRole: $ROLE_STATUS"
        print_info "  Role Name: $ROLE_ID"
        LAMBDA_ROLE_PASS=1
        
        # Check role policies
        if [[ "$VERBOSE" == "true" ]]; then
            print_info "  Checking role policies..."
            if POLICIES=$(aws iam list-role-policies --role-name "$ROLE_ID" --output json 2>&1); then
                POLICY_COUNT=$(echo "$POLICIES" | jq '.PolicyNames | length')
                if [[ "$POLICY_COUNT" -gt 0 ]]; then
                    POLICY_NAMES=$(echo "$POLICIES" | jq -r '.PolicyNames | join(", ")')
                    print_success "  ✓ Inline policies: $POLICY_NAMES"
                fi
            fi
        fi
    else
        print_warning "⚠ LambdaExecutionRole status: $ROLE_STATUS"
    fi
else
    print_error "✗ LambdaExecutionRole not found or error occurred"
    print_error "  Error: $ROLE_INFO"
fi
echo ""

# 3. Check EmptyS3BucketFunction
print_info "3. Checking EmptyS3BucketFunction..."
if FUNCTION_INFO=$(aws cloudformation describe-stack-resource \
    --stack-name "$STACK_NAME" \
    --logical-resource-id EmptyS3BucketFunction \
    --query 'StackResourceDetail.[ResourceStatus,PhysicalResourceId]' \
    --output json 2>&1); then
    
    FUNCTION_STATUS=$(echo "$FUNCTION_INFO" | jq -r '.[0]')
    FUNCTION_NAME=$(echo "$FUNCTION_INFO" | jq -r '.[1]')
    
    if [[ "$FUNCTION_STATUS" == "CREATE_COMPLETE" || "$FUNCTION_STATUS" == "UPDATE_COMPLETE" ]]; then
        print_success "✓ EmptyS3BucketFunction: $FUNCTION_STATUS"
        print_info "  Function Name: $FUNCTION_NAME"
        LAMBDA_FUNCTION_PASS=1
        
        # Get function configuration
        if [[ "$VERBOSE" == "true" ]]; then
            print_info "  Checking function configuration..."
            if CONFIG=$(aws lambda get-function-configuration \
                --function-name "$FUNCTION_NAME" \
                --output json 2>&1); then
                
                RUNTIME=$(echo "$CONFIG" | jq -r '.Runtime')
                HANDLER=$(echo "$CONFIG" | jq -r '.Handler')
                TIMEOUT=$(echo "$CONFIG" | jq -r '.Timeout')
                MEMORY=$(echo "$CONFIG" | jq -r '.MemorySize')
                
                print_info "  Runtime: $RUNTIME"
                print_info "  Handler: $HANDLER"
                print_info "  Timeout: $TIMEOUT seconds"
                print_info "  Memory: $MEMORY MB"
                
                if [[ "$RUNTIME" == "python3.12" && "$TIMEOUT" == "300" ]]; then
                    print_success "  ✓ Configuration matches expected values"
                else
                    print_warning "  ⚠ Configuration differs from expected"
                fi
            fi
        fi
    else
        print_warning "⚠ EmptyS3BucketFunction status: $FUNCTION_STATUS"
    fi
else
    print_error "✗ EmptyS3BucketFunction not found or error occurred"
    print_error "  Error: $FUNCTION_INFO"
fi
echo ""

# 4. Check EmptyS3BucketResource (Custom Resource)
print_info "4. Checking EmptyS3BucketResource (Custom Resource)..."
if CUSTOM_RESOURCE_INFO=$(aws cloudformation describe-stack-resource \
    --stack-name "$STACK_NAME" \
    --logical-resource-id EmptyS3BucketResource \
    --query 'StackResourceDetail.[ResourceStatus,PhysicalResourceId]' \
    --output json 2>&1); then
    
    CUSTOM_RESOURCE_STATUS=$(echo "$CUSTOM_RESOURCE_INFO" | jq -r '.[0]')
    CUSTOM_RESOURCE_ID=$(echo "$CUSTOM_RESOURCE_INFO" | jq -r '.[1]')
    
    if [[ "$CUSTOM_RESOURCE_STATUS" == "CREATE_COMPLETE" || "$CUSTOM_RESOURCE_STATUS" == "UPDATE_COMPLETE" ]]; then
        print_success "✓ EmptyS3BucketResource: $CUSTOM_RESOURCE_STATUS"
        print_info "  Resource ID: $CUSTOM_RESOURCE_ID"
        CUSTOM_RESOURCE_PASS=1
    else
        print_warning "⚠ EmptyS3BucketResource status: $CUSTOM_RESOURCE_STATUS"
    fi
else
    print_error "✗ EmptyS3BucketResource not found or error occurred"
    print_error "  Error: $CUSTOM_RESOURCE_INFO"
fi
echo ""

# 5. Check CloudWatch Log Group
print_info "5. Checking CloudWatch Log Group..."
if LOG_GROUPS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/" \
    --output json 2>&1); then
    
    MATCHING_LOG_GROUP=$(echo "$LOG_GROUPS" | jq -r '.logGroups[] | select(.logGroupName | contains("EmptyS3Bucket")) | .logGroupName' | head -n 1)
    
    if [[ -n "$MATCHING_LOG_GROUP" ]]; then
        print_success "✓ CloudWatch Log Group found"
        print_info "  Log Group: $MATCHING_LOG_GROUP"
        LOG_GROUP_PASS=1
    else
        print_warning "⚠ CloudWatch Log Group not found"
        print_info "  This may be normal if the Lambda hasn't been invoked yet"
    fi
else
    print_warning "⚠ Could not check CloudWatch Log Groups"
    print_info "  Error: $LOG_GROUPS"
fi
echo ""

# 6. List all stack resources (optional)
if [[ "$VERBOSE" == "true" ]]; then
    print_info "6. Listing all stack resources..."
    if ALL_RESOURCES=$(aws cloudformation list-stack-resources \
        --stack-name "$STACK_NAME" \
        --query 'StackResourceSummaries[*].[LogicalResourceId,ResourceType,ResourceStatus]' \
        --output json 2>&1); then
        
        RESOURCE_COUNT=$(echo "$ALL_RESOURCES" | jq 'length')
        print_info "  Total resources: $RESOURCE_COUNT"
        
        echo "$ALL_RESOURCES" | jq -r '.[] | "  - \(.[0]) (\(.[1])): \(.[2])"'
    else
        print_warning "⚠ Could not list all resources"
    fi
    echo ""
fi

# Summary
print_info "=========================================="
print_info "Verification Summary"
print_info "=========================================="

TOTAL_CHECKS=5
PASSED_CHECKS=$((STACK_STATUS_PASS + LAMBDA_ROLE_PASS + LAMBDA_FUNCTION_PASS + CUSTOM_RESOURCE_PASS + LOG_GROUP_PASS))

echo ""
print_info "Results:"
echo -n "  Stack Status:          "
[[ $STACK_STATUS_PASS -eq 1 ]] && print_success "✓ PASS" || print_error "✗ FAIL"
echo -n "  LambdaExecutionRole:   "
[[ $LAMBDA_ROLE_PASS -eq 1 ]] && print_success "✓ PASS" || print_error "✗ FAIL"
echo -n "  EmptyS3BucketFunction: "
[[ $LAMBDA_FUNCTION_PASS -eq 1 ]] && print_success "✓ PASS" || print_error "✗ FAIL"
echo -n "  EmptyS3BucketResource: "
[[ $CUSTOM_RESOURCE_PASS -eq 1 ]] && print_success "✓ PASS" || print_error "✗ FAIL"
echo -n "  CloudWatch Log Group:  "
[[ $LOG_GROUP_PASS -eq 1 ]] && print_success "✓ PASS" || print_warning "⚠ WARN"

echo ""
print_info "Score: $PASSED_CHECKS/$TOTAL_CHECKS checks passed"

if [[ $PASSED_CHECKS -eq $TOTAL_CHECKS ]]; then
    print_success "=========================================="
    print_success "✓ ALL VERIFICATIONS PASSED"
    print_success "=========================================="
    exit 0
elif [[ $PASSED_CHECKS -ge 4 ]]; then
    print_warning "=========================================="
    print_warning "⚠ MOST VERIFICATIONS PASSED"
    print_warning "=========================================="
    print_info "Review warnings above for details"
    exit 0
else
    print_error "=========================================="
    print_error "✗ VERIFICATION FAILED"
    print_error "=========================================="
    print_info "Please review errors above and check:"
    print_info "  1. CloudFormation template was deployed correctly"
    print_info "  2. Stack update completed successfully"
    print_info "  3. AWS credentials have sufficient permissions"
    print_info ""
    print_info "For detailed troubleshooting, see:"
    print_info "  .kiro/specs/s3-bucket-deletion-fix/VERIFICATION.md"
    exit 1
fi
