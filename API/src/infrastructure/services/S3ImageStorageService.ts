import { IImageStorageService } from '../../domain/services/IImageStorageService';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * S3 Image Storage Service
 * Stores images in AWS S3 bucket
 * Used for production environments
 */
export class S3ImageStorageService implements IImageStorageService {
  private bucketName: string;
  private region: string;
  // In a real app, we'd use @aws-sdk/client-s3
  // For this sample, we'll simulate the S3 interaction
  // or use a placeholder that returns the expected S3 keys.

  constructor(bucketName?: string, region?: string) {
    this.bucketName = bucketName || process.env.AWS_S3_BUCKET || 'product-images';
    this.region = region || process.env.AWS_REGION || 'us-east-1';
  }

  async uploadImage(
    file: Buffer,
    filename: string,
    productId: string
  ): Promise<string> {
    // Generate unique image ID
    const imageId = uuidv4();
    const ext = path.extname(filename);
    const storedFilename = `${imageId}${ext}`;

    // Create S3 key: `products/{productId}/{imageId}`
    const key = `${productId}/${storedFilename}`;

    console.log(`[S3Storage] Simulating upload to S3: s3://${this.bucketName}/${key}`);

    // TODO: Use S3Client to upload the buffer
    // const command = new PutObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: key,
    //   Body: file,
    //   ContentType: this.getContentType(ext)
    // });
    // await this.s3Client.send(command);

    return key;
  }

  async deleteImage(imageId: string): Promise<void> {
    // imageId is the S3 key
    console.log(`[S3Storage] Simulating deletion from S3: s3://${this.bucketName}/${imageId}`);

    // TODO: Use S3Client to delete
    // const command = new DeleteObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: imageId
    // });
    // await this.s3Client.send(command);
  }

  getImageUrl(imageId: string): string {
    if (!imageId) return '';

    // If it's already a full URL, return as-is
    if (imageId.startsWith('http')) return imageId;

    // Return the public S3 URL or CloudFront URL
    const baseUrl = process.env.CLOUDFRONT_URL || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    return `${baseUrl}/${imageId}`;
  }
}
