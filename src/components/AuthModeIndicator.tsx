import React from 'react';
import { env } from '@/lib/env';
import { Badge } from '@/components/ui/badge';

export function AuthModeIndicator() {
  if (env.VITE_APP_ENVIRONMENT === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge 
        variant={env.VITE_MOCK_AUTH ? "secondary" : "default"}
        className={`${
          env.VITE_MOCK_AUTH 
            ? 'bg-orange-100 text-orange-800 border-orange-200' 
            : 'bg-green-100 text-green-800 border-green-200'
        } font-mono text-xs`}
      >
        {env.VITE_MOCK_AUTH ? '🧪 MOCK AUTH' : '🚀 SUPABASE'}
      </Badge>
    </div>
  );
}