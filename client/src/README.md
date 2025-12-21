# Authentication Implementation

This directory contains the authentication implementation for the Cannabis Shop Management System frontend.

## Components

### AuthContext (`contexts/AuthContext.tsx`)
- Manages global authentication state
- Provides `useAuth` hook for accessing auth state and methods
- Handles token storage in localStorage
- Automatically initializes auth state on app load

### API Client (`services/api.ts`)
- Axios instance configured with base URL
- Request interceptor: Automatically injects JWT token from localStorage
- Response interceptor: Handles 401 errors and redirects to login

### Login Page (`pages/Login.tsx`)
- Login form with validation using react-hook-form
- Displays error messages for failed authentication
- Redirects to dashboard on successful login

### Protected Route (`components/ProtectedRoute.tsx`)
- Wrapper component for protected routes
- Redirects to login if user is not authenticated
- Supports role-based access control with `allowedRoles` prop
- Shows loading state while checking authentication

### Dashboard (`pages/Dashboard.tsx`)
- Example protected page
- Displays user information
- Demonstrates logout functionality

## Usage

### Protecting a Route

```tsx
import ProtectedRoute from './components/ProtectedRoute';

<Route
  path="/admin"
  element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

### Using Auth Context

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.username}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### Making Authenticated API Calls

```tsx
import apiClient from './services/api';

// Token is automatically injected by the interceptor
const response = await apiClient.get('/batches');
```

## Token Storage

- Tokens are stored in `localStorage` under the key `authToken`
- User data is stored in `localStorage` under the key `user`
- On 401 response, tokens are automatically cleared and user is redirected to login

## Requirements Validated

- **Requirement 1.2**: User authentication with valid credentials
- **Requirement 1.3**: Invalid authentication rejection
- **Requirement 14.2**: Authentication tokens for API requests
