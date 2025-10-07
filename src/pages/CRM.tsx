import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProspectModal } from '@/components/ProspectModal';
import { StatusBadge } from '@/components/StatusBadge';
import { Prospect } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const CRM = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleAddProspect = () => {
    setSelectedProspect(null);
    setIsModalOpen(true);
  };

  const handleEditProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsModalOpen(true);
  };

  const handleSaveProspect = (prospect: Prospect) => {
    if (selectedProspect) {
      setProspects(prospects.map((p) => (p.id === prospect.id ? prospect : p)));
      toast({ title: 'Prospect modifié', description: 'Les modifications ont été enregistrées' });
    } else {
      setProspects([...prospects, prospect]);
      toast({ title: 'Prospect ajouté', description: 'Le nouveau prospect a été ajouté avec succès' });
    }
  };

  const handleDeleteProspect = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce prospect ?')) {
      setProspects(prospects.filter((p) => p.id !== id));
      toast({ title: 'Prospect supprimé', description: 'Le prospect a été supprimé' });
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
