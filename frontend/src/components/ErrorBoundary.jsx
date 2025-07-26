import React from 'react';
import { Alert, Button, Box } from '@mui/material';

export const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error) => {
      console.error('App error:', error);
      setHasError(true);
      setError(error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                setHasError(false);
                setError(null);
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          }
        >
          Something went wrong. Please try reloading the page.
          {error && (
            <details style={{ marginTop: 8 }}>
              <summary>Error Details</summary>
              <pre style={{ fontSize: '12px', marginTop: 4 }}>
                {error.toString()}
              </pre>
            </details>
          )}
        </Alert>
      </Box>
    );
  }

  return children;
};