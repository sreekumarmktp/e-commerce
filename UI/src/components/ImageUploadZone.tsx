import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { uploadImages } from '../store/slices/productImagesSlice';
import { selectImageCount, selectCanAddMoreImages } from '../store/selectors/productImagesSelectors';

interface ImageUploadZoneProps {
  productId: string;
  onUploadComplete?: () => void;
}

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSIONS = 200;
const MAX_DIMENSIONS = 4000;
const MAX_IMAGES_PER_PRODUCT = 7;

interface ValidationError {
  file: string;
  error: string;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  productId,
  onUploadComplete,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const imageCount = useSelector((state: RootState) => selectImageCount(state));
  const canAddMore = useSelector((state: RootState) => selectCanAddMoreImages(state));

  const validateFile = async (file: File): Promise<string | null> => {
    // Check format
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `Unsupported format. Supported formats: JPEG, PNG, SVG`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit`;
    }

    // Check dimensions for image files
    if (file.type !== 'image/svg+xml') {
      return await validateImageDimensions(file);
    }

    return null;
  };

  const validateImageDimensions = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (
            img.width < MIN_DIMENSIONS ||
            img.height < MIN_DIMENSIONS ||
            img.width > MAX_DIMENSIONS ||
            img.height > MAX_DIMENSIONS
          ) {
            resolve(
              `Image dimensions must be between 200x200 and 4000x4000 pixels`
            );
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          resolve('Failed to read image dimensions');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const errors: ValidationError[] = [];
    const validFiles: File[] = [];

    // Check if adding more images would exceed limit
    if (imageCount + files.length > MAX_IMAGES_PER_PRODUCT) {
      setValidationErrors([
        {
          file: 'Multiple files',
          error: `Cannot upload more than ${MAX_IMAGES_PER_PRODUCT} images per product. Current: ${imageCount}`,
        },
      ]);
      return;
    }

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = await validateFile(file);
      if (error) {
        errors.push({ file: file.name, error });
      } else {
        validFiles.push(file);
      }
    }

    setValidationErrors(errors);

    // Upload valid files
    if (validFiles.length > 0) {
      try {
        // Initialize progress for each file
        const progressMap: Record<string, number> = {};
        validFiles.forEach((file) => {
          progressMap[file.name] = 0;
        });
        setUploadProgress(progressMap);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
              if (updated[key] < 90) {
                updated[key] = Math.min(updated[key] + Math.random() * 20, 90);
              }
            });
            return updated;
          });
        }, 200);

        try {
          await dispatch(
            uploadImages({ productId, files: validFiles })
          ).unwrap();

          clearInterval(progressInterval);

          // Set progress to 100%
          setUploadProgress((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
              updated[key] = 100;
            });
            return updated;
          });

          // Clear progress after a delay
          setTimeout(() => {
            setUploadProgress({});
            if (onUploadComplete) {
              onUploadComplete();
            }
          }, 1000);
        } catch (uploadError) {
          clearInterval(progressInterval);
          console.error('Upload failed:', uploadError);
          setUploadProgress({});
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleFilePickerClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Product Images
      </Typography>

      {!canAddMore && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Maximum of {MAX_IMAGES_PER_PRODUCT} images per product reached
        </Alert>
      )}

      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: 'primary.main',
            mb: 2,
          }}
        />
        <Typography variant="h6" gutterBottom>
          Drag and drop images here
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or
        </Typography>
        <Button
          variant="contained"
          onClick={handleFilePickerClick}
          disabled={!canAddMore}
          sx={{ mt: 2 }}
        >
          Select Files
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Supported formats: JPEG, PNG, SVG | Max size: 5MB | Dimensions:
          200x200 to 4000x4000 pixels
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Images remaining: {MAX_IMAGES_PER_PRODUCT - imageCount}
        </Typography>
      </Paper>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_FORMATS.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {validationErrors.map((err, idx) => (
            <Alert key={idx} severity="error" sx={{ mb: 1 }}>
              <strong>{err.file}:</strong> {err.error}
            </Alert>
          ))}
        </Box>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Upload Progress
          </Typography>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <Box key={fileName} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">{fileName}</Typography>
                <Typography variant="body2">{Math.round(progress)}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ImageUploadZone;
