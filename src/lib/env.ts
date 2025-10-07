import { z } from 'zod';

// First, get the mock auth setting to determine validation strategy
const isMockAuth = import.meta.env.VITE_MOCK_AUTH !== 'false';

// Environment validation schema with conditional Supabase validation
const envSchema = z.object({
  // Supabase validation only when not in mock mode
  VITE_SUPABASE_URL: isMockAuth
    ? z.string().default('https://placeholder.supabase.co')
    : z.string().url('Invalid Supabase URL format'),
  VITE_SUPABASE_ANON_KEY: isMockAuth
    ? z.string().default('placeholder-key')
    : z.string().min(1, 'Supabase anonymous key is required'),

  // App configuration
  VITE_APP_NAME: z.string().default('Ash CRM'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_APP_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_BASE_URL: z.string().default('/'),

  // Development flags
  VITE_DEBUG_MODE: z.string().transform((val: string) => val === 'true').default('false'),
  VITE_MOCK_DATA: z.string().transform((val: string) => val === 'true').default('false'),
  VITE_MOCK_AUTH: z.string().transform((val: string) => val === 'true').default('true'),
});

// Validate and export environment variables
function validateEnv() {
  try {
    const parsed = envSchema.parse(import.meta.env);

    // Additional validation for production mode
    if (!parsed.VITE_MOCK_AUTH && parsed.VITE_APP_ENVIRONMENT === 'production') {
      if (parsed.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        throw new Error('Real Supabase URL required in production mode');
      }
      if (parsed.VITE_SUPABASE_ANON_KEY === 'placeholder-key') {
        throw new Error('Real Supabase anonymous key required in production mode');
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

export const env = validateEnv();

// Type-safe environment variables
export type Environment = z.infer<typeof envSchema>;