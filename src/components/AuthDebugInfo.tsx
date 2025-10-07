import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { env } from '@/lib/env';

export function AuthDebugInfo() {
  const { user, userRole, workspace, loading, error } = useAuth();

  // Only show in development
  if (env.VITE_APP_ENVIRONMENT !== 'development' || !env.VITE_DEBUG_MODE) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <details className="bg-black/80 text-white text-xs p-3 rounded-lg font-mono">
        <summary className="cursor-pointer font-bold text-yellow-400">
          🐛 Auth Debug
        </summary>
        <div className="mt-2 space-y-1">
          <div>
            <span className="text-gray-400">Mode:</span>{' '}
            <span className={env.VITE_MOCK_AUTH ? 'text-orange-400' : 'text-green-400'}>
              {env.VITE_MOCK_AUTH ? 'MOCK' : 'SUPABASE'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Loading:</span>{' '}
            <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
              {loading ? 'true' : 'false'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">User:</span>{' '}
            <span className={user ? 'text-green-400' : 'text-red-400'}>
              {user ? user.email : 'null'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Role:</span>{' '}
            <span className={userRole ? 'text-blue-400' : 'text-red-400'}>
              {userRole ? userRole.role : 'null'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Workspace:</span>{' '}
            <span className={workspace ? 'text-purple-400' : 'text-red-400'}>
              {workspace ? workspace.name : 'null'}
            </span>
          </div>
          {error && (
            <div>
              <span className="text-gray-400">Error:</span>{' '}
              <span className="text-red-400 break-words">
                {error}
              </span>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}