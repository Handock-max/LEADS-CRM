import { UserRole } from '@/types/auth';

// Types pour les permissions
export type Permission = 
  | 'prospects:create'
  | 'prospects:read'
  | 'prospects:read_all'
  | 'prospects:read_assigned'
  | 'prospects:update'
  | 'prospects:update_own'
  | 'prospects:update_assigned'
  | 'prospects:delete'
  | 'prospects:delete_own'
  | 'prospects:assign'
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'workspaces:create'
  | 'workspaces:read'
  | 'workspaces:update'
  | 'workspaces:delete'
  | 'settings:read'
  | 'settings:update';

// Matrice des permissions par rôle
const PERMISSION_MATRIX: Record<UserRole['role'] | 'super_admin', Permission[]> = {
  super_admin: [
    'prospects:create',
    'prospects:read',
    'prospects:read_all',
    'prospects:update',
    'prospects:delete',
    'prospects:assign',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'workspaces:create',
    'workspaces:read',
    'workspaces:update',
    'workspaces:delete',
    'settings:read',
    'settings:update'
  ],
  admin: [
    'prospects:create',
    'prospects:read',
    'prospects:read_all',
    'prospects:update',
    'prospects:delete',
    'prospects:assign',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'workspaces:read',
    'workspaces:update',
    'settings:read',
    'settings:update'
  ],
  manager: [
    'prospects:create',
    'prospects:read',
    'prospects:read_all',
    'prospects:update_own',
    'prospects:update_assigned',
    'prospects:delete_own',
    'prospects:assign',
    'users:read',
    'workspaces:read',
    'settings:read'
  ],
  agent: [
    'prospects:create',
    'prospects:read_assigned',
    'prospects:update_own',
    'prospects:update_assigned',
    'prospects:delete_own',
    'workspaces:read',
    'settings:read'
  ]
};

export class PermissionService {
  /**
   * Vérifier si l'utilisateur a une permission spécifique
   */
  static hasPermission(userRole: UserRole['role'] | 'super_admin' | null, permission: Permission): boolean {
    if (!userRole) return false;
    
    const rolePermissions = PERMISSION_MATRIX[userRole];
    return rolePermissions?.includes(permission) || false;
  }

  /**
   * Obtenir toutes les permissions d'un rôle
   */
  static getPermissions(userRole: UserRole['role'] | 'super_admin' | null): Permission[] {
    if (!userRole) return [];
    return PERMISSION_MATRIX[userRole] || [];
  }

  /**
   * Vérifier si l'utilisateur peut effectuer une action sur une ressource
   */
  static canPerform(
    userRole: UserRole['role'] | 'super_admin' | null,
    action: 'create' | 'read' | 'update' | 'delete' | 'assign',
    resource: 'prospects' | 'users' | 'workspaces' | 'settings',
    context?: {
      isOwner?: boolean;
      isAssigned?: boolean;
      isSuperAdmin?: boolean;
    }
  ): boolean {
    if (!userRole) return false;

    // Super admin peut tout faire
    if (userRole === 'super_admin') return true;

    // Construire la permission à vérifier
    let permission: Permission;
    
    if (resource === 'prospects') {
      switch (action) {
        case 'create':
          permission = 'prospects:create';
          break;
        case 'read':
          // Logique spéciale pour la lecture des prospects
          if (userRole === 'agent') {
            permission = 'prospects:read_assigned';
          } else {
            permission = 'prospects:read_all';
          }
          break;
        case 'update':
          if (userRole === 'admin') {
            permission = 'prospects:update';
          } else if (context?.isOwner || context?.isAssigned) {
            permission = userRole === 'manager' ? 'prospects:update_own' : 'prospects:update_assigned';
          } else {
            return false;
          }
          break;
        case 'delete':
          if (userRole === 'admin') {
            permission = 'prospects:delete';
          } else if (context?.isOwner) {
            permission = 'prospects:delete_own';
          } else {
            return false; // Agents et managers ne peuvent pas supprimer les prospects assignés
          }
          break;
        case 'assign':
          permission = 'prospects:assign';
          break;
        default:
          return false;
      }
    } else {
      // Pour les autres ressources, construction simple
      permission = `${resource}:${action}` as Permission;
    }

    return this.hasPermission(userRole, permission);
  }

  /**
   * Vérifier les permissions spécifiques aux prospects
   */
  static canModifyProspect(
    userRole: UserRole['role'] | 'super_admin' | null,
    userId: string,
    prospect: {
      created_by?: string;
      assigned_to?: string;
    }
  ): boolean {
    return this.canPerform(userRole, 'update', 'prospects', {
      isOwner: prospect.created_by === userId,
      isAssigned: prospect.assigned_to === userId
    });
  }

  static canDeleteProspect(
    userRole: UserRole['role'] | 'super_admin' | null,
    userId: string,
    prospect: {
      created_by?: string;
      assigned_to?: string;
    }
  ): boolean {
    return this.canPerform(userRole, 'delete', 'prospects', {
      isOwner: prospect.created_by === userId,
      isAssigned: prospect.assigned_to === userId
    });
  }

  /**
   * Filtrer une liste de prospects selon les permissions
   */
  static filterProspects<T extends { created_by?: string; assigned_to?: string }>(
    prospects: T[],
    userRole: UserRole['role'] | 'super_admin' | null,
    userId: string
  ): T[] {
    if (!userRole) return [];

    // Super admin et admin voient tout
    if (userRole === 'super_admin' || userRole === 'admin') {
      return prospects;
    }

    // Manager voit tout dans son workspace (filtrage fait côté DB)
    if (userRole === 'manager') {
      return prospects;
    }

    // Agent voit seulement ses prospects + assignés
    if (userRole === 'agent') {
      return prospects.filter(prospect => 
        prospect.created_by === userId || prospect.assigned_to === userId
      );
    }

    return [];
  }

  /**
   * Vérifier l'accès à une page/route
   */
  static canAccessRoute(
    userRole: UserRole['role'] | 'super_admin' | null,
    route: string
  ): boolean {
    if (!userRole) return false;

    const routePermissions: Record<string, Permission[]> = {
      '/crm': ['prospects:read', 'prospects:read_assigned'],
      '/dashboard': ['prospects:read', 'prospects:read_assigned'],
      '/users': ['users:read'],
      '/settings': ['settings:read'],
      '/workspaces': ['workspaces:create'] // Super admin uniquement
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) return true; // Route publique

    return requiredPermissions.some(permission => 
      this.hasPermission(userRole, permission)
    );
  }

  /**
   * Obtenir les actions disponibles pour un prospect
   */
  static getAvailableActions(
    userRole: UserRole['role'] | 'super_admin' | null,
    userId: string,
    prospect: {
      created_by?: string;
      assigned_to?: string;
    }
  ): {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canAssign: boolean;
  } {
    return {
      canView: this.canPerform(userRole, 'read', 'prospects'),
      canEdit: this.canModifyProspect(userRole, userId, prospect),
      canDelete: this.canDeleteProspect(userRole, userId, prospect),
      canAssign: this.hasPermission(userRole, 'prospects:assign')
    };
  }
}

export default PermissionService;