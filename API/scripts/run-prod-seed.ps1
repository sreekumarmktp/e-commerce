# PowerShell script to run production seeding with proper environment variables
# Usage: .\run-prod-seed.ps1

# Set your AWS Account ID (find it in AWS Console or run: aws sts get-caller-identity)
$AWS_ACCOUNT_ID = "505833152145"  # Replace with your actual account ID
$AWS_REGION = "ap-south-2"
$ENVIRONMENT = "production"

# Database connection (already working from your terminal)
$DATABASE_URL = "postgres://dbadmin:pgdbadminpwd@e-commerce-stack-dbinstance-as1ki9hceuro.cxk286wca5s7.ap-south-2.rds.amazonaws.com:5432/ecommerce_db"

# S3 Configuration - Using dedicated product images bucket
$S3_BUCKET = "$ENVIRONMENT-product-images-$AWS_ACCOUNT_ID"

# Set environment variables
$env:DATABASE_URL = $DATABASE_URL
$env:AWS_S3_BUCKET = $S3_BUCKET
$env:AWS_REGION = $AWS_REGION
$env:NODE_ENV = "production"

Write-Host "Running production seed with:" -ForegroundColor Green
Write-Host "  Database: $DATABASE_URL" -ForegroundColor Cyan
Write-Host "  S3 Bucket: $S3_BUCKET" -ForegroundColor Cyan
Write-Host "  Region: $AWS_REGION" -ForegroundColor Cyan
Write-Host ""

# Run the seed script
cd API
npm run seed:prod
