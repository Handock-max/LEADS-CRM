import { getSupabaseClient } from './supabase';
import { PermissionService } from './permissionService';

type UserRoleType = 'admin' | 'manager' | 'agent' | 'super_admin';

export interface DashboardKPI {
  label: string;
  value: number;
  trend?: string;
  color: string;
}

export interface WeeklyData {
  semaine: string;
  nouveaux: number;
  rdv: number;
  gagnes: number;
  perdus: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  kpis: DashboardKPI[];
  weeklyData: WeeklyData[];
  statusDistribution: StatusDistribution[];
  totalProspects: number;
}

class DashboardService {
  private supabase = getSupabaseClient();

  // Calculer les KPIs selon les permissions de l'utilisateur
  async getDashboardData(
    userRole?: UserRoleType | null,
    userId?: string,
    workspaceId?: string
  ): Promise<{ data: DashboardData | null; error: Error | null }> {
    try {
      let query = this.supabase
        .from('prospects')
        .select('*');

      // Appliquer les filtres selon le rôle (la RLS s'occupe déjà du filtrage de base)
      if (userRole === 'agent' && userId) {
        // Les agents ne voient que leurs prospects + assignés
        query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
      }

      const { data: prospects, error } = await query;

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      if (!prospects) {
        return { data: null, error: new Error('Aucune donnée trouvée') };
      }

      // Calculer les KPIs
      const kpis = this.calculateKPIs(prospects);
      
      // Calculer les données hebdomadaires
      const weeklyData = this.calculateWeeklyData(prospects);
      
      // Calculer la distribution par statut
      const statusDistribution = this.calculateStatusDistribution(prospects);

      const dashboardData: DashboardData = {
        kpis,
        weeklyData,
        statusDistribution,
        totalProspects: prospects.length
      };

      return { data: dashboardData, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors du chargement des données du dashboard') 
      };
    }
  }

  private calculateKPIs(prospects: any[]): DashboardKPI[] {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Compter les prospects par statut
    const nouveaux = prospects.filter(p => p.statut === 'nouveau').length;
    const rdvPlanifies = prospects.filter(p => p.statut === 'rdv').length;
    const gagnes = prospects.filter(p => p.statut === 'gagne').length;
    const perdus = prospects.filter(p => p.statut === 'perdu').length;

    // Calculer les tendances (prospects créés la semaine dernière vs cette semaine)
    const nouveauxLastWeek = prospects.filter(p => 
      p.statut === 'nouveau' && 
      new Date(p.created_at) >= lastWeek && 
      new Date(p.created_at) < now
    ).length;

    const rdvLastWeek = prospects.filter(p => 
      p.statut === 'rdv' && 
      new Date(p.updated_at || p.created_at) >= lastWeek && 
      new Date(p.updated_at || p.created_at) < now
    ).length;

    const gagnesLastWeek = prospects.filter(p => 
      p.statut === 'gagne' && 
      new Date(p.updated_at || p.created_at) >= lastWeek && 
      new Date(p.updated_at || p.created_at) < now
    ).length;

    const perdusLastWeek = prospects.filter(p => 
      p.statut === 'perdu' && 
      new Date(p.updated_at || p.created_at) >= lastWeek && 
      new Date(p.updated_at || p.created_at) < now
    ).length;

    return [
      { 
        label: 'Nouveaux', 
        value: nouveaux, 
        trend: nouveauxLastWeek > 0 ? `+${nouveauxLastWeek}` : '0', 
        color: 'text-blue-600' 
      },
      { 
        label: 'RDV planifiés', 
        value: rdvPlanifies, 
        trend: rdvLastWeek > 0 ? `+${rdvLastWeek}` : '0', 
        color: 'text-purple-600' 
      },
      { 
        label: 'Gagnés', 
        value: gagnes, 
        trend: gagnesLastWeek > 0 ? `+${gagnesLastWeek}` : '0', 
        color: 'text-green-600' 
      },
      { 
        label: 'Perdus', 
        value: perdus, 
        trend: perdusLastWeek > 0 ? `+${perdusLastWeek}` : '0', 
        color: 'text-red-600' 
      },
    ];
  }

  private calculateWeeklyData(prospects: any[]): WeeklyData[] {
    const now = new Date();
    const weeks: WeeklyData[] = [];

    // Calculer les 4 dernières semaines
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const weekProspects = prospects.filter(p => {
        const createdAt = new Date(p.created_at);
        return createdAt >= weekStart && createdAt < weekEnd;
      });

      const weekUpdated = prospects.filter(p => {
        const updatedAt = new Date(p.updated_at || p.created_at);
        return updatedAt >= weekStart && updatedAt < weekEnd;
      });

      weeks.push({
        semaine: `S${4 - i}`,
        nouveaux: weekProspects.filter(p => p.statut === 'nouveau').length,
        rdv: weekUpdated.filter(p => p.statut === 'rdv').length,
        gagnes: weekUpdated.filter(p => p.statut === 'gagne').length,
        perdus: weekUpdated.filter(p => p.statut === 'perdu').length,
      });
    }

    return weeks;
  }

  private calculateStatusDistribution(prospects: any[]): StatusDistribution[] {
    const statusCounts = prospects.reduce((acc, prospect) => {
      acc[prospect.statut] = (acc[prospect.statut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusLabels: Record<string, string> = {
      'nouveau': 'Nouveau',
      'contacte': 'Contacté',
      'relance': 'Relance',
      'rdv': 'RDV',
      'gagne': 'Gagné',
      'perdu': 'Perdu'
    };

    const statusColors: Record<string, string> = {
      'nouveau': 'hsl(var(--status-nouveau))',
      'contacte': 'hsl(var(--status-contacte))',
      'relance': 'hsl(var(--status-relance))',
      'rdv': 'hsl(var(--status-rdv))',
      'gagne': 'hsl(var(--status-gagne))',
      'perdu': 'hsl(var(--status-perdu))'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count as number,
      color: statusColors[status] || '#8884d8'
    }));
  }

  // Obtenir les prospects pour l'export CSV selon les permissions
  async getProspectsForExport(
    userRole?: UserRoleType | null,
    userId?: string
  ): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      let query = this.supabase
        .from('prospects')
        .select('*');

      // Appliquer les filtres selon le rôle
      if (userRole === 'agent' && userId) {
        query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors de l\'export des données') 
      };
    }
  }
}

export const dashboardService = new DashboardService();