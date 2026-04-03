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
    <div className="min-h-screen bg-[var(--color-bg-light)] selection:bg-[var(--color-blue-soft)] selection:text-[var(--color-blue-deep)] font-sans overflow-hidden relative">
      {/* Premium Background Mesh */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[var(--color-blue-primary)]/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-[var(--color-blue-deep)]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="flex items-center justify-center min-h-screen px-6 py-12 relative z-10">
        <div className="w-full max-w-[480px] space-y-12">
          {/* Brand Identity - Premium Scaling */}
          <div className="text-center animate-blur-in">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-[36px] mb-10 bg-gradient-to-br from-[var(--color-blue-deep)] to-[var(--color-blue-primary)] text-white shadow-premium-xl transform hover:rotate-3 transition-transform duration-500 cursor-pointer group">
              <Building2 className="w-14 h-14 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
            </div>
            <h1 className="text-6xl font-black text-[var(--color-navy)] tracking-tighter leading-none mb-4">
              GRS <span className="text-[var(--color-blue-primary)]">PORTAL</span>
            </h1>
            <div className="flex flex-col items-center gap-3">
              <p className="text-lg font-bold text-[var(--color-blue-deep)] tracking-tight opacity-80">
                Institutional Redressal & Resolution
              </p>
              <div className="flex items-center gap-2">
                <div className="h-[2px] w-8 bg-[var(--color-blue-primary)] rounded-full" />
                <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[4px]">SSN COLLEGE OF ENGINEERING</span>
                <div className="h-[2px] w-8 bg-[var(--color-blue-primary)] rounded-full" />
              </div>
            </div>
          </div>

          {/* Authentication Card - Sleek Lobby Style */}
          <div className="bg-white rounded-[40px] shadow-premium-xl p-12 border border-[var(--color-border)] relative overflow-hidden group animate-scale-in">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-blue-deep)] via-[var(--color-blue-primary)] to-[var(--color-blue-deep)]" />
            
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-[var(--color-navy)] mb-3 tracking-tight">
                Authorized Access
              </h2>
              <p className="text-[15px] text-[var(--color-text-dim)] font-medium leading-relaxed max-w-[280px] mx-auto">
                Secure gateway for students, faculty, and administrative personnel.
              </p>
            </div>

            {/* Error Feedback - High Contrast */}
            {error && (
              <div className="mb-10 p-5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4 animate-shake">
                <AlertCircle className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-[var(--color-danger)] font-black uppercase tracking-wide leading-tight">{error}</p>
              </div>
            )}

            {/* SSO Integration - Refined Container */}
            <div className="relative group/btn mb-12">
              <div className="absolute -inset-2 bg-gradient-to-r from-[var(--color-blue-primary)]/10 to-[var(--color-blue-deep)]/10 rounded-[24px] blur-xl opacity-0 group-hover/btn:opacity-100 transition duration-700" />
              <div className="relative bg-[var(--color-bg-subtle)] p-1 rounded-[24px] border border-[var(--color-border)] group-hover/btn:border-[var(--color-blue-soft)] transition-colors">
                <div 
                  id="google-signin-button" 
                  className="flex justify-center transition-transform active:scale-95 py-2"
                />
              </div>
            </div>

            {/* Protocol Notice - Institutional Card */}
            <div className="p-8 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-[32px] group-hover:border-[var(--color-border-alt)] transition-colors">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-[var(--color-border)] flex items-center justify-center text-[var(--color-blue-primary)] shadow-premium-sm group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-[15px] font-black text-[var(--color-blue-deep)] uppercase tracking-wider">
                    Auto-Provisioning
                  </h3>
                  <p className="text-[12px] text-[var(--color-text-dim)] font-bold leading-relaxed">
                    Identity verified via <span className="text-[var(--color-blue-primary)] font-black">@ssn.edu.in</span>. New accounts are established instantly upon first validation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Footer */}
          <div className="text-center animate-blur-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-8 bg-[var(--color-border)]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-blue-primary)] opacity-40" />
              <div className="h-px w-8 bg-[var(--color-border)]" />
            </div>
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[5px]">
              © 2026 OFFICIAL GRIEVANCE SYSTEM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;