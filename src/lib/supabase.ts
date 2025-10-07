import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// Lazy initialization of Supabase client
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      console.error('Supabase config:', {
        url: env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
        key: env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
      });
      throw new Error('Supabase configuration missing. Check your environment variables.');
    }

    _supabase = createClient(
      env.VITE_SUPABASE_URL,
      env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false, // Optimisation
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-client-info': 'ash-crm@1.0.0',
          },
        },
      }
    );
  }

  return _supabase;
}

// Export supabase for backward compatibility
export const supabase = getSupabaseClient();

// Test Supabase connection and display appropriate error messages
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();

    // Test basic connection by attempting to get the current session
    const { error } = await client.auth.getSession();

    if (error) {
      console.error('Supabase connection error:', error);
      return {
        success: false,
        error: `Supabase connection failed: ${error.message}. Please check your Supabase URL and anonymous key.`
      };
    }

    // Test database connection by making a simple query
    const { error: dbError } = await client.from('workspaces').select('count').limit(1);

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected if tables aren't created yet
      console.error('Supabase database error:', dbError);
      return {
        success: false,
        error: `Database connection failed: ${dbError.message}. Please ensure your database is properly configured.`
      };
    }

    console.log('Supabase connection successful');
    return { success: true };

  } catch (error) {
    console.error('Unexpected Supabase error:', error);
    return {
      success: false,
      error: `Unexpected error connecting to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Error handler for Supabase-specific errors
export function handleSupabaseError(error: unknown): Error {
  if (!error) return new Error('An unknown error occurred');

  const errorObj = error as { message?: string; code?: string };

  // Auth errors
  if (errorObj.message?.includes('Invalid login credentials')) {
    return new Error('Invalid email or password. Please check your credentials and try again.');
  }

  if (errorObj.message?.includes('Email not confirmed')) {
    return new Error('Please check your email and click the confirmation link before signing in.');
  }

  if (errorObj.message?.includes('Invalid API key')) {
    return new Error('Invalid Supabase configuration. Please contact support.');
  }

  // Network errors
  if (errorObj.message?.includes('fetch')) {
    return new Error('Network error. Please check your internet connection and try again.');
  }

  // Database errors
  if (errorObj.code === 'PGRST301') {
    return new Error('Access denied. You do not have permission to perform this action.');
  }

  if (errorObj.code === 'PGRST116') {
    return new Error('Database table not found. Please ensure the database is properly set up.');
  }

  // Generic error fallback
  return new Error(errorObj.message || 'An unexpected error occurred. Please try again.');
}