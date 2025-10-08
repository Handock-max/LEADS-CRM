import React, { useState, useEffect } from 'react';
import { useProspectAssignment } from '@/hooks/useProspectAssignment';
import { Prospect } from '@/lib/mockData';

interface ProspectAssignmentProps {
  prospect: Prospect;
  onAssignmentChange?: (prospect: Prospect) => void;
  className?: string;
}

export function ProspectAssignment({ 
  prospect, 
  onAssignmentChange,
  className = '' 
}: ProspectAssignmentProps) {
  const {
    loading,
    error,
    workspaceUsers,
    loadWorkspaceUsers,
    assignProspect,
    unassignProspect,
    canAssignProspects,
    getAssignableUsers,
    clearError
  } = useProspectAssignment();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    if (canAssignProspects()) {
      loadWorkspaceUsers();
    }
  }, [canAssignProspects, loadWorkspaceUsers]);

  // Réinitialiser la sélection quand on ouvre le dropdown
  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(prospect.assigned_to || '');
      clearError();
    }
  }, [isOpen, prospect.assigned_to, clearError]);

  const assignableUsers = getAssignableUsers();

  // Ne pas afficher le composant si l'utilisateur ne peut pas assigner
  if (!canAssignProspects()) {
    return null;
  }

  const handleAssign = async () => {
    if (!selectedUserId) return;

    const result = await assignProspect(prospect.id, selectedUserId);
    
    if (result.success && result.data) {
      onAssignmentChange?.(result.data);
      setIsOpen(false);
    }
  };

  const handleUnassign = async () => {
    const result = await unassignProspect(prospect.id);
    
    if (result.success && result.data) {
      onAssignmentChange?.(result.data);
      setIsOpen(false);
    }
  };

  const getAssignedUserName = () => {
    if (!prospect.assigned_to) return 'Non assigné';
    
    const assignedUser = workspaceUsers.find(user => user.id === prospect.assigned_to);
    return assignedUser?.full_name || assignedUser?.email || 'Utilisateur inconnu';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bouton d'assignation */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          inline-flex items-center px-3 py-1 rounded-md text-sm font-medium
          ${prospect.assigned_to 
            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
        `}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        ) : (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
        {getAssignedUserName()}
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown d'assignation */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Assigner le prospect
            </h4>
            
            {error && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              {/* Option "Non assigné" */}
              <label className="flex items-center">
                <input
                  type="radio"
                  name="assignedUser"
                  value=""
                  checked={selectedUserId === ''}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Non assigné</span>
              </label>

              {/* Liste des utilisateurs assignables */}
              {assignableUsers.map((user) => (
                <label key={user.id} className="flex items-center">
                  <input
                    type="radio"
                    name="assignedUser"
                    value={user.id}
                    checked={selectedUserId === user.id}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="mr-2"
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

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              
              {selectedUserId === '' ? (
                <button
                  onClick={handleUnassign}
                  disabled={loading || !prospect.assigned_to}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Désassigner
                </button>
              ) : (
                <button
                  onClick={handleAssign}
                  disabled={loading || selectedUserId === prospect.assigned_to}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assigner
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default ProspectAssignment;