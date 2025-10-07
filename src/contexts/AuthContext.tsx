import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '@/lib/authService';
import { AuthContextType, AuthState, Workspace, UserRole } from '@/types/auth';
import { env } from '@/lib/env';

// Auth reducer for state management
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_WORKSPACE'; payload: Workspace | null }
  | { type: 'SET_USER_ROLE'; payload: UserRole | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

const initialState: AuthState = {
  user: null,
  workspace: null,
  userRole: null,
  loading: true,
  error: null,
  initialized: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_WORKSPACE':
      return { ...state, workspace: action.payload };
    case 'SET_USER_ROLE':
      return { ...state, userRole: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET_STATE':
      return { ...initialState, initialized: true, loading: false };
    default:
      return state;
  }
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Fetch user workspace and role
  const fetchUserData = useCallback(async (user: User) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { workspace, userRole, error } = await authService.getUserData(user);

      if (error) {
        console.error('Error fetching user data:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return;
      }

      if (!userRole || !workspace) {
        dispatch({ type: 'SET_ERROR', payload: 'No active workspace found. Please contact your administrator.' });
        return;
      }

      dispatch({ type: 'SET_USER_ROLE', payload: userRole });
      dispatch({ type: 'SET_WORKSPACE', payload: workspace });
      dispatch({ type: 'SET_ERROR', payload: null });

    } catch (error) {
      console.error('Error in fetchUserData:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error occurred' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth with Supabase service');
        
        // Get initial session
        const { user, error } = await authService.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
          }
          return;
        }

        if (user && mounted) {
          dispatch({ type: 'SET_USER', payload: user });
          await fetchUserData(user);
        } else if (mounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }

      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error occurred' });
        }
      } finally {
        if (mounted) {
          dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { unsubscribe } = authService.onAuthStateChange(
      async (user) => {
        if (!mounted) return;

        console.log('Auth state changed:', user?.email || 'signed out');

        if (user) {
          dispatch({ type: 'SET_USER', payload: user });
          await fetchUserData(user);
        } else {
          dispatch({ type: 'RESET_STATE' });
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchUserData]);

  // Sign in method
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { user, error } = await authService.signIn(email, password);

      if (error) {
        throw error;
      }

      if (!user) {
        throw new Error('Sign in failed - no user returned');
      }

      // User data will be set by the auth state change listener
      // No need to manually set it here

    } catch (error) {
      console.error('Sign in error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error occurred' });
      throw error; // Re-throw for form handling
    }
  }, []);

  // Sign out method
  const signOut = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { error } = await authService.signOut();

      if (error) {
        throw error;
      }

      // State will be reset by the auth state change listener

    } catch (error) {
      console.error('Sign out error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error occurred' });
      throw error;
    }
  }, []);

  // Clear error method
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: AuthContextType = {
    user: state.user,
    workspace: state.workspace,
    userRole: state.userRole,
    signIn,
    signOut,
    loading: state.loading,
    error: state.error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}