import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProspectModal } from '@/components/ProspectModal';
import { StatusBadge } from '@/components/StatusBadge';
import { Prospect } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { prospectService } from '@/lib/prospectService';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const CRM = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
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
      const { data, error } = await prospectService.getProspects();
      
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
        const { data, error } = await prospectService.updateProspect(prospect.id, {
          entreprise: prospect.entreprise,
          contact: prospect.contact,
          poste: prospect.poste,
          email: prospect.email,
          telephone: prospect.telephone,
          statut: prospect.statut,
          prochaine_action: prospect.prochaineAction,
          notes: prospect.notes
        });

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
        const { data, error } = await prospectService.createProspect({
          entreprise: prospect.entreprise,
          contact: prospect.contact,
          poste: prospect.poste,
          email: prospect.email,
          telephone: prospect.telephone,
          statut: prospect.statut,
          prochaine_action: prospect.prochaineAction,
          notes: prospect.notes
        });

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
      const { error } = await prospectService.deleteProspect(id);
      
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

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liste des prospects</CardTitle>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prochaine action</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect) => (
                    <TableRow key={prospect.id}>
                      <TableCell className="font-medium">{prospect.entreprise}</TableCell>
                      <TableCell>{prospect.contact}</TableCell>
                      <TableCell>{prospect.poste}</TableCell>
                      <TableCell className="text-sm">{prospect.email}</TableCell>
                      <TableCell className="text-sm">{prospect.telephone}</TableCell>
                      <TableCell>
                        <StatusBadge status={prospect.statut} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {prospect.prochaineAction ? new Date(prospect.prochaineAction).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {prospect.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProspect(prospect)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProspect(prospect.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
};

export default CRM;
