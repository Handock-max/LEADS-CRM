import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProspectModal } from '@/components/ProspectModal';
import { EnhancedProspectTable } from '@/components/EnhancedProspectTable';
import { Prospect } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { prospectService } from '@/lib/prospectService';
import { toast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

/**
 * Exemple d'intégration des fonctionnalités d'assignation dans la page CRM
 * Cette version montre comment utiliser les nouveaux composants d'assignation
 */
export function CRMWithAssignments() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userRole, workspace } = useAuth();
  const navigate = useNavigate();

  // Charger les prospects au démarrage
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadProspects();
  }, [user, navigate]);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const { data, error } = await prospectService.getProspects(
        userRole?.role,
        user?.id
      );
      
      if (error) {
        toast({ 
          title: 'Erreur', 
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      setProspects(data || []);
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de charger les prospects',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProspect = () => {
    setSelectedProspect(null);
    setIsModalOpen(true);
  };

  const handleEditProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsModalOpen(true);
  };

  const handleSaveProspect = async (prospect: Prospect) => {
    try {
      if (selectedProspect) {
        // Mise à jour
        const { data, error } = await prospectService.updateProspect(
          prospect.id, 
          {
            entreprise: prospect.entreprise,
            contact: prospect.contact,
            poste: prospect.poste,
            email: prospect.email,
            telephone: prospect.telephone,
            statut: prospect.statut,
            prochaine_action: prospect.prochaineAction,
            notes: prospect.notes
          },
          userRole?.role,
          user?.id
        );

        if (error) {
          toast({ 
            title: 'Erreur', 
            description: error.message,
            variant: 'destructive'
          });
          return;
        }

        if (data) {
          setProspects(prospects.map((p) => (p.id === data.id ? data : p)));
          toast({ title: 'Prospect modifié', description: 'Les modifications ont été enregistrées' });
        }
      } else {
        // Création
        const { data, error } = await prospectService.createProspect(
          {
            entreprise: prospect.entreprise,
            contact: prospect.contact,
            poste: prospect.poste,
            email: prospect.email,
            telephone: prospect.telephone,
            statut: prospect.statut,
            prochaine_action: prospect.prochaineAction,
            notes: prospect.notes
          },
          userRole?.role,
          user?.id
        );

        if (error) {
          toast({ 
            title: 'Erreur', 
            description: error.message,
            variant: 'destructive'
          });
          return;
        }

        if (data) {
          setProspects([data, ...prospects]);
          toast({ title: 'Prospect ajouté', description: 'Le nouveau prospect a été ajouté avec succès' });
        }
      }
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Une erreur est survenue lors de la sauvegarde',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProspect = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prospect ?')) {
      return;
    }

    try {
      const { error } = await prospectService.deleteProspect(
        id,
        userRole?.role,
        user?.id
      );
      
      if (error) {
        toast({ 
          title: 'Erreur', 
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      setProspects(prospects.filter((p) => p.id !== id));
      toast({ title: 'Prospect supprimé', description: 'Le prospect a été supprimé' });
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de supprimer le prospect',
        variant: 'destructive'
      });
    }
  };

  // Gérer la mise à jour d'un prospect après assignation
  const handleProspectUpdate = (updatedProspect: Prospect) => {
    setProspects(prospects.map(p => 
      p.id === updatedProspect.id ? updatedProspect : p
    ));
    
    toast({ 
      title: 'Assignation mise à jour', 
      description: `Le prospect ${updatedProspect.entreprise} a été mis à jour` 
    });
  };

  // Gérer la mise à jour en lot après assignation multiple
  const handleBulkUpdate = (updatedProspects: Prospect[]) => {
    const updatedIds = new Set(updatedProspects.map(p => p.id));
    
    setProspects(prospects.map(p => {
      const updated = updatedProspects.find(up => up.id === p.id);
      return updated || p;
    }));
    
    toast({ 
      title: 'Assignation en lot réussie', 
      description: `${updatedProspects.length} prospect${updatedProspects.length > 1 ? 's ont été assignés' : ' a été assigné'}` 
    });
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Liste des prospects</CardTitle>
              {workspace && (
                <p className="text-sm text-gray-600 mt-1">
                  Workspace: {workspace.display_name || workspace.name}
                </p>
              )}
            </div>
            <Button onClick={handleAddProspect}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un prospect
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                  <p className="text-gray-600">Chargement des prospects...</p>
                </div>
              </div>
            ) : (
              <EnhancedProspectTable
                prospects={prospects}
                onEdit={handleEditProspect}
                onDelete={handleDeleteProspect}
                onProspectUpdate={handleProspectUpdate}
                onBulkUpdate={handleBulkUpdate}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ProspectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        prospect={selectedProspect}
        onSave={handleSaveProspect}
      />
    </>
  );
}

export default CRMWithAssignments;