import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

const ErrorBoundary = () => {
  const error = useRouteError();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            {isRouteErrorResponse(error) ? 'Page Not Found' : 'Something went wrong'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isRouteErrorResponse(error)
              ? "Sorry, we couldn't find the page you're looking for."
              : error.message || 'An unexpected error occurred.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary; 