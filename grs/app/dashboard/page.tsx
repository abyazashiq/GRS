'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/app/components/Dashboard';
import { ProtectedPage } from '@/app/components/ProtectedPage';


declare global {
  interface Window {
    google: any;
  }
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    
    if (!email) {
      router.push('/login');
    } else {
      setUserEmail(email);
      setUserName(name);
    }
  }, [router]);

  const handleLogout = () => {
    const email = localStorage.getItem('userEmail') || '';
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');

    if (window.google) {
      window.google.accounts.id.revoke(email, () => {
        console.log('Google session revoked');
      });
    }

    router.push('/login');
  };

  if (!isMounted || !userEmail || !userName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedPage requiredRole="student">
      <Dashboard userEmail={userEmail} userName={userName} userRole="student" onLogout={handleLogout} />
    </ProtectedPage>
  );
}
