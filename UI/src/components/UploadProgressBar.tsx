import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

interface UploadProgressBarProps {
  totalFiles: number;
  uploadedFiles: number;
  isUploading: boolean;
  onCancel?: () => void;
}

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  totalFiles,
  uploadedFiles,
  isUploading,
  onCancel,
}) => {
  if (!isUploading || totalFiles === 0) {
    return null;
  }

  const progressPercentage = Math.round((uploadedFiles / totalFiles) * 100);

  return (
    <Paper
      sx={{
        p: 2,
        mt: 3,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2">
            Uploading Images
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {uploadedFiles} of {totalFiles} files
          </Typography>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Progress</Typography>
            <Typography variant="body2" color="primary">
              {progressPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {onCancel && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            fullWidth
          >
            Cancel Upload
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default UploadProgressBar;
