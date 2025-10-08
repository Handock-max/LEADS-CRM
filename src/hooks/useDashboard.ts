import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardData } from '@/lib/dashboardService';
import { useAuth } from '@/contexts/AuthContext';

type UserRoleType = 'admin' | 'manager' | 'agent' | 'super_admin';

export function useDashboard() {
  const { userRole, user, workspace } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user || !userRole) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await dashboardService.getDashboardData(
        userRole.role as UserRoleType,
        user.id,
        workspace?.id
      );

      if (serviceError) {
        setError(serviceError.message);
        return;
      }

      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [user, userRole, workspace]);

  const exportCSV = useCallback(async () => {
    if (!user || !userRole) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const { data, error: serviceError } = await dashboardService.getProspectsForExport(
        userRole.role as UserRoleType,
        user.id
      );

      if (serviceError) {
        throw serviceError;
      }

      if (!data || data.length === 0) {
        throw new Error('Aucune donnée à exporter');
      }

      // Créer le CSV
      const headers = ['Entreprise', 'Contact', 'Poste', 'Email', 'Téléphone', 'Statut', 'Prochaine action', 'Notes'];
      const rows = data.map((p) => [
        p.entreprise || '',
        p.contact || '',
        p.poste || '',
        p.email || '',
        p.telephone || '',
        p.statut || '',
        p.prochaine_action || '',
        p.notes || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `prospects_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      return { success: true };
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de l\'export');
    }
  }, [user, userRole]);

  const refreshData = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    exportCSV,
    refreshData,
    userRole: userRole?.role || null,
    canExport: userRole?.role !== null // Tous les utilisateurs connectés peuvent exporter leurs données
  };
}