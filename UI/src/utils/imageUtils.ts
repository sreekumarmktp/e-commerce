/**
 * Constructs a full URL for product images
 * @param imagePath - The image path or filename
 * @returns Full URL to the image
 */
export const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';

  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Default to localhost:3001/uploads for development
  const baseUrl = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/uploads`
    : 'http://localhost:3001/uploads';

  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  return `${baseUrl}/${cleanPath}`;
};
