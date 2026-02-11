/**
 * Represents an uploaded file from Fastify multipart
 */
export interface UploadedFile {
  filename: string;
  encoding: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
}

/**
 * Result of image validation
 */
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}
