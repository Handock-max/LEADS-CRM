import { getSupabaseClient } from './supabase';
import { Workspace } from '@/types/auth';

export interface WorkspaceData {
    name: string;
    slug: string;
    display_name?: string;
    settings?: Record<string, any>;
}

export interface CreateWorkspaceData extends WorkspaceData {
    admin_email?: string;
}

class WorkspaceService {
    private supabase = getSupabaseClient();

    /**
     * Récupérer tous les workspaces (Super Admin uniquement)
     */
    async getAllWorkspaces(): Promise<{ data: Workspace[] | null; error: Error | null }> {
        try {
            const { data, error } = await this.supabase
                .from('workspaces')
                .select(`
          id,
          name,
          slug,
          display_name,
          settings,
          created_by,
          created_at,
          updated_at
        `)
                .order('created_at', { ascending: false });

            if (error) {
                return { data: null, error: new Error(error.message) };
            }

            const workspaces: Workspace[] = data?.map(item => ({
                id: item.id,
                name: item.name,
                slug: item.slug,
                display_name: item.display_name || item.name,
                settings: item.settings || {},
                created_at: item.created_at,
                updated_at: item.updated_at
            })) || [];

            return { data: workspaces, error: null };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors du chargement des workspaces')
            };
        }
    }

    /**
     * Récupérer un workspace par ID
     */
    async getWorkspace(workspaceId: string): Promise<{ data: Workspace | null; error: Error | null }> {
        try {
            const { data, error } = await this.supabase
                .from('workspaces')
                .select(`
          id,
          name,
          slug,
          display_name,
          settings,
          created_by,
          created_at,
          updated_at
        `)
                .eq('id', workspaceId)
                .single();

            if (error) {
                return { data: null, error: new Error(error.message) };
            }

            const workspace: Workspace = {
                id: data.id,
                name: data.name,
                slug: data.slug,
                display_name: data.display_name || data.name,
                settings: data.settings || {},
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return { data: workspace, error: null };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors du chargement du workspace')
            };
        }
    }

    /**
     * Créer un nouveau workspace (Super Admin uniquement)
     */
    async createWorkspace(workspaceData: CreateWorkspaceData): Promise<{ data: Workspace | null; error: Error | null }> {
        try {
            const { data, error } = await this.supabase
                .from('workspaces')
                .insert({
                    name: workspaceData.name,
                    slug: workspaceData.slug,
                    display_name: workspaceData.display_name || workspaceData.name,
                    settings: workspaceData.settings || {}
                })
                .select()
                .single();

            if (error) {
                return { data: null, error: new Error(error.message) };
            }

            const workspace: Workspace = {
                id: data.id,
                name: data.name,
                slug: data.slug,
                display_name: data.display_name || data.name,
                settings: data.settings || {},
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return { data: workspace, error: null };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors de la création du workspace')
            };
        }
    }

    /**
     * Mettre à jour un workspace
     */
    async updateWorkspace(
        workspaceId: string,
        updates: Partial<WorkspaceData>
    ): Promise<{ data: Workspace | null; error: Error | null }> {
        try {
            const updateData: any = {};

            if (updates.name !== undefined) updateData.name = updates.name;
            if (updates.display_name !== undefined) updateData.display_name = updates.display_name;
            if (updates.settings !== undefined) updateData.settings = updates.settings;

            const { data, error } = await this.supabase
                .from('workspaces')
                .update(updateData)
                .eq('id', workspaceId)
                .select()
                .single();

            if (error) {
                return { data: null, error: new Error(error.message) };
            }

            const workspace: Workspace = {
                id: data.id,
                name: data.name,
                slug: data.slug,
                display_name: data.display_name || data.name,
                settings: data.settings || {},
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            return { data: workspace, error: null };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors de la mise à jour du workspace')
            };
        }
    }

    /**
     * Supprimer un workspace (Super Admin uniquement)
     */
    async deleteWorkspace(workspaceId: string): Promise<{ error: Error | null }> {
        try {
            const { error } = await this.supabase
                .from('workspaces')
                .delete()
                .eq('id', workspaceId);

            if (error) {
                return { error: new Error(error.message) };
            }

            return { error: null };
        } catch (error) {
            return {
                error: error instanceof Error ? error : new Error('Erreur lors de la suppression du workspace')
            };
        }
    }

    /**
     * Récupérer les workspaces d'un utilisateur
     */
    async getUserWorkspaces(userId: string): Promise<{ data: Workspace[] | null; error: Error | null }> {
        try {
            const { data, error } = await this.supabase
                .from('user_roles')
                .select(`
          workspace:workspaces (
            id,
            name,
            slug,
            display_name,
            settings,
            created_at,
            updated_at
          )
        `)
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) {
                return { data: null, error: new Error(error.message) };
            }

            const workspaces: Workspace[] = data?.map((item: any) => ({
                id: item.workspace.id,
                name: item.workspace.name,
                slug: item.workspace.slug,
                display_name: item.workspace.display_name || item.workspace.name,
                settings: item.workspace.settings || {},
                created_at: item.workspace.created_at,
                updated_at: item.workspace.updated_at
            })) || [];

            return { data: workspaces, error: null };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors du chargement des workspaces utilisateur')
            };
        }
    }

    /**
     * Créer un workspace avec un admin (Super Admin uniquement)
     */
    async createWorkspaceWithAdmin(
        workspaceData: CreateWorkspaceData,
        adminUserId: string
    ): Promise<{ data: { workspace: Workspace; userRole: any } | null; error: Error | null }> {
        try {
            // Créer le workspace
            const { data: workspace, error: workspaceError } = await this.createWorkspace(workspaceData);

            if (workspaceError || !workspace) {
                return { data: null, error: workspaceError };
            }

            // Assigner le rôle admin
            const { data: userRoleData, error: roleError } = await this.supabase
                .from('user_roles')
                .insert({
                    user_id: adminUserId,
                    workspace_id: workspace.id,
                    role: 'admin',
                    is_active: true
                })
                .select()
                .single();

            if (roleError) {
                // Nettoyer le workspace créé en cas d'erreur
                await this.deleteWorkspace(workspace.id);
                return { data: null, error: new Error(roleError.message) };
            }

            return {
                data: {
                    workspace,
                    userRole: userRoleData
                },
                error: null
            };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors de la création du workspace avec admin')
            };
        }
    }

    /**
     * Vérifier si un slug est disponible
     */
    async isSlugAvailable(slug: string, excludeId?: string): Promise<{ available: boolean; error: Error | null }> {
        try {
            let query = this.supabase
                .from('workspaces')
                .select('id')
                .eq('slug', slug);

            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            const { data, error } = await query;

            if (error) {
                return { available: false, error: new Error(error.message) };
            }

            return { available: !data || data.length === 0, error: null };
        } catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error : new Error('Erreur lors de la vérification du slug')
            };
        }
    }

    /**
     * Obtenir les statistiques d'un workspace
     */
    async getWorkspaceStats(workspaceId: string): Promise<{
        data: {
            totalUsers: number;
            totalProspects: number;
            activeUsers: number;
        } | null;
        error: Error | null
    }> {
        try {
            // Compter les utilisateurs
            const { count: totalUsers, error: usersError } = await this.supabase
                .from('user_roles')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', workspaceId);

            if (usersError) {
                return { data: null, error: new Error(usersError.message) };
            }

            // Compter les utilisateurs actifs
            const { count: activeUsers, error: activeUsersError } = await this.supabase
                .from('user_roles')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', workspaceId)
                .eq('is_active', true);

            if (activeUsersError) {
                return { data: null, error: new Error(activeUsersError.message) };
            }

            // Compter les prospects
            const { count: totalProspects, error: prospectsError } = await this.supabase
                .from('prospects')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', workspaceId);

            if (prospectsError) {
                return { data: null, error: new Error(prospectsError.message) };
            }

            return {
                data: {
                    totalUsers: totalUsers || 0,
                    activeUsers: activeUsers || 0,
                    totalProspects: totalProspects || 0
                },
                error: null
            };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors du chargement des statistiques')
            };
        }
    }

    /**
     * Obtenir les statistiques globales de la plateforme (Super Admin uniquement)
     */
    async getGlobalStats(): Promise<{
        data: {
            totalWorkspaces: number;
            totalUsers: number;
            activeUsers: number;
            totalProspects: number;
            averageUsersPerWorkspace: number;
            averageProspectsPerWorkspace: number;
            workspaceUsageMetrics: Array<{
                workspaceId: string;
                workspaceName: string;
                totalUsers: number;
                activeUsers: number;
                totalProspects: number;
                lastActivity?: string;
            }>;
        } | null;
        error: Error | null
    }> {
        try {
            // Compter les workspaces
            const { count: totalWorkspaces, error: workspacesError } = await this.supabase
                .from('workspaces')
                .select('*', { count: 'exact', head: true });

            if (workspacesError) {
                return { data: null, error: new Error(workspacesError.message) };
            }

            // Compter tous les utilisateurs
            const { count: totalUsers, error: usersError } = await this.supabase
                .from('user_roles')
                .select('*', { count: 'exact', head: true });

            if (usersError) {
                return { data: null, error: new Error(usersError.message) };
            }

            // Compter les utilisateurs actifs
            const { count: activeUsers, error: activeUsersError } = await this.supabase
                .from('user_roles')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            if (activeUsersError) {
                return { data: null, error: new Error(activeUsersError.message) };
            }

            // Compter tous les prospects
            const { count: totalProspects, error: prospectsError } = await this.supabase
                .from('prospects')
                .select('*', { count: 'exact', head: true });

            if (prospectsError) {
                return { data: null, error: new Error(prospectsError.message) };
            }

            // Récupérer les métriques détaillées par workspace
            const { data: workspaces, error: workspacesDetailError } = await this.supabase
                .from('workspaces')
                .select(`
                    id,
                    name,
                    display_name,
                    created_at
                `)
                .order('created_at', { ascending: false });

            if (workspacesDetailError) {
                return { data: null, error: new Error(workspacesDetailError.message) };
            }

            // Obtenir les statistiques pour chaque workspace
            const workspaceUsageMetrics = await Promise.all(
                (workspaces || []).map(async (workspace) => {
                    const { data: stats } = await this.getWorkspaceStats(workspace.id);
                    
                    // Récupérer la dernière activité (dernière modification de prospect)
                    const { data: lastActivity } = await this.supabase
                        .from('prospects')
                        .select('updated_at')
                        .eq('workspace_id', workspace.id)
                        .order('updated_at', { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        workspaceId: workspace.id,
                        workspaceName: workspace.display_name || workspace.name,
                        totalUsers: stats?.totalUsers || 0,
                        activeUsers: stats?.activeUsers || 0,
                        totalProspects: stats?.totalProspects || 0,
                        lastActivity: lastActivity?.updated_at || workspace.created_at
                    };
                })
            );

            // Calculer les moyennes
            const averageUsersPerWorkspace = totalWorkspaces ? Math.round((totalUsers || 0) / totalWorkspaces) : 0;
            const averageProspectsPerWorkspace = totalWorkspaces ? Math.round((totalProspects || 0) / totalWorkspaces) : 0;

            return {
                data: {
                    totalWorkspaces: totalWorkspaces || 0,
                    totalUsers: totalUsers || 0,
                    activeUsers: activeUsers || 0,
                    totalProspects: totalProspects || 0,
                    averageUsersPerWorkspace,
                    averageProspectsPerWorkspace,
                    workspaceUsageMetrics
                },
                error: null
            };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors du chargement des statistiques globales')
            };
        }
    }
    /**
     * Mettre à jour le nom d'affichage du workspace
     */
    async updateDisplayName(
        workspaceId: string,
        displayName: string
    ): Promise<{ data: Workspace | null; error: Error | null }> {
        return this.updateWorkspace(workspaceId, { display_name: displayName });
    }

    /**
     * Mettre à jour les paramètres du workspace
     */
    async updateWorkspaceSettings(
        workspaceId: string,
        settings: Record<string, any>
    ): Promise<{ data: Workspace | null; error: Error | null }> {
        try {
            // Récupérer les paramètres actuels
            const { data: currentWorkspace, error: fetchError } = await this.getWorkspace(workspaceId);

            if (fetchError || !currentWorkspace) {
                return { data: null, error: fetchError };
            }

            // Fusionner avec les nouveaux paramètres
            const mergedSettings = {
                ...currentWorkspace.settings,
                ...settings
            };

            return this.updateWorkspace(workspaceId, { settings: mergedSettings });
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors de la mise à jour des paramètres')
            };
        }
    }

    /**
     * Obtenir un paramètre spécifique du workspace
     */
    async getSetting(
        workspaceId: string,
        settingKey: string
    ): Promise<{ data: any; error: Error | null }> {
        try {
            const { data: workspace, error } = await this.getWorkspace(workspaceId);

            if (error || !workspace) {
                return { data: null, error };
            }

            const settingValue = workspace.settings[settingKey];
            return { data: settingValue, error: null };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors de la récupération du paramètre')
            };
        }
    }

    /**
     * Définir un paramètre spécifique du workspace
     */
    async setSetting(
        workspaceId: string,
        settingKey: string,
        settingValue: any
    ): Promise<{ error: Error | null }> {
        try {
            const { error } = await this.updateWorkspaceSettings(workspaceId, { [settingKey]: settingValue });
            return { error };
        } catch (error) {
            return {
                error: error instanceof Error ? error : new Error('Erreur lors de la définition du paramètre')
            };
        }
    }

    /**
     * Supprimer un paramètre spécifique du workspace
     */
    async removeSetting(
        workspaceId: string,
        settingKey: string
    ): Promise<{ error: Error | null }> {
        try {
            const { data: workspace, error: fetchError } = await this.getWorkspace(workspaceId);

            if (fetchError || !workspace) {
                return { error: fetchError };
            }

            const newSettings = { ...workspace.settings };
            delete newSettings[settingKey];

            const { error } = await this.updateWorkspace(workspaceId, { settings: newSettings });
            return { error };
        } catch (error) {
            return {
                error: error instanceof Error ? error : new Error('Erreur lors de la suppression du paramètre')
            };
        }
    }

    /**
     * Récupérer les utilisateurs d'un workspace pour assignation
     */
    async getWorkspaceUsers(workspaceId: string): Promise<{
        data: Array<{
            id: string;
            email: string;
            role: string;
            full_name?: string;
        }> | null;
        error: Error | null
    }> {
        try {
            const { data, error } = await this.supabase
                .from('user_roles')
                .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            email,
            full_name
          )
        `)
                .eq('workspace_id', workspaceId)
                .eq('is_active', true);

            if (error) {
                return { data: null, error: new Error(error.message) };
            }

            const users = data?.map((item: any) => ({
                id: item.user_id,
                email: item.profiles?.email || '',
                role: item.role,
                full_name: item.profiles?.full_name || item.profiles?.email || 'Utilisateur'
            })) || [];

            return { data: users, error: null };
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error : new Error('Erreur lors du chargement des utilisateurs du workspace')
            };
        }
    }
}

export const workspaceService = new WorkspaceService();
export default workspaceService;