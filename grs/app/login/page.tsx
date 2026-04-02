'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Building2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';


declare global {
  interface Window {
    google: any;
  }
}

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleCallback = useCallback(async (response: any) => {
    setIsLoading(true);
    setError('');

    try {
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

      if (userData.email) {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', userData.name || 'User');
        localStorage.setItem('authToken', credential);

        try {
          const res = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.email, fullName: userData.name }),
          });

          const json = await res.json();

          if (!res.ok) {
            setError(json.message || 'Identity verification failed. Please contact administration.');
            setIsLoading(false);
            return;
          }

          if (!json.user) {
            setError('Account initialization failed. Please retry.');
            setIsLoading(false);
            return;
          }

          const user = json.user;

          const redirectPath =
            user.role === 'admin'
              ? '/admin/dashboard'
              : user.role === 'teacher'
                ? '/teacher/dashboard'
                : '/dashboard';

          router.push(redirectPath);
        } catch (dbError) {
          console.error('Database error:', dbError);
          router.push('/dashboard');
        }
      } else {
        setError('Valid institutional credentials required for access.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Secure authentication failed. Please try again.');
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
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
        
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { 
            theme: 'outline', 
            size: 'large',
            width: '100%',
            shape: 'pill'
          }
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [handleGoogleCallback]);

  return (
    <div className="min-h-screen bg-[#F0F4FF] selection:bg-[#BFDBFE] selection:text-[#1E3A8A] font-sans overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#2563EB]/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#1E3A8A]/5 rounded-full blur-[100px]" />

      <div className="flex items-center justify-center min-h-screen px-6 py-12 relative z-10">
        <div className="w-full max-w-[440px] animate-fade-in">
          {/* Brand Identity */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] mb-8 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] transform hover:rotate-6 transition-transform">
              <Building2 className="w-12 h-12" strokeWidth={1.5} />
            </div>
            <h1 className="text-[42px] font-black text-[#0F172A] tracking-[-2px] leading-none mb-3">
              GRS <span className="text-[#2563EB]">Portal</span>
            </h1>
            <p className="text-[17px] font-bold text-[#1E3A8A] tracking-[-0.5px]">
              Grievance Redressal System
            </p>
            <div className="mt-4 flex flex-col items-center gap-1">
              <span className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[2px]">SSN Institute level</span>
              <div className="h-1 w-12 bg-[#2563EB] rounded-full opacity-20" />
            </div>
          </div>

          {/* Authentication Card */}
          <div className="bg-white rounded-[32px] shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] p-10 border border-[#DBEAFE] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A]" />
            
            <div className="text-center mb-8">
              <h2 className="text-[24px] font-bold text-[#0F172A] mb-2 tracking-[-0.5px]">
                Welcome Back
              </h2>
              <p className="text-[14px] text-[#64748B] font-medium leading-relaxed">
                Secure access for students, staff, and administration via institutional credentials.
              </p>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="mb-8 p-4 rounded-[16px] bg-[#FEF2F2] border border-[#FEE2E2] flex items-start gap-4 animate-shake">
                <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#DC2626] font-bold">{error}</p>
              </div>
            )}

            {/* SSO Integration */}
            <div className="relative group/btn">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#2563EB]/20 to-[#1E3A8A]/20 rounded-full blur opacity-0 group-hover/btn:opacity-100 transition duration-500" />
              <div className="relative">
                <div 
                  id="google-signin-button" 
                  className="flex justify-center transition-transform hover:scale-[1.02]"
                />
              </div>
            </div>

            {/* Protocol Notice */}
            <div className="mt-8 p-6 bg-[#F8FAFF] border border-[#DBEAFE] rounded-[24px]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-[12px] bg-white border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#1E3A8A] mb-1">
                    First-time Access
                  </h3>
                  <p className="text-[12px] text-[#64748B] font-medium leading-[1.6]">
                    Accounts are automatically provisioned upon initial login with your <span className="font-bold text-[#0F172A]">@ssn.edu.in</span> domain.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[12px] font-black text-[#94A3B8] uppercase tracking-[2px]">
              © 2026 SSN IT Department
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default LoginPage;