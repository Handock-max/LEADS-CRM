import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/lib/permissionService';

interface PermissionGateProps {
  /** Permission requise pour afficher le contenu */
  permission?: Permission;
  
  /** Action et ressource pour vérification dynamique */
  action?: 'create' | 'read' | 'update' | 'delete' | 'assign';
  resource?: 'prospects' | 'users' | 'workspaces' | 'settings';
  
  /** Contexte pour les vérifications avancées */
  context?: {
    isOwner?: boolean;
    isAssigned?: boolean;
  };
  
  /** Rôles autorisés (alternative aux permissions) */
  allowedRoles?: Array<'super_admin' | 'admin' | 'manager' | 'agent'>;
  
  /** Contenu à afficher si l'accès est refusé */
  fallback?: React.ReactNode;
  
  /** Contenu à afficher si l'accès est autorisé */
  children: React.ReactNode;
  
  /** Mode de vérification : 'any' (au moins une condition) ou 'all' (toutes les conditions) */
  mode?: 'any' | 'all';
}

/**
 * Composant pour contrôler l'affichage basé sur les permissions
 * 
 * @example
 * // Vérifier une permission spécifique
 * <PermissionGate permission="prospects:create">
 *   <Button>Ajouter prospect</Button>
 * </PermissionGate>
 * 
 * @example
 * // Vérifier une action sur une ressource
 * <PermissionGate action="delete" resource="prospects" context={{ isOwner: true }}>
 *   <Button variant="destructive">Supprimer</Button>
 * </PermissionGate>
 * 
 * @example
 * // Vérifier des rôles spécifiques
 * <PermissionGate allowedRoles={['admin', 'manager']}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  action,
  resource,
  context,
  allowedRoles,
  fallback = null,
  children,
  mode = 'any'
}) => {
  const { hasPermission, canPerform, userRole } = useAuth();

  // Vérifier les permissions
  const hasRequiredPermission = permission ? hasPermission(permission) : true;
  
  // Vérifier l'action sur la ressource
  const canPerformAction = (action && resource) 
    ? canPerform(action, resource, context)
    : true;
  
  // Vérifier les rôles autorisés
  const hasAllowedRole = allowedRoles 
    ? allowedRoles.includes(userRole?.role as any)
    : true;

  // Déterminer l'accès selon le mode
  let hasAccess: boolean;
  
  if (mode === 'all') {
    // Toutes les conditions doivent être vraies
    hasAccess = hasRequiredPermission && canPerformAction && hasAllowedRole;
  } else {
    // Au moins une condition doit être vraie (mode par défaut)
    const conditions = [];
    
    if (permission) conditions.push(hasRequiredPermission);
    if (action && resource) conditions.push(canPerformAction);
    if (allowedRoles) conditions.push(hasAllowedRole);
    
    // Si aucune condition n'est spécifiée, autoriser l'accès
    hasAccess = conditions.length === 0 || conditions.some(condition => condition);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook pour vérifier les permissions dans les composants
 */
export const usePermissions = () => {
  const { hasPermission, canPerform, userRole, isSuperAdmin } = useAuth();

  return {
    hasPermission,
    canPerform,
    userRole: userRole?.role || null,
    isSuperAdmin,
    
    // Helpers pour les cas courants
    canCreateProspect: () => hasPermission('prospects:create'),
    canDeleteProspect: (prospect: { created_by?: string; assigned_to?: string }, userId: string) => 
      canPerform('delete', 'prospects', { 
        isOwner: prospect.created_by === userId,
        isAssigned: prospect.assigned_to === userId 
      }),
    canModifyProspect: (prospect: { created_by?: string; assigned_to?: string }, userId: string) => 
      canPerform('update', 'prospects', { 
        isOwner: prospect.created_by === userId,
        isAssigned: prospect.assigned_to === userId 
      }),
    canManageUsers: () => hasPermission('users:create'),
    canAccessSettings: () => hasPermission('settings:read'),
    isAdmin: () => userRole?.role === 'admin' || isSuperAdmin,
    isManager: () => ['admin', 'manager'].includes(userRole?.role || '') || isSuperAdmin,
    isAgent: () => userRole?.role === 'agent'
  };
};

export default PermissionGate;