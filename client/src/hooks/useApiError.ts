import { useCallback } from 'react';
import { toast } from '../contexts/CustomToastContext';
import { getErrorMessage, isValidationError, isAuthorizationError } from '../services/api';

export const useApiError = () => {
  const handleError = useCallback(
    (error: any, customMessage?: string) => {
      const errorMessage = customMessage || getErrorMessage(error);
      
      // Show appropriate error message based on error type
      if (isValidationError(error)) {
        toast.error(`Validation Error: ${errorMessage}`);
      } else if (isAuthorizationError(error)) {
        toast.error('Access Denied: You do not have permission to perform this action');
      } else {
        toast.error(errorMessage);
      }
    },
    []
  );

  return { handleError };
};
