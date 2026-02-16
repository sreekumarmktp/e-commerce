#!/usr/bin/env pwsh
# Resource Verification Script for S3 Bucket Deletion Fix
# This script verifies that all new CloudFormation resources were created successfully

param(
    [string]$StackName = "e-commerce-stack",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "=========================================="
Write-Info "CloudFormation Resource Verification"
Write-Info "Stack: $StackName"
Write-Info "=========================================="
Write-Host ""

# Check if AWS CLI is available
Write-Info "Checking AWS CLI availability..."
try {
    $awsVersion = aws --version 2>&1
    Write-Success "✓ AWS CLI found: $awsVersion"
} catch {
    Write-Error "✗ AWS CLI not found. Please install AWS CLI first."
    Write-Info "Download from: https://aws.amazon.com/cli/"
    exit 1
}
Write-Host ""

# Check AWS credentials
Write-Info "Verifying AWS credentials..."
try {
    $identity = aws sts get-caller-identity --output json 2>&1 | ConvertFrom-Json
    Write-Success "✓ AWS credentials valid"
    Write-Info "  Account: $($identity.Account)"
    Write-Info "  User/Role: $($identity.Arn)"
} catch {
    Write-Error "✗ AWS credentials not configured or invalid"
    Write-Info "Run: aws configure"
    exit 1
}
Write-Host ""

# Verification results
$results = @{
    StackStatus = $false
    LambdaRole = $false
    LambdaFunction = $false
    CustomResource = $false
    LogGroup = $false
}

# 1. Check Stack Status
Write-Info "1. Checking CloudFormation stack status..."
try {
    $stackInfo = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --query 'Stacks[0].[StackName,StackStatus]' `
        --output json 2>&1 | ConvertFrom-Json
    
    $stackStatus = $stackInfo[1]
    
    if ($stackStatus -eq "UPDATE_COMPLETE" -or $stackStatus -eq "CREATE_COMPLETE") {
        Write-Success "✓ Stack status: $stackStatus"
        $results.StackStatus = $true
    } else {
        Write-Warning "⚠ Stack status: $stackStatus"
        Write-Info "  Expected: UPDATE_COMPLETE or CREATE_COMPLETE"
    }
} catch {
    Write-Error "✗ Failed to get stack status"
    Write-Error "  Error: $_"
}
Write-Host ""

# 2. Check LambdaExecutionRole
Write-Info "2. Checking LambdaExecutionRole..."
try {
    $roleInfo = aws cloudformation describe-stack-resource `
        --stack-name $StackName `
        --logical-resource-id LambdaExecutionRole `
        --query 'StackResourceDetail.[ResourceStatus,PhysicalResourceId]' `
        --output json 2>&1 | ConvertFrom-Json
    
    $roleStatus = $roleInfo[0]
    $roleId = $roleInfo[1]
    
    if ($roleStatus -eq "CREATE_COMPLETE" -or $roleStatus -eq "UPDATE_COMPLETE") {
        Write-Success "✓ LambdaExecutionRole: $roleStatus"
        Write-Info "  Role Name: $roleId"
        $results.LambdaRole = $true
        
        # Check role policies
        if ($Verbose) {
            Write-Info "  Checking role policies..."
            $policies = aws iam list-role-policies --role-name $roleId --output json 2>&1 | ConvertFrom-Json
            if ($policies.PolicyNames.Count -gt 0) {
                Write-Success "  ✓ Inline policies: $($policies.PolicyNames -join ', ')"
            }
        }
    } else {
        Write-Warning "⚠ LambdaExecutionRole status: $roleStatus"
    }
} catch {
    Write-Error "✗ LambdaExecutionRole not found or error occurred"
    Write-Error "  Error: $_"
}
Write-Host ""

# 3. Check EmptyS3BucketFunction
Write-Info "3. Checking EmptyS3BucketFunction..."
try {
    $functionInfo = aws cloudformation describe-stack-resource `
        --stack-name $StackName `
        --logical-resource-id EmptyS3BucketFunction `
        --query 'StackResourceDetail.[ResourceStatus,PhysicalResourceId]' `
        --output json 2>&1 | ConvertFrom-Json
    
    $functionStatus = $functionInfo[0]
    $functionName = $functionInfo[1]
    
    if ($functionStatus -eq "CREATE_COMPLETE" -or $functionStatus -eq "UPDATE_COMPLETE") {
        Write-Success "✓ EmptyS3BucketFunction: $functionStatus"
        Write-Info "  Function Name: $functionName"
        $results.LambdaFunction = $true
        
        # Get function configuration
        if ($Verbose) {
            Write-Info "  Checking function configuration..."
            $config = aws lambda get-function-configuration `
                --function-name $functionName `
                --output json 2>&1 | ConvertFrom-Json
            
            Write-Info "  Runtime: $($config.Runtime)"
            Write-Info "  Handler: $($config.Handler)"
            Write-Info "  Timeout: $($config.Timeout) seconds"
            Write-Info "  Memory: $($config.MemorySize) MB"
            
            if ($config.Runtime -eq "python3.12" -and $config.Timeout -eq 300) {
                Write-Success "  ✓ Configuration matches expected values"
            } else {
                Write-Warning "  ⚠ Configuration differs from expected"
            }
        }
    } else {
        Write-Warning "⚠ EmptyS3BucketFunction status: $functionStatus"
    }
} catch {
    Write-Error "✗ EmptyS3BucketFunction not found or error occurred"
    Write-Error "  Error: $_"
}
Write-Host ""

# 4. Check EmptyS3BucketResource (Custom Resource)
Write-Info "4. Checking EmptyS3BucketResource (Custom Resource)..."
try {
    $customResourceInfo = aws cloudformation describe-stack-resource `
        --stack-name $StackName `
        --logical-resource-id EmptyS3BucketResource `
        --query 'StackResourceDetail.[ResourceStatus,PhysicalResourceId]' `
        --output json 2>&1 | ConvertFrom-Json
    
    $customResourceStatus = $customResourceInfo[0]
    $customResourceId = $customResourceInfo[1]
    
    if ($customResourceStatus -eq "CREATE_COMPLETE" -or $customResourceStatus -eq "UPDATE_COMPLETE") {
        Write-Success "✓ EmptyS3BucketResource: $customResourceStatus"
        Write-Info "  Resource ID: $customResourceId"
        $results.CustomResource = $true
    } else {
        Write-Warning "⚠ EmptyS3BucketResource status: $customResourceStatus"
    }
} catch {
    Write-Error "✗ EmptyS3BucketResource not found or error occurred"
    Write-Error "  Error: $_"
}
Write-Host ""

# 5. Check CloudWatch Log Group
Write-Info "5. Checking CloudWatch Log Group..."
try {
    $logGroups = aws logs describe-log-groups `
        --log-group-name-prefix "/aws/lambda/" `
        --output json 2>&1 | ConvertFrom-Json
    
    $matchingLogGroup = $logGroups.logGroups | Where-Object { $_.logGroupName -like "*EmptyS3Bucket*" }
    
    if ($matchingLogGroup) {
        Write-Success "✓ CloudWatch Log Group found"
        Write-Info "  Log Group: $($matchingLogGroup.logGroupName)"
        $results.LogGroup = $true
    } else {
        Write-Warning "⚠ CloudWatch Log Group not found"
        Write-Info "  This may be normal if the Lambda hasn't been invoked yet"
    }
} catch {
    Write-Warning "⚠ Could not check CloudWatch Log Groups"
    Write-Info "  Error: $_"
}
Write-Host ""

# 6. List all stack resources (optional)
if ($Verbose) {
    Write-Info "6. Listing all stack resources..."
    try {
        $allResources = aws cloudformation list-stack-resources `
            --stack-name $StackName `
            --query 'StackResourceSummaries[*].[LogicalResourceId,ResourceType,ResourceStatus]' `
            --output json 2>&1 | ConvertFrom-Json
        
        Write-Info "  Total resources: $($allResources.Count)"
        foreach ($resource in $allResources) {
            $status = $resource[2]
            $statusColor = if ($status -like "*COMPLETE") { "Green" } elseif ($status -like "*FAILED") { "Red" } else { "Yellow" }
            Write-Host "  - $($resource[0]) ($($resource[1])): " -NoNewline
            Write-Host $status -ForegroundColor $statusColor
        }
    } catch {
        Write-Warning "⚠ Could not list all resources"
    }
    Write-Host ""
}

# Summary
Write-Info "=========================================="
Write-Info "Verification Summary"
Write-Info "=========================================="

$totalChecks = $results.Count
$passedChecks = ($results.Values | Where-Object { $_ -eq $true }).Count

Write-Host ""
Write-Info "Results:"
Write-Host "  Stack Status:        " -NoNewline; if ($results.StackStatus) { Write-Success "✓ PASS" } else { Write-Error "✗ FAIL" }
Write-Host "  LambdaExecutionRole: " -NoNewline; if ($results.LambdaRole) { Write-Success "✓ PASS" } else { Write-Error "✗ FAIL" }
Write-Host "  EmptyS3BucketFunction: " -NoNewline; if ($results.LambdaFunction) { Write-Success "✓ PASS" } else { Write-Error "✗ FAIL" }
Write-Host "  EmptyS3BucketResource: " -NoNewline; if ($results.CustomResource) { Write-Success "✓ PASS" } else { Write-Error "✗ FAIL" }
Write-Host "  CloudWatch Log Group:  " -NoNewline; if ($results.LogGroup) { Write-Success "✓ PASS" } else { Write-Warning "⚠ WARN" }

Write-Host ""
Write-Info "Score: $passedChecks/$totalChecks checks passed"

if ($passedChecks -eq $totalChecks) {
    Write-Success "=========================================="
    Write-Success "✓ ALL VERIFICATIONS PASSED"
    Write-Success "=========================================="
    exit 0
} elseif ($passedChecks -ge 4) {
    Write-Warning "=========================================="
    Write-Warning "⚠ MOST VERIFICATIONS PASSED"
    Write-Warning "=========================================="
    Write-Info "Review warnings above for details"
    exit 0
} else {
    Write-Error "=========================================="
    Write-Error "✗ VERIFICATION FAILED"
    Write-Error "=========================================="
    Write-Info "Please review errors above and check:"
    Write-Info "  1. CloudFormation template was deployed correctly"
    Write-Info "  2. Stack update completed successfully"
    Write-Info "  3. AWS credentials have sufficient permissions"
    Write-Info ""
    Write-Info "For detailed troubleshooting, see:"
    Write-Info "  .kiro/specs/s3-bucket-deletion-fix/VERIFICATION.md"
    exit 1
}
