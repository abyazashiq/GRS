'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, isAdmin, isTeacher } from '@/lib/roleUtils';

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({
  children,
  requiredRole = 'student',
  fallbackPath = '/dashboard',
}) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');

        if (!userEmail) {
          router.push('/login');
          return;
        }

        const res = await fetch(`/api/user?email=${encodeURIComponent(userEmail)}`);
        const json = await res.json();
        const user = json.user;

        if (!user) {
          router.push('/login');
          return;
        }

        setUserRole(user.role as UserRole);

        // Check if user has required role
        const hasRequiredRole =
          requiredRole === 'student' ||
          (requiredRole === 'teacher' && isTeacher(user.role)) ||
          (requiredRole === 'admin' && isAdmin(user.role));

        if (!hasRequiredRole) {
          console.warn(`Access denied: User has ${user.role} but needs ${requiredRole}`);
          router.push(fallbackPath);
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Error checking access:', error);
        router.push(fallbackPath);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router, requiredRole, fallbackPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500">Your role: <span className="font-semibold">{userRole}</span></p>
          <p className="text-sm text-gray-500">Required role: <span className="font-semibold">{requiredRole}</span></p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPage;
