import { NavigateFunction } from 'react-router-dom';
import { PermissionErrorContext, PermissionErrorType } from '@/types/errors';

/**
 * Utility functions for handling permission errors and redirects
 */
export class PermissionErrorUtils {
  /**
   * Navigate to the 403 unauthorized page with specific error context
   */
  static navigateToUnauthorized(
    navigate: NavigateFunction, 
    context: PermissionErrorContext = {}
  ) {
    navigate('/unauthorized', {
      state: { errorContext: context },
      replace: true
    });
  }

  /**
   * Create error context for page access denial
   */
  static createPageAccessError(
    path: string,
    requiredRole?: string,
    message?: string
  ): PermissionErrorContext {
    return {
      type: 'page_access',
      path,
      requiredRole,
      message: message || `Accès refusé à la page ${path}`
    };
  }

  /**
   * Create error context for action denial
   */
  static createActionDeniedError(
    action: string,
    resource: string,
    message?: string
  ): PermissionErrorContext {
    return {
      type: 'action_denied',
      action,
      resource,
      message: message || `Action ${action} refusée sur ${resource}`
    };
  }

  /**
   * Create error context for workspace access denial
   */
  static createWorkspaceAccessError(
    message?: string
  ): PermissionErrorContext {
    return {
      type: 'workspace_access',
      message: message || 'Accès au workspace refusé'
    };
  }

  /**
   * Create error context for insufficient role
   */
  static createRoleInsufficientError(
    requiredRole: string,
    message?: string
  ): PermissionErrorContext {
    return {
      type: 'role_insufficient',
      requiredRole,
      message: message || `Rôle ${requiredRole} requis`
    };
  }

  /**
   * Get user-friendly role name in French
   */
  static getRoleName(role: string): string {
    switch (role) {
      case 'super_admin':
        return 'Super Administrateur';
      case 'admin':
        return 'Administrateur';
      case 'manager':
        return 'Manager';
      case 'agent':
        return 'Agent';
      default:
        return role;
    }
  }

  /**
   * Get user-friendly action name in French
   */
  static getActionName(action: string): string {
    switch (action) {
      case 'create':
        return 'créer';
      case 'read':
        return 'consulter';
      case 'update':
        return 'modifier';
      case 'delete':
        return 'supprimer';
      case 'assign':
        return 'assigner';
      default:
        return action;
    }
  }

  /**
   * Get user-friendly resource name in French
   */
  static getResourceName(resource: string): string {
    switch (resource) {
      case 'prospects':
        return 'prospects';
      case 'users':
        return 'utilisateurs';
      case 'workspaces':
        return 'workspaces';
      case 'settings':
        return 'paramètres';
      default:
        return resource;
    }
  }
}

/**
 * Hook for handling permission errors in components
 */
export const usePermissionError = () => {
  const navigateToUnauthorized = (
    navigate: NavigateFunction,
    context: PermissionErrorContext = {}
  ) => {
    PermissionErrorUtils.navigateToUnauthorized(navigate, context);
  };

  return {
    navigateToUnauthorized,
    createPageAccessError: PermissionErrorUtils.createPageAccessError,
    createActionDeniedError: PermissionErrorUtils.createActionDeniedError,
    createWorkspaceAccessError: PermissionErrorUtils.createWorkspaceAccessError,
    createRoleInsufficientError: PermissionErrorUtils.createRoleInsufficientError
  };
};