import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Supabase configuration
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL format'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anonymous key is required'),

  // App configuration
  VITE_APP_NAME: z.string().default('Ash CRM'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_APP_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_BASE_URL: z.string().default('/'),

  // Development flags
  VITE_DEBUG_MODE: z.string().transform((val: string) => val === 'true').default('false'),
});

// Validate and export environment variables
function validateEnv() {
  try {
    return envSchema.parse(import.meta.env);
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