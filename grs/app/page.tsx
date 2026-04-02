'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (!email) {
      router.push('/login');
      return;
    }

    fetch(`/api/user?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((json) => {
        const role = json.user?.role;
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          router.push('/dashboard');
        }
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
