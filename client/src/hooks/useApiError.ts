import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage, isValidationError, isAuthorizationError } from '../services/api';

export const useApiError = () => {
  const { showError } = useToast();

  const handleError = useCallback(
    (error: any, customMessage?: string) => {
      const errorMessage = customMessage || getErrorMessage(error);
      
      // Show appropriate error message based on error type
      if (isValidationError(error)) {
        showError(`Validation Error: ${errorMessage}`, 6000);
      } else if (isAuthorizationError(error)) {
        showError('Access Denied: You do not have permission to perform this action', 5000);
      } else {
        showError(errorMessage, 5000);
      }
    },
    [showError]
  );

  return { handleError };
};
