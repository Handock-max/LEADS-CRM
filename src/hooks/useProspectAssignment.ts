import { useState, useCallback } from 'react';
import { prospectService } from '@/lib/prospectService';
import { workspaceService } from '@/lib/workspaceService';
import { useAuth } from '@/contexts/AuthContext';
import { Prospect } from '@/lib/mockData';

interface WorkspaceUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

export function useProspectAssignment() {
  const { userRole, user, workspace } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);

  // Charger les utilisateurs du workspace pour l'assignation
  const loadWorkspaceUsers = useCallback(async () => {
    if (!workspace?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await workspaceService.getWorkspaceUsers(workspace.id);
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setWorkspaceUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  // Assigner un prospect à un utilisateur
  const assignProspect = useCallback(async (
    prospectId: string,
    assignedToUserId: string
  ): Promise<{ success: boolean; data?: Prospect; error?: string }> => {
    if (!user?.id || !workspace?.id) {
      return { success: false, error: 'Utilisateur ou workspace non défini' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: assignError } = await prospectService.assignProspect(
        prospectId,
        assignedToUserId,
        userRole?.role,
        user.id,
        workspace.id
      );

      if (assignError) {
        setError(assignError.message);
        return { success: false, error: assignError.message };
      }

      return { success: true, data: data || undefined };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'assignation';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, userRole?.role, workspace?.id]);

  // Désassigner un prospect
  const unassignProspect = useCallback(async (
    prospectId: string
  ): Promise<{ success: boolean; data?: Prospect; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Utilisateur non défini' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: unassignError } = await prospectService.unassignProspect(
        prospectId,
        userRole?.role,
        user.id
      );

      if (unassignError) {
        setError(unassignError.message);
        return { success: false, error: unassignError.message };
      }

      return { success: true, data: data || undefined };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la désassignation';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, userRole?.role]);

  // Assigner plusieurs prospects
  const assignMultipleProspects = useCallback(async (
    prospectIds: string[],
    assignedToUserId: string
  ): Promise<{ success: boolean; data?: Prospect[]; error?: string }> => {
    if (!user?.id || !workspace?.id) {
      return { success: false, error: 'Utilisateur ou workspace non défini' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: assignError } = await prospectService.assignMultipleProspects(
        prospectIds,
        assignedToUserId,
        userRole?.role,
        user.id,
        workspace.id
      );

      if (assignError) {
        setError(assignError.message);
        return { success: false, error: assignError.message };
      }

      return { success: true, data: data || undefined };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'assignation multiple';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user?.id, userRole?.role, workspace?.id]);

  // Vérifier si l'utilisateur peut assigner des prospects
  const canAssignProspects = useCallback(() => {
    return userRole?.role === 'admin' || userRole?.role === 'manager';
  }, [userRole?.role]);

  // Obtenir les utilisateurs assignables (agents et managers pour les admins, agents pour les managers)
  const getAssignableUsers = useCallback(() => {
    if (!userRole) return [];

    if (userRole.role === 'admin') {
      // Les admins peuvent assigner à tous les utilisateurs du workspace
      return workspaceUsers;
    }

    if (userRole.role === 'manager') {
      // Les managers peuvent assigner seulement aux agents
      return workspaceUsers.filter(user => user.role === 'agent');
    }

    return [];
  }, [userRole, workspaceUsers]);

  // Nettoyer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // État
    loading,
    error,
    workspaceUsers,
    
    // Actions
    loadWorkspaceUsers,
    assignProspect,
    unassignProspect,
    assignMultipleProspects,
    clearError,
    
    // Utilitaires
    canAssignProspects,
    getAssignableUsers
  };
}