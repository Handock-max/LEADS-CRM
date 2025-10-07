import { getSupabaseClient } from './supabase';
import { Prospect } from './mockData';

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

class ProspectService {
  private supabase = getSupabaseClient();

  // Récupérer tous les prospects du workspace
  async getProspects(): Promise<{ data: Prospect[] | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

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
        notes: item.notes || ''
      })) || [];

      return { data: prospects, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Erreur lors du chargement des prospects') 
      };
    }
  }

  // Créer un nouveau prospect
  async createProspect(prospectData: ProspectData): Promise<{ data: Prospect | null; error: Error | null }> {
    try {
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
          notes: prospectData.notes
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

  // Mettre à jour un prospect
  async updateProspect(id: string, prospectData: Partial<ProspectData>): Promise<{ data: Prospect | null; error: Error | null }> {
    try {
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

  // Supprimer un prospect
  async deleteProspect(id: string): Promise<{ error: Error | null }> {
    try {
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
}

export const prospectService = new ProspectService();