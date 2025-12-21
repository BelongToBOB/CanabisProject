# Error Handling and User Feedback System

This document describes the error handling and user feedback system implemented in the Cannabis Shop Management application.

## Components

### 1. ErrorBoundary Component
**Location:** `client/src/components/ErrorBoundary.tsx`

A React error boundary that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Features:**
- Catches unhandled errors in React components
- Displays user-friendly error message
- Shows detailed error information in development mode
- Provides "Try Again" and "Go to Home" buttons for recovery

**Usage:**
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2. Toast Notification System
**Location:** `client/src/contexts/ToastContext.tsx` and `client/src/components/ToastContainer.tsx`

A context-based toast notification system for displaying temporary success/error/info/warning messages.

**Features:**
- Four toast types: success, error, info, warning
- Auto-dismiss after configurable duration (default 5 seconds)
- Manual dismiss option
- Animated slide-in effect
- Stacked display for multiple toasts

**Usage:**
```tsx
import { useToast } from '../contexts/ToastContext';

const MyComponent = () => {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const handleAction = async () => {
    try {
      await someApiCall();
      showSuccess('Operation completed successfully!');
    } catch (error) {
      showError('Operation failed. Please try again.');
    }
  };
};
```

### 3. LoadingSpinner Component
**Location:** `client/src/components/LoadingSpinner.tsx`

A reusable loading spinner component with configurable size and optional message.

**Props:**
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `message`: Optional loading message
- `fullScreen`: Boolean to display as full-screen overlay (default: false)

**Usage:**
```tsx
import LoadingSpinner from '../components/LoadingSpinner';

// Inline spinner
<LoadingSpinner size="sm" message="Loading..." />

// Full-screen spinner
<LoadingSpinner fullScreen message="Loading data..." />
```

### 4. API Error Handling
**Location:** `client/src/services/api.ts`

Enhanced axios client with automatic error handling for authentication and authorization errors.

**Features:**
- Automatic token injection in request headers
- 401 (Unauthorized) handling: Clears auth state and redirects to login
- 403 (Forbidden) handling: Logs access denied errors
- Helper functions for error message extraction

**Helper Functions:**
```tsx
import { getErrorMessage, isValidationError, isAuthorizationError, isAuthenticationError } from '../services/api';

// Extract user-friendly error message
const message = getErrorMessage(error);

// Check error types
if (isValidationError(error)) {
  // Handle validation error (400)
}
if (isAuthorizationError(error)) {
  // Handle authorization error (403)
}
if (isAuthenticationError(error)) {
  // Handle authentication error (401)
}
```

### 5. useApiError Hook
**Location:** `client/src/hooks/useApiError.ts`

A custom hook that combines toast notifications with API error handling.

**Features:**
- Automatically displays appropriate toast messages based on error type
- Handles validation errors (400), authorization errors (403), and general errors
- Customizable error messages

**Usage:**
```tsx
import { useApiError } from '../hooks/useApiError';

const MyComponent = () => {
  const { handleError } = useApiError();

  const handleAction = async () => {
    try {
      await someApiCall();
    } catch (error) {
      handleError(error); // Automatically shows appropriate toast
      // Or with custom message:
      handleError(error, 'Custom error message');
    }
  };
};
```

## Implementation Pattern

### Standard Page Component Pattern

```tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useApiError } from '../hooks/useApiError';
import LoadingSpinner from '../components/LoadingSpinner';

const MyPage: React.FC = () => {
  const { showSuccess } = useToast();
  const { handleError } = useApiError();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/endpoint');
      setData(response.data);
    } catch (error) {
      handleError(error, 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      await apiClient.post('/endpoint', formData);
      showSuccess('Item created successfully');
      fetchData();
    } catch (error) {
      handleError(error, 'Failed to create item');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <div>
      {/* Page content */}
    </div>
  );
};
```

## Error Types and Handling

### 1. Validation Errors (400)
- Displayed with "Validation Error:" prefix
- Duration: 6 seconds
- Example: "Validation Error: Batch identifier is required"

### 2. Authentication Errors (401)
- Automatically redirects to login page
- Clears authentication state
- No manual handling required

### 3. Authorization Errors (403)
- Displayed with "Access Denied:" prefix
- Duration: 5 seconds
- Example: "Access Denied: You do not have permission to perform this action"

### 4. General Errors
- Displays extracted error message from API response
- Duration: 5 seconds
- Falls back to generic message if no specific message available

## Best Practices

1. **Always use LoadingSpinner for async operations**
   - Provides consistent loading UX
   - Use `fullScreen` for page-level loading
   - Use inline for component-level loading

2. **Use toast notifications for user feedback**
   - Success messages for completed actions
   - Error messages for failed operations
   - Info messages for informational updates
   - Warning messages for cautionary information

3. **Use useApiError hook for API error handling**
   - Simplifies error handling code
   - Provides consistent error messaging
   - Automatically handles different error types

4. **Display inline errors for form validation**
   - Use toast for submission errors
   - Use inline error messages for field-level validation
   - Combine both for comprehensive feedback

5. **Wrap application in ErrorBoundary**
   - Catches unhandled React errors
   - Prevents white screen of death
   - Provides recovery options

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 12.1**: Clear error messages for validation, authorization, and database errors
- **Requirement 12.2**: Error logging with timestamps and user context (console.error in ErrorBoundary)
- **401/403 handling**: Automatic redirect to login and access denied messages
- **Loading states**: Consistent loading indicators for all async operations
- **Validation errors**: Display of backend validation errors through toast system
