import React from 'react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { ProspectAssignment } from '@/components/ProspectAssignment';
import { Prospect } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionService } from '@/lib/permissionService';
import { Edit2, Trash2 } from 'lucide-react';

interface ProspectTableRowProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  onAssignmentChange: (prospect: Prospect) => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function ProspectTableRow({ 
  prospect, 
  onEdit, 
  onDelete, 
  onAssignmentChange,
  selected = false,
  onSelect
}: ProspectTableRowProps) {
  const { userRole, user } = useAuth();

  // Vérifier les permissions pour ce prospect
  const canEdit = PermissionService.canModifyProspect(
    userRole?.role || null, 
    user?.id || '', 
    prospect
  );

  const canDelete = PermissionService.canDeleteProspect(
    userRole?.role || null, 
    user?.id || '', 
    prospect
  );

  const canAssign = PermissionService.hasPermission(
    userRole?.role || null, 
    'prospects:assign'
  );

  const getAssignedUserDisplay = () => {
    if (!prospect.assigned_to) return '-';
    // Dans un vrai projet, vous récupéreriez le nom de l'utilisateur
    // Pour l'instant, on affiche juste l'ID ou un placeholder
    return 'Utilisateur assigné';
  };

  // Déterminer le type de relation avec le prospect
  const getProspectRelation = () => {
    const isOwner = prospect.created_by === user?.id;
    const isAssigned = prospect.assigned_to === user?.id;
    
    if (isOwner && isAssigned) return 'owner-assigned';
    if (isOwner) return 'owner';
    if (isAssigned) return 'assigned';
    return 'other';
  };

  const relation = getProspectRelation();

  return (
    <TableRow className={`${selected ? 'bg-blue-50' : ''} ${relation === 'owner' ? 'border-l-4 border-l-green-500' : relation === 'assigned' ? 'border-l-4 border-l-blue-500' : ''}`}>
      {/* Checkbox pour sélection multiple (si la fonction est fournie) */}
      {onSelect && (
        <TableCell className="w-12">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </TableCell>
      )}
      
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {prospect.entreprise}
          {relation === 'owner' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Vous avez créé ce prospect">
              Créé par vous
            </span>
          )}
          {relation === 'assigned' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" title="Ce prospect vous est assigné">
              Assigné
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>{prospect.contact}</TableCell>
      <TableCell>{prospect.poste}</TableCell>
      <TableCell className="text-sm">{prospect.email}</TableCell>
      <TableCell className="text-sm">{prospect.telephone}</TableCell>
      <TableCell>
        <StatusBadge status={prospect.statut} />
      </TableCell>
      
      {/* Colonne d'assignation */}
      <TableCell>
        {canAssign ? (
          <ProspectAssignment
            prospect={prospect}
            onAssignmentChange={onAssignmentChange}
            className="w-full"
          />
        ) : (
          <span className="text-sm text-gray-600">
            {getAssignedUserDisplay()}
          </span>
        )}
      </TableCell>
      
      <TableCell className="text-sm">
        {prospect.prochaineAction ? new Date(prospect.prochaineAction).toLocaleDateString('fr-FR') : '-'}
      </TableCell>
      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
        {prospect.notes || '-'}
      </TableCell>
      
      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {canEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(prospect)}
              title="Modifier le prospect"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled
              title={
                userRole?.role === 'agent' 
                  ? "Vous ne pouvez modifier que vos prospects ou ceux qui vous sont assignés"
                  : userRole?.role === 'manager'
                  ? "Vous ne pouvez modifier que vos prospects ou ceux qui vous sont assignés"
                  : "Vous n'avez pas les permissions pour modifier ce prospect"
              }
            >
              <Edit2 className="h-4 w-4 text-gray-400" />
            </Button>
          )}
          {canDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(prospect.id)}
              title="Supprimer le prospect"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled
              title={
                userRole?.role === 'agent' 
                  ? "Vous ne pouvez supprimer que vos propres prospects"
                  : userRole?.role === 'manager'
                  ? "Vous ne pouvez supprimer que vos propres prospects"
                  : "Vous n'avez pas les permissions pour supprimer ce prospect"
              }
            >
              <Trash2 className="h-4 w-4 text-gray-400" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default ProspectTableRow;