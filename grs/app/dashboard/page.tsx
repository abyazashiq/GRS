'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/app/components/Dashboard';
import { getUserByEmail } from '@/lib/supabase/db';

declare global {
  interface Window {
    google: any;
  }
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
      // Fetch user role from database
      fetchUserRole(storedEmail);
    } else {
      // Redirect to login if not authenticated
      router.push('/login');
    }
  }, [router]);

  const fetchUserRole = async (email: string) => {
    try {
      const user = await getUserByEmail(email);
      if (user) {
        setUserRole(user.role as 'student' | 'teacher' | 'admin');
      } else {
        setUserRole('student'); // Default to student
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
      setUserRole('student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    
    // Revoke Google session if available
    if (window.google) {
      window.google.accounts.id.revoke(
        localStorage.getItem('userEmail') || '',
        () => {
          console.log('Google session revoked');
        }
      );
    }
    
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return null;
  }

  return <Dashboard userEmail={userEmail} userRole={userRole} onLogout={handleLogout} />;
}
