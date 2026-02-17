# Production Seeding Issues - Fixed

## Issues Identified

### 1. Foreign Key Constraint Violation
**Problem**: The seed script tried to insert into `product_images` table before creating the product record.

**Fix**: Reordered operations to:
1. Insert product first
2. Download and upload image to S3
3. Insert into `product_images` (foreign key now satisfied)
4. Update product with final S3 path

### 2. Malformed Image URLs
**Problem**: Image paths like `4f5e0fe0-a5a8-403f-a59b-4daf83ef36ee.com/photo-1610030469983-98e550d6193c`

**Root Cause**: Extension extraction logic was finding `.com` in the domain name instead of the actual file extension.

**Fix**: Simplified to always use `.jpg` for Unsplash images since they don't have file extensions in URLs.

### 3. Missing S3 Integration
**Problem**: Script was only simulating S3 uploads, not actually uploading files.

**Fix**: 
- Added `@aws-sdk/client-s3` dependency
- Implemented actual S3 upload using `PutObjectCommand`
- Proper error handling and logging

### 4. Missing Product Images Bucket
**Problem**: CloudFormation stack only had UI bucket, no dedicated bucket for product images.

**Fix**: Updated `infrastructure/aws-stack.yaml` to include:
- `ProductImagesBucket` resource
- Public read policy for the bucket
- CORS configuration
- IAM permissions for EB instances to access the bucket
- Environment variables passed to EB (`AWS_S3_BUCKET`, `AWS_REGION`, `NODE_ENV`)

## Files Modified

1. **API/scripts/seed-prod.js**
   - Fixed operation order (product → image → product_images)
   - Added AWS SDK S3 client integration
   - Proper S3 key generation (`{productId}/{uuid}.jpg`)
   - Actual S3 uploads with error handling

2. **API/package.json**
   - Added `@aws-sdk/client-s3` dependency

3. **API/env.example**
   - Added AWS S3 configuration variables

4. **infrastructure/aws-stack.yaml**
   - Added `ProductImagesBucket` resource
   - Added bucket policy for public read access
   - Added IAM policy for EB to access S3
   - Added environment variables to EB configuration
   - Added output for product images bucket name

## New Files Created

1. **API/PRODUCTION-SEEDING.md**
   - Comprehensive guide for running production seeding
   - Environment variable documentation
   - Troubleshooting section

2. **API/scripts/run-prod-seed.ps1**
   - PowerShell script to run seeding with proper env vars
   - Pre-configured for your AWS account

## Next Steps

### Option 1: Quick Fix (Use Existing Infrastructure)
Run the seed script now with the UI bucket:
```powershell
$env:DATABASE_URL="postgres://dbadmin:pgdbadminpwd@e-commerce-stack-dbinstance-as1ki9hceuro.cxk286wca5s7.ap-south-2.rds.amazonaws.com:5432/ecommerce_db"
$env:AWS_S3_BUCKET="production-ui-505833152145"
$env:AWS_REGION="ap-south-2"
$env:NODE_ENV="production"
cd API
npm run seed:prod
```

### Option 2: Proper Fix (Update CloudFormation Stack)
1. Update your CloudFormation stack to add the product images bucket:
```powershell
cd infrastructure
.\deploy-stack.ps1  # Or use AWS Console to update the stack
```

2. After stack update completes, get the new bucket name from outputs:
```powershell
aws cloudformation describe-stacks --stack-name e-commerce-stack --query "Stacks[0].Outputs[?OutputKey=='ProductImagesBucketName'].OutputValue" --output text
```

3. Run the seed script:
```powershell
.\API\scripts\run-prod-seed.ps1
```

## How Images Are Served

After seeding:
- Images stored in S3: `s3://production-product-images-505833152145/{productId}/{uuid}.jpg`
- API serves via: `https://production-product-images-505833152145.s3.ap-south-2.amazonaws.com/{productId}/{uuid}.jpg`
- S3ImageStorageService automatically generates the correct URLs

## Verification

After successful seeding:

1. Check database:
```sql
SELECT id, name, primary_image_path FROM products;
SELECT product_id, image_path, is_primary FROM product_images;
```

2. Check S3:
```powershell
aws s3 ls s3://production-product-images-505833152145/ --recursive
```

3. Test API:
```powershell
curl http://production-505833152145.ap-south-2.elasticbeanstalk.com/api/products
```
