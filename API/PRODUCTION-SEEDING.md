# Production Database Seeding Guide

## Prerequisites

1. AWS credentials configured (via environment variables or AWS CLI)
2. S3 bucket created
3. PostgreSQL database accessible
4. Required environment variables set

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgres://user:password@host:port/database

# AWS S3 (required for image uploads)
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=ap-south-2
CLOUDFRONT_URL=https://your-cloudfront-domain.cloudfront.net  # Optional

# Node Environment
NODE_ENV=production
```

## Running the Seed Script

### Option 1: Using npm script with inline env vars

```bash
DATABASE_URL="postgres://user:pass@host:port/db" \
AWS_S3_BUCKET="your-bucket" \
AWS_REGION="ap-south-2" \
NODE_ENV="production" \
npm run seed:prod
```

### Option 2: Using .env file

1. Create or update `API/.env` with production values
2. Run: `npm run seed:prod`

### Option 3: From root directory

```bash
$env:DATABASE_URL="postgres://user:pass@host:port/db"; \
$env:AWS_S3_BUCKET="your-bucket"; \
$env:AWS_REGION="ap-south-2"; \
$env:NODE_ENV="production"; \
npm run seed:prod
```

## What Gets Seeded

1. **Default Cart**: A default cart record for guest users
2. **Admin User**: Email: `sreekumaronit@gmail.com`, Password: `Admin@123`
3. **Sample Products**: 10 ethnic fashion products with:
   - Product details (name, description, price, category, etc.)
   - Images downloaded from Unsplash and uploaded to S3
   - Product image records in the database

## Image Handling

The script:
1. Downloads images from Unsplash URLs
2. Uploads them to S3 at `s3://bucket-name/{productId}/{uuid}.jpg`
3. Stores the S3 key in the database
4. The API will serve these via CloudFront or S3 public URL

## Troubleshooting

### Foreign Key Constraint Errors
- Fixed: Products are now created before their images

### 404 Errors for Images
- Ensure `AWS_S3_BUCKET` is set
- Verify S3 bucket permissions allow public read or CloudFront is configured
- Check that `CLOUDFRONT_URL` matches your CloudFront distribution

### AWS Credentials
- Ensure AWS credentials are available via:
  - Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
  - AWS CLI configuration (`~/.aws/credentials`)
  - IAM role (if running on EC2/ECS)

### Missing Dependencies
If you see module errors, install dependencies:
```bash
cd API
npm install
```

## Verifying the Seed

After seeding, verify:

1. **Database records**:
```sql
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM product_images;
SELECT * FROM users WHERE email = 'sreekumaronit@gmail.com';
```

2. **S3 uploads**:
```bash
aws s3 ls s3://your-bucket-name/ --recursive
```

3. **API response**:
```bash
curl https://your-api-url/api/products
```
