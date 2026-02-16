# CloudFormation Stack Deployment Script (PowerShell)
# This script deploys or updates the e-commerce CloudFormation stack

param(
    [string]$AwsRegion = "ap-south-2",
    [string]$StackName = "e-commerce-stack",
    [string]$EnvironmentName = "production",
    [string]$DBPassword
)

# Configuration
$ErrorActionPreference = "Stop"

Write-Host "=== CloudFormation Stack Deployment ===" -ForegroundColor Green
Write-Host ""

# Check if AWS CLI is installed
try {
    $null = aws --version
} catch {
    Write-Host "Error: AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
}

# Check if AWS credentials are configured
try {
    $null = aws sts get-caller-identity 2>&1
} catch {
    Write-Host "Error: AWS credentials are not configured" -ForegroundColor Red
    Write-Host "Please run: aws configure"
    exit 1
}

# Check if DB_PASSWORD is provided
if (-not $DBPassword) {
    if ($env:DB_PASSWORD) {
        $DBPassword = $env:DB_PASSWORD
    } else {
        $SecurePassword = Read-Host "Enter database password" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
        $DBPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
}

Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  Region: $AwsRegion"
Write-Host "  Stack Name: $StackName"
Write-Host "  Environment: $EnvironmentName"
Write-Host ""

# Get VPC and Subnet information
Write-Host "Fetching VPC and Subnet information..." -ForegroundColor Green
$VpcId = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $AwsRegion
$SubnetsRaw = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VpcId" --query "Subnets[*].SubnetId" --output text --region $AwsRegion
$Subnets = $SubnetsRaw -replace "`t", ","

if (-not $VpcId -or $VpcId -eq "None") {
    Write-Host "Error: Could not find default VPC" -ForegroundColor Red
    exit 1
}

Write-Host "  VPC ID: $VpcId"
Write-Host "  Subnets: $Subnets"
Write-Host ""

# Check if stack exists
Write-Host "Checking if stack exists..." -ForegroundColor Green
try {
    $null = aws cloudformation describe-stacks --stack-name $StackName --region $AwsRegion 2>&1
    Write-Host "Stack exists. This will be an UPDATE operation." -ForegroundColor Yellow
    $Operation = "update"
} catch {
    Write-Host "Stack does not exist. This will be a CREATE operation." -ForegroundColor Green
    $Operation = "create"
}
Write-Host ""

# Confirm deployment
$Confirm = Read-Host "Do you want to proceed with stack $Operation? (yes/no)"
if ($Confirm -ne "yes") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

# Deploy the stack
Write-Host "Deploying CloudFormation stack..." -ForegroundColor Green
$DeployCommand = @"
aws cloudformation deploy ``
  --template-file infrastructure/aws-stack.yaml ``
  --stack-name $StackName ``
  --capabilities CAPABILITY_IAM ``
  --parameter-overrides ``
    "EnvironmentName=$EnvironmentName" ``
    "DBPassword=$DBPassword" ``
    "VpcId=$VpcId" ``
    "Subnets=$Subnets" ``
  --region $AwsRegion
"@

try {
    Invoke-Expression $DeployCommand
    
    Write-Host ""
    Write-Host "✓ Stack deployment successful!" -ForegroundColor Green
    Write-Host ""
    
    # Get stack outputs
    Write-Host "Stack Outputs:" -ForegroundColor Green
    aws cloudformation describe-stacks `
      --stack-name $StackName `
      --query "Stacks[0].Outputs" `
      --output table `
      --region $AwsRegion
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "  1. Verify Lambda function: aws lambda get-function --function-name $EnvironmentName-empty-s3-bucket --region $AwsRegion"
    Write-Host "  2. Check CloudWatch logs: aws logs tail /aws/lambda/$EnvironmentName-empty-s3-bucket --follow --region $AwsRegion"
    Write-Host "  3. Test stack deletion (optional): aws cloudformation delete-stack --stack-name $StackName --region $AwsRegion"
    
} catch {
    Write-Host ""
    Write-Host "✗ Stack deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check CloudFormation events for details:" -ForegroundColor Yellow
    Write-Host "  aws cloudformation describe-stack-events --stack-name $StackName --region $AwsRegion --max-items 20"
    exit 1
}
