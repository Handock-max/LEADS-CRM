import React, { useState, useEffect } from 'react';
import { useProspectAssignment } from '@/hooks/useProspectAssignment';
import { Prospect } from '@/lib/mockData';

interface BulkProspectAssignmentProps {
  selectedProspects: Prospect[];
  onAssignmentComplete?: (updatedProspects: Prospect[]) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export function BulkProspectAssignment({ 
  selectedProspects, 
  onAssignmentComplete,
  onClose,
  isOpen 
}: BulkProspectAssignmentProps) {
  const {
    loading,
    error,
    workspaceUsers,
    loadWorkspaceUsers,
    assignMultipleProspects,
    canAssignProspects,
    getAssignableUsers,
    clearError
  } = useProspectAssignment();

  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    if (canAssignProspects() && isOpen) {
      loadWorkspaceUsers();
    }
  }, [canAssignProspects, loadWorkspaceUsers, isOpen]);

  // Réinitialiser la sélection quand on ouvre le modal
  useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      clearError();
    }
  }, [isOpen, clearError]);

  const assignableUsers = getAssignableUsers();

  // Ne pas afficher le composant si l'utilisateur ne peut pas assigner
  if (!canAssignProspects() || !isOpen) {
    return null;
  }

  const handleBulkAssign = async () => {
    if (!selectedUserId || selectedProspects.length === 0) return;

    const prospectIds = selectedProspects.map(p => p.id);
    const result = await assignMultipleProspects(prospectIds, selectedUserId);
    
    if (result.success && result.data) {
      onAssignmentComplete?.(result.data);
      onClose?.();
    }
  };

  const handleCancel = () => {
    setSelectedUserId('');
    clearError();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Assignation en lot
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Vous allez assigner <strong>{selectedProspects.length}</strong> prospect{selectedProspects.length > 1 ? 's' : ''} :
            </p>
            <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
              {selectedProspects.map((prospect) => (
                <div key={prospect.id} className="text-sm text-gray-700 py-1">
                  • {prospect.entreprise} - {prospect.contact}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigner à :
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {assignableUsers.map((user) => (
                <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="bulkAssignedUser"
                    value={user.id}
                    checked={selectedUserId === user.id}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name || user.email}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleBulkAssign}
              disabled={loading || !selectedUserId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              )}
              Assigner {selectedProspects.length} prospect{selectedProspects.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkProspectAssignment;