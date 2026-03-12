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
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedName = localStorage.getItem('userName');
    if (storedEmail) {
      setUserEmail(storedEmail);
      setUserName(storedName);
    } else {
      router.push('/login');
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

  if (!userEmail || !userName) {
    return null;
  }

  return (
    <ProtectedPage requiredRole="student">
      <Dashboard userEmail={userEmail} userName={userName} userRole="student" onLogout={handleLogout} />
    </ProtectedPage>
  );
}
