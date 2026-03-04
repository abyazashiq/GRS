// Role-based Access Control Utilities

export type UserRole = 'student' | 'teacher' | 'admin';

// Check if user has a specific role or higher
export function hasRole(userRole: UserRole | null, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    student: 0,
    teacher: 1,
    admin: 2,
  };

  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Check if user can access admin pages
export function isAdmin(userRole: UserRole | null): boolean {
  return hasRole(userRole, 'admin');
}

// Check if user can access teacher pages
export function isTeacher(userRole: UserRole | null): boolean {
  return hasRole(userRole, 'teacher');
}

// Check if user is student
export function isStudent(userRole: UserRole | null): boolean {
  return userRole === 'student';
}

// Get redirect URL based on user role
export function getDefaultRedirectPath(userRole: UserRole | null): string {
  switch (userRole) {
    case 'admin':
      return '/admin/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'student':
    default:
      return '/dashboard';
  }
}

// Format role for display
export function formatRole(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Administrator',
  };
  return roleNames[role];
}
