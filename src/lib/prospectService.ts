import { getSupabaseClient } from './supabase';
import { Prospect } from './mockData';
import { PermissionService } from './permissionService';

export interface ProspectData {
  id?: string;
  entreprise: string;
  contact: string;
  poste: string;
  email: string;
  telephone: string;
  statut: 'nouveau' | 'contacte' | 'relance' | 'rdv' | 'gagne' | 'perdu';
  prochaine_action?: string;
  notes: string;
}

export interface ProspectFilters {
  status?: string;
  assignedTo?: string;
  createdBy?: string;
  search?: string;
}

class ProspectService {
  private supabase = getSupabaseClient();

  // Récupérer les prospects selon les permissions de l'utilisateur
  async getProspects(
    userRole?: string | null,
    userId?: string,
    filters?: ProspectFilters
  ): Promise<{ data: Prospect[] | null; error: Error | null }> {
    try {
      let query = this.supabase
        .from('prospects')
        .select('*');

      // Filtrage selon le rôle utilisateur (la RLS s'occupe déjà du filtrage de base)
      // Mais on peut ajouter des filtres supplémentaires côté client pour les agents
      if (userRole === 'agent' && userId) {
        // Les agents ne voient que leurs prospects + assignés (RLS + filtre explicite)
        query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
      }

      // Appliquer les filtres additionnels
      if (filters?.status) {
        query = query.eq('statut', filters.status);
      }
      
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      
      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      
      if (filters?.search) {
        query = query.or(`entreprise.ilike.%${filters.search}%,contact.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // Transformer les données Supabase vers le format Prospect
      const prospects: Prospect[] = data?.map(item => ({
        id: item.id,
        entreprise: item.entreprise,
        contact: item.contact || '',
        poste: item.poste || '',
        email: item.email || '',
        telephone: item.telephone || '',
        statut: item.statut,
        prochaineAction: item.prochaine_action || '',
        notes: item.notes || '',
        created_by: item.created_by,
        assigned_to: item.assigned_to
      })) || [];

      // Filtrage côté client selon les permissions (sécurité supplémentaire)
      const filteredProspects = PermissionService.filterProspects(prospects, userRole as any, userId || '');

      return { data: filteredProspects, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors du chargement des prospects') 
      };
    }
  }

  // Créer un nouveau prospect avec vérification des permissions
  async createProspect(
    prospectData: ProspectData,
    userRole?: string | null,
    userId?: string
  ): Promise<{ data: Prospect | null; error: Error | null }> {
    try {
      // Vérifier les permissions de création
      if (!PermissionService.hasPermission(userRole as any, 'prospects:create')) {
        return { data: null, error: new Error('Permissions insuffisantes pour créer un prospect') };
      }

      const { data, error } = await this.supabase
        .from('prospects')
        .insert({
          entreprise: prospectData.entreprise,
          contact: prospectData.contact,
          poste: prospectData.poste,
          email: prospectData.email,
          telephone: prospectData.telephone,
          statut: prospectData.statut,
          prochaine_action: prospectData.prochaine_action || null,
          notes: prospectData.notes,
          created_by: userId // Assigner le créateur
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // Transformer vers le format Prospect
      const prospect: Prospect = {
        id: data.id,
        entreprise: data.entreprise,
        contact: data.contact || '',
        poste: data.poste || '',
        email: data.email || '',
        telephone: data.telephone || '',
        statut: data.statut,
        prochaineAction: data.prochaine_action || '',
        notes: data.notes || ''
      };

      return { data: prospect, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors de la création du prospect') 
      };
    }
  }

  // Mettre à jour un prospect avec vérification des permissions
  async updateProspect(
    id: string, 
    prospectData: Partial<ProspectData>,
    userRole?: string | null,
    userId?: string
  ): Promise<{ data: Prospect | null; error: Error | null }> {
    try {
      // D'abord récupérer le prospect pour vérifier les permissions
      const { data: existingProspect, error: fetchError } = await this.supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        return { data: null, error: new Error(fetchError.message) };
      }

      if (!existingProspect) {
        return { data: null, error: new Error('Prospect non trouvé') };
      }

      // Vérifier les permissions de modification
      if (!PermissionService.canModifyProspect(userRole as any, userId || '', existingProspect)) {
        const isOwner = existingProspect.created_by === userId;
        const isAssigned = existingProspect.assigned_to === userId;
        
        let errorMessage = 'Permissions insuffisantes pour modifier ce prospect';
        
        if (userRole === 'agent') {
          errorMessage = 'Vous ne pouvez modifier que vos propres prospects ou ceux qui vous sont assignés';
        } else if (userRole === 'manager') {
          errorMessage = 'Vous ne pouvez modifier que vos propres prospects ou ceux qui vous sont assignés';
        }
        
        return { data: null, error: new Error(errorMessage) };
      }

      const updateData: any = {};
      
      if (prospectData.entreprise !== undefined) updateData.entreprise = prospectData.entreprise;
      if (prospectData.contact !== undefined) updateData.contact = prospectData.contact;
      if (prospectData.poste !== undefined) updateData.poste = prospectData.poste;
      if (prospectData.email !== undefined) updateData.email = prospectData.email;
      if (prospectData.telephone !== undefined) updateData.telephone = prospectData.telephone;
      if (prospectData.statut !== undefined) updateData.statut = prospectData.statut;
      if (prospectData.prochaine_action !== undefined) updateData.prochaine_action = prospectData.prochaine_action || null;
      if (prospectData.notes !== undefined) updateData.notes = prospectData.notes;

      const { data, error } = await this.supabase
        .from('prospects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // Transformer vers le format Prospect
      const prospect: Prospect = {
        id: data.id,
        entreprise: data.entreprise,
        contact: data.contact || '',
        poste: data.poste || '',
        email: data.email || '',
        telephone: data.telephone || '',
        statut: data.statut,
        prochaineAction: data.prochaine_action || '',
        notes: data.notes || ''
      };

      return { data: prospect, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors de la mise à jour du prospect') 
      };
    }
  }

  // Supprimer un prospect avec vérification des permissions
  async deleteProspect(
    id: string,
    userRole?: string | null,
    userId?: string
  ): Promise<{ error: Error | null }> {
    try {
      // D'abord récupérer le prospect pour vérifier les permissions
      const { data: existingProspect, error: fetchError } = await this.supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        return { error: new Error(fetchError.message) };
      }

      if (!existingProspect) {
        return { error: new Error('Prospect non trouvé') };
      }

      // Vérifier les permissions de suppression
      if (!PermissionService.canDeleteProspect(userRole as any, userId || '', existingProspect)) {
        const isOwner = existingProspect.created_by === userId;
        const isAssigned = existingProspect.assigned_to === userId;
        
        let errorMessage = 'Permissions insuffisantes pour supprimer ce prospect';
        
        if (userRole === 'agent') {
          if (isAssigned && !isOwner) {
            errorMessage = 'Vous ne pouvez pas supprimer un prospect qui vous est assigné. Seuls vos propres prospects peuvent être supprimés.';
          } else {
            errorMessage = 'Vous ne pouvez supprimer que vos propres prospects';
          }
        } else if (userRole === 'manager') {
          errorMessage = 'Vous ne pouvez supprimer que vos propres prospects';
        }
        
        return { error: new Error(errorMessage) };
      }

      const { error } = await this.supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('Erreur lors de la suppression du prospect') 
      };
    }
  }

  // Assigner un prospect à un utilisateur (managers/admins uniquement)
  async assignProspect(
    prospectId: string,
    assignedToUserId: string,
    userRole?: string | null,
    currentUserId?: string,
    workspaceId?: string
  ): Promise<{ data: Prospect | null; error: Error | null }> {
    try {
      // Vérifier les permissions d'assignation
      if (!PermissionService.hasPermission(userRole as any, 'prospects:assign')) {
        return { data: null, error: new Error('Permissions insuffisantes pour assigner des prospects') };
      }

      // Récupérer le prospect pour vérifier qu'il appartient au workspace
      const { data: existingProspect, error: fetchError } = await this.supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (fetchError) {
        return { data: null, error: new Error(fetchError.message) };
      }

      if (!existingProspect) {
        return { data: null, error: new Error('Prospect non trouvé') };
      }

      // Vérifier que l'utilisateur assigné appartient au même workspace
      if (workspaceId && assignedToUserId) {
        const { data: targetUserRole, error: userRoleError } = await this.supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', assignedToUserId)
          .eq('workspace_id', workspaceId)
          .eq('is_active', true)
          .single();

        if (userRoleError || !targetUserRole) {
          return { data: null, error: new Error('L\'utilisateur assigné n\'appartient pas à ce workspace') };
        }
      }

      // Effectuer l'assignation
      const { data, error } = await this.supabase
        .from('prospects')
        .update({ assigned_to: assignedToUserId })
        .eq('id', prospectId)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // Transformer vers le format Prospect
      const prospect: Prospect = {
        id: data.id,
        entreprise: data.entreprise,
        contact: data.contact || '',
        poste: data.poste || '',
        email: data.email || '',
        telephone: data.telephone || '',
        statut: data.statut,
        prochaineAction: data.prochaine_action || '',
        notes: data.notes || '',
        created_by: data.created_by,
        assigned_to: data.assigned_to
      };

      return { data: prospect, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors de l\'assignation du prospect') 
      };
    }
  }

  // Désassigner un prospect (retirer l'assignation)
  async unassignProspect(
    prospectId: string,
    userRole?: string | null,
    currentUserId?: string
  ): Promise<{ data: Prospect | null; error: Error | null }> {
    try {
      // Vérifier les permissions d'assignation
      if (!PermissionService.hasPermission(userRole as any, 'prospects:assign')) {
        return { data: null, error: new Error('Permissions insuffisantes pour désassigner des prospects') };
      }

      // Récupérer le prospect pour vérifier les permissions
      const { data: existingProspect, error: fetchError } = await this.supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (fetchError) {
        return { data: null, error: new Error(fetchError.message) };
      }

      if (!existingProspect) {
        return { data: null, error: new Error('Prospect non trouvé') };
      }

      // Effectuer la désassignation
      const { data, error } = await this.supabase
        .from('prospects')
        .update({ assigned_to: null })
        .eq('id', prospectId)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // Transformer vers le format Prospect
      const prospect: Prospect = {
        id: data.id,
        entreprise: data.entreprise,
        contact: data.contact || '',
        poste: data.poste || '',
        email: data.email || '',
        telephone: data.telephone || '',
        statut: data.statut,
        prochaineAction: data.prochaine_action || '',
        notes: data.notes || '',
        created_by: data.created_by,
        assigned_to: data.assigned_to
      };

      return { data: prospect, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors de la désassignation du prospect') 
      };
    }
  }

  // Assigner plusieurs prospects à un utilisateur
  async assignMultipleProspects(
    prospectIds: string[],
    assignedToUserId: string,
    userRole?: string | null,
    currentUserId?: string,
    workspaceId?: string
  ): Promise<{ data: Prospect[] | null; error: Error | null }> {
    try {
      // Vérifier les permissions d'assignation
      if (!PermissionService.hasPermission(userRole as any, 'prospects:assign')) {
        return { data: null, error: new Error('Permissions insuffisantes pour assigner des prospects') };
      }

      // Vérifier que l'utilisateur assigné appartient au même workspace
      if (workspaceId && assignedToUserId) {
        const { data: targetUserRole, error: userRoleError } = await this.supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', assignedToUserId)
          .eq('workspace_id', workspaceId)
          .eq('is_active', true)
          .single();

        if (userRoleError || !targetUserRole) {
          return { data: null, error: new Error('L\'utilisateur assigné n\'appartient pas à ce workspace') };
        }
      }

      // Effectuer l'assignation multiple
      const { data, error } = await this.supabase
        .from('prospects')
        .update({ assigned_to: assignedToUserId })
        .in('id', prospectIds)
        .select();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // Transformer vers le format Prospect
      const prospects: Prospect[] = data?.map(item => ({
        id: item.id,
        entreprise: item.entreprise,
        contact: item.contact || '',
        poste: item.poste || '',
        email: item.email || '',
        telephone: item.telephone || '',
        statut: item.statut,
        prochaineAction: item.prochaine_action || '',
        notes: item.notes || '',
        created_by: item.created_by,
        assigned_to: item.assigned_to
      })) || [];

      return { data: prospects, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors de l\'assignation multiple des prospects') 
      };
    }
  }
}

export const prospectService = new ProspectService();