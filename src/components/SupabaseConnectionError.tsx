import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SupabaseConnectionErrorProps {
  error: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function SupabaseConnectionError({ 
  error, 
  onRetry, 
  isRetrying = false 
}: SupabaseConnectionErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
          </AlertDescription>
        </Alert>
        
        <div className="text-center">
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="w-full"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-600 mt-4">
            If this problem persists, please check your environment configuration 
            or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}