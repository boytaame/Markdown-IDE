// --- START OF FILE LoginScreen.tsx --- (UPDATED)

import React from 'react';

interface LoginScreenProps {
  onLogin: () => void;
  isLoading: boolean; // NEW: Add a prop to track the loading state
}

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.988,35.617,44,29.93,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

// NEW: A simple spinner icon for the loading state
const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-primary">
      <div className="text-center p-12 bg-secondary rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-4xl font-bold text-accent mb-2">Markdown IDE</h1>
        <p className="text-text-secondary mb-8">Your personal space for Markdown.</p>
        <button
          onClick={onLogin}
          disabled={isLoading} // NEW: Disable button when loading
          className="w-full flex items-center justify-center bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-gray-200 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed" // NEW: Add disabled styles
        >
          {isLoading ? <SpinnerIcon /> : <GoogleIcon />} 
          {isLoading ? 'Signing in...' : 'Sign in with Google'} 
        </button>
        {/* CHANGED: Text updated to reflect real Google login */}
        <p className="text-xs text-gray-500 mt-6">
          You will be redirected to the official Google sign-in page.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;