'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Sun, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';


declare global {
  interface Window {
    google: any;
  }
}

const LoginPage = () => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Load Google Sign-In Script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleCallback,
        });
        
        // Render the Google button
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'outline', 
            size: 'large',
            width: '100%',
          }
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleCallback = async (response: any) => {
    setIsLoading(true);
    setError('');

    try {
      // Decode the JWT token to get user info
      const credential = response.credential;
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const userData = JSON.parse(jsonPayload);

      // Check if email is from @ssn.edu.in domain (TEMPORARILY DISABLED - allowing all emails)
      // if (userData.email && userData.email.endsWith('@ssn.edu.in')) {
      if (userData.email) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('authToken', credential);

        // Fetch or create user via server-side API (bypasses RLS)
        try {
          const res = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.email, fullName: userData.name }),
          });

          const json = await res.json();

          if (!res.ok || !json.user) {
            console.error('API error fetching/creating user:', json.error);
            router.push('/dashboard');
            return;
          }

          const user = json.user;

          // Redirect based on user role
          const redirectPath =
            user.role === 'admin'
              ? '/admin/dashboard'
              : user.role === 'teacher'
                ? '/teacher/dashboard'
                : '/dashboard';

          router.push(redirectPath);
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Fallback to student dashboard if database fails
          router.push('/dashboard');
        }
      } else {
        setError('Sign-in failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
    }`}>
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`fixed top-6 right-6 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10 ${
          isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-blue-600 hover:bg-blue-50'
        }`}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Main Container */}
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg ${
              isDark ? 'bg-gradient-to-br from-blue-900 to-blue-800 text-blue-300' : 'bg-gradient-to-br from-blue-600 to-blue-500 text-white'
            }`}>
              <Building2 className="w-10 h-10" />
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              IT Department
            </h1>
            <p className={`text-xl font-medium ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Grievance Redressal System
            </p>
            <p className={`mt-2 text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              SSN College of Engineering
            </p>
          </div>

          {/* Login Card */}
          <div className={`rounded-2xl shadow-2xl p-8 transition-all duration-300 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="text-center mb-6">
              <h2 className={`text-2xl font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Welcome Back
              </h2>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Sign in with your SSN Institute account
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Google Sign In Button */}
            <div 
              id="google-signin-button" 
              className="flex justify-center"
              style={{ 
                display: 'flex',
                justifyContent: 'center',
                width: '100%'
              }}
            />

            {/* Info Box */}
            <div className={`mt-6 p-4 rounded-lg border ${
              isDark 
                ? 'bg-green-900/20 border-green-800 text-green-300' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <p className="text-sm font-medium mb-1">
                ✅ Any Email Accepted (Temporary)
              </p>
              <p className="text-xs opacity-90">
                All email addresses are now accepted. Sign in with any Google account.
              </p>
            </div>

            {/* Additional Info */}
            <div className={`mt-6 pt-6 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-sm font-medium mb-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    First time here?
                  </h3>
                  <p className={`text-xs ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Click the button above to sign in with your SSN Google account. Your account will be automatically created.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-8 text-center space-y-2 ${
            isDark ? 'text-gray-500' : 'text-gray-600'
          }`}>
            
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;