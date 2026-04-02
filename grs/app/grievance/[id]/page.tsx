'use client';

import React, { useState, useEffect } from 'react';
import { GrievanceDetail } from '@/app/components/GrievanceDetail';

export default function GrievancePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole') as 'student' | 'teacher' | 'admin' | null;
    setUserEmail(storedEmail);
    setUserRole(storedRole);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4FF]">
        <div className="w-10 h-10 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  return <GrievanceDetail userEmail={userEmail} userRole={userRole} />;
}
