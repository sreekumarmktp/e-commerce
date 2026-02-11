import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary caught error:', error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ py: 4 }}>
          <Alert severity="error" action={<Button onClick={this.handleReload}>Reload</Button>}>
            <AlertTitle>Something went wrong</AlertTitle>
            {this.state.error?.message || 'Unexpected UI error'}
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}

