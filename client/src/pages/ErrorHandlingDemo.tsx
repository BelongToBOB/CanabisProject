import React, { useState } from 'react';
import { toast } from '../contexts/CustomToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Demo page to showcase error handling and user feedback features
 * This page is for testing purposes only
 */
const ErrorHandlingDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [shouldThrowError, setShouldThrowError] = useState(false);

  // Simulate async operation
  const simulateAsyncOperation = async (duration: number = 2000) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, duration));
    setIsLoading(false);
  };

  const handleSuccessToast = () => {
    toast.success("This is a success message!");
  };

  const handleErrorToast = () => {
    toast.error("This is an error message!");
  };

  const handleInfoToast = () => {
    toast.info("This is an info message!");
  };

  const handleWarningToast = () => {
    toast.info("This is a warning message!");
  };

  const handleMultipleToasts = () => {
    toast.success("First toast");
    setTimeout(() => toast.info("Second toast"), 500);
    setTimeout(() => toast.info("Third toast"), 1000);
    setTimeout(() => toast.error("Fourth toast"), 1500);
  };

  const handleLoadingDemo = async () => {
    await simulateAsyncOperation(3000);
    toast.success("Loading completed!");
  };

  // This will trigger the ErrorBoundary
  if (shouldThrowError) {
    throw new Error('Demo error to test ErrorBoundary');
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Simulating async operation..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Error Handling & User Feedback Demo
          </h1>
          <p className="text-gray-600 mb-8">
            This page demonstrates all error handling and user feedback features
          </p>

          {/* Toast Notifications Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Toast Notifications
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={handleSuccessToast}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Success Toast
              </button>
              <button
                onClick={handleErrorToast}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Error Toast
              </button>
              <button
                onClick={handleInfoToast}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Info Toast
              </button>
              <button
                onClick={handleWarningToast}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Warning Toast
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={handleMultipleToasts}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Show Multiple Toasts
              </button>
            </div>
          </section>

          {/* Loading States Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Loading States
            </h2>
            <div className="space-y-4">
              <div>
                <button
                  onClick={handleLoadingDemo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Show Full-Screen Loading (3s)
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Inline Loading (Small):</span>
                <LoadingSpinner size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Inline Loading (Medium):</span>
                <LoadingSpinner size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Inline Loading (Large):</span>
                <LoadingSpinner size="lg" />
              </div>
            </div>
          </section>

          {/* Error Boundary Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Error Boundary
            </h2>
            <p className="text-gray-600 mb-4">
              Click the button below to trigger an error that will be caught by the ErrorBoundary component.
            </p>
            <button
              onClick={() => setShouldThrowError(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Trigger Error Boundary
            </button>
          </section>

          {/* API Error Handling Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              API Error Handling
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>401 (Unauthorized) - Automatic redirect to login</li>
                <li>403 (Forbidden) - Access denied message with toast</li>
                <li>400 (Validation) - Validation error toast with details</li>
                <li>General errors - User-friendly error messages</li>
              </ul>
              <p className="mt-4 text-sm text-gray-600">
                To test these, try accessing protected resources or submitting invalid data in other pages.
              </p>
            </div>
          </section>

          {/* Documentation Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Documentation
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-900 mb-2">
                For complete documentation on the error handling system, see:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>
                  <code className="bg-blue-100 px-2 py-1 rounded">
                    client/src/components/ERROR_HANDLING.md
                  </code>
                </li>
                <li>
                  <code className="bg-blue-100 px-2 py-1 rounded">
                    client/src/IMPLEMENTATION_SUMMARY.md
                  </code>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandlingDemo;
