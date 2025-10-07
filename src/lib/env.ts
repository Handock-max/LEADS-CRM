// Simple environment variables export - no validation
console.log('DEBUG env vars:', import.meta.env);
export const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Ash CRM',
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  VITE_APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development',
  VITE_BASE_URL: import.meta.env.VITE_BASE_URL || '/LEADS-CRM',
  VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
};