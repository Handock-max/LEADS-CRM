import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/lib/permissionService';
import { Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  /** Rôles autorisés à accéder à cette route */
  allowedRoles?: Array<'super_admin' | 'admin' | 'manager' | 'agent'>;
  
  /** Permissions requises pour accéder à cette route */
  requiredPermissions?: Permission[];
  
  /** Page de redirection en cas d'accès refusé */
  fallbackPath?: string;
  
  /** Composant à afficher en cas d'accès refusé */
  fallbackComponent?: React.ComponentType;
  
  /** Contenu de la route */
  children: React.ReactNode;
}

/**
 * Composant pour protéger les routes basé sur les rôles et permissions
 * 
 * @example
 * // Route accessible seulement aux admins
 * <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
 *   <AdminPanel />
 * </RoleBasedRoute>
 * 
 * @example
 * // Route avec permissions spécifiques
 * <RoleBasedRoute requiredPermissions={['users:create', 'users:read']}>
 *   <UserManagement />
 * </RoleBasedRoute>
 */
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  allowedRoles,
  requiredPermissions,
  fallbackPath = '/unauthorized',
  fallbackComponent: FallbackComponent,
  children
}) => {
  const { user, userRole, hasPermission, loading } = useAuth();
  const location = useLocation();

  // Afficher le loading pendant l'initialisation
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-yellow-600" />
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers login si pas authentifié
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rediriger si pas de rôle (problème de configuration)
  if (!userRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Vérifier les rôles autorisés
  if (allowedRoles && !allowedRoles.includes(userRole.role as any)) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Vérifier les permissions requises
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    
    if (!hasAllPermissions) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Accès autorisé
  return <>{children}</>;
};

/**
 * HOC pour protéger un composant avec des rôles spécifiques
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: Array<'super_admin' | 'admin' | 'manager' | 'agent'>,
  requiredPermissions?: Permission[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleBasedRoute 
        allowedRoles={allowedRoles} 
        requiredPermissions={requiredPermissions}
      >
        <Component {...props} />
      </RoleBasedRoute>
    );
  };
}

/**
 * Composants de route pré-configurés pour les rôles courants
 */
export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['super_admin']}>
    {children}
  </RoleBasedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['super_admin', 'admin']}>
    {children}
  </RoleBasedRoute>
);

export const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
    {children}
  </RoleBasedRoute>
);

export const AgentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'manager', 'agent']}>
    {children}
  </RoleBasedRoute>
);

export default RoleBasedRoute;