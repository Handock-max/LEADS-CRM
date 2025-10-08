import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProspectTableRow } from '@/components/ProspectTableRow';
import { BulkProspectAssignment } from '@/components/BulkProspectAssignment';
import { Prospect } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionService } from '@/lib/permissionService';
import { Users, X } from 'lucide-react';

interface EnhancedProspectTableProps {
  prospects: Prospect[];
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  onProspectUpdate: (prospect: Prospect) => void;
  onBulkUpdate: (prospects: Prospect[]) => void;
}

export function EnhancedProspectTable({ 
  prospects, 
  onEdit, 
  onDelete, 
  onProspectUpdate,
  onBulkUpdate
}: EnhancedProspectTableProps) {
  const { userRole } = useAuth();
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);

  const canAssign = PermissionService.hasPermission(
    userRole?.role || null, 
    'prospects:assign'
  );

  // Gérer la sélection d'un prospect
  const handleProspectSelect = (prospectId: string, selected: boolean) => {
    const newSelection = new Set(selectedProspects);
    if (selected) {
      newSelection.add(prospectId);
    } else {
      newSelection.delete(prospectId);
    }
    setSelectedProspects(newSelection);
  };

  // Sélectionner/désélectionner tous les prospects
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProspects(new Set(prospects.map(p => p.id)));
    } else {
      setSelectedProspects(new Set());
    }
  };

  // Obtenir les prospects sélectionnés
  const getSelectedProspects = (): Prospect[] => {
    return prospects.filter(p => selectedProspects.has(p.id));
  };

  // Gérer la mise à jour après assignation en lot
  const handleBulkAssignmentComplete = (updatedProspects: Prospect[]) => {
    onBulkUpdate(updatedProspects);
    setSelectedProspects(new Set());
    setShowBulkAssignment(false);
  };

  // Annuler la sélection
  const handleClearSelection = () => {
    setSelectedProspects(new Set());
  };

  const selectedCount = selectedProspects.size;
  const allSelected = selectedCount > 0 && selectedCount === prospects.length;
  const someSelected = selectedCount > 0 && selectedCount < prospects.length;

  return (
    <>
      <div className="space-y-4">
        {/* Barre d'actions pour la sélection multiple */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedCount} prospect{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-blue-700 hover:text-blue-900"
              >
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
            </div>
            
            {canAssign && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowBulkAssignment(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assigner en lot
                </Button>
                <span className="text-xs text-blue-700">
                  {userRole?.role === 'admin' ? 'Vous pouvez assigner à tous les utilisateurs' : 'Vous pouvez assigner aux agents'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Table des prospects */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Checkbox pour sélectionner tout */}
                {canAssign && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableHead>
                )}
                
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Prochaine action</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect) => (
                <ProspectTableRow
                  key={prospect.id}
                  prospect={prospect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAssignmentChange={onProspectUpdate}
                  selected={selectedProspects.has(prospect.id)}
                  onSelect={canAssign ? (selected) => handleProspectSelect(prospect.id, selected) : undefined}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Message si aucun prospect */}
        {prospects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun prospect trouvé</p>
          </div>
        )}

        {/* Légende des indicateurs visuels */}
        {prospects.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Légende :</h4>
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Prospects créés par vous</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Prospects qui vous sont assignés</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Créé par vous
                </span>
                <span>Vous pouvez modifier et supprimer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Assigné
                </span>
                <span>Vous pouvez modifier mais pas supprimer</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'assignation en lot */}
      <BulkProspectAssignment
        isOpen={showBulkAssignment}
        selectedProspects={getSelectedProspects()}
        onAssignmentComplete={handleBulkAssignmentComplete}
        onClose={() => setShowBulkAssignment(false)}
      />
    </>
  );
}

export default EnhancedProspectTable;