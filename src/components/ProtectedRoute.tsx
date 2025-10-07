import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole['role'][];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to unauthorized if no user role found
  if (!userRole) {
    console.log('ProtectedRoute: No user role, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute: Access granted', { 
    path: location.pathname, 
    user: user.email, 
    role: userRole.role,
    requiredRoles 
  });

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render protected content
  return <>{children}</>;
}

// Higher-order component for role-based route protection
export function withRoleProtection(
  Component: React.ComponentType,
  requiredRoles?: UserRole['role'][]
) {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Specific role-based route components
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function ManagerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'manager']}>
      {children}
    </ProtectedRoute>
  );
}

export function AgentRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'manager', 'agent']}>
      {children}
    </ProtectedRoute>
  );
}