import { useState, useEffect } from 'react';
import { testSupabaseConnection } from '@/lib/supabase';

interface SupabaseConnectionState {
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    retryConnection: () => void;
}

export function useSupabaseConnection(): SupabaseConnectionState {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkConnection = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await testSupabaseConnection();

            if (result.success) {
                setIsConnected(true);
                setError(null);
            } else {
                setIsConnected(false);
                setError(result.error || 'Failed to connect to Supabase');
            }
        } catch (err) {
            setIsConnected(false);
            setError('Unexpected error while testing Supabase connection');
            console.error('Connection test error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    const retryConnection = () => {
        checkConnection();
    };

    return {
        isConnected,
        isLoading,
        error,
        retryConnection,
    };
}