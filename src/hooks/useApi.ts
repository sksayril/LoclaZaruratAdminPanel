import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showError?: boolean;
}

export const useApi = (options: UseApiOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  const execute = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      // Handle authentication errors - check for various unauthorized/expired token patterns
      if (
        err.message?.includes('401') || 
        err.message?.includes('403') ||
        err.message?.includes('Unauthorized') ||
        err.message?.includes('Forbidden') ||
        err.message?.includes('Token expired') ||
        err.message?.includes('Invalid token') ||
        err.message?.includes('Authentication failed')
      ) {
        console.log('Authentication error detected, logging out user:', errorMessage);
        logout();
      }
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [options, logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};

// Specific hooks for common API operations
export const useLogin = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeLogin = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await login(credentials);
      if (!result.success) {
        setError(result.message);
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [login]);

  return {
    loading,
    error,
    executeLogin,
    clearError: () => setError(null),
  };
};

export const useLogout = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const executeLogout = useCallback(async () => {
    setLoading(true);
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return {
    loading,
    executeLogout,
  };
}; 