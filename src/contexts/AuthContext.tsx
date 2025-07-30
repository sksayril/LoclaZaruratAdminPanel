import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, LoginRequest, LoginResponse, User } from '../api';
import { tokenManager } from '../utils/tokenManager';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = tokenManager.getToken();
      const storedUser = tokenManager.getUser();

      if (storedToken && storedUser) {
        try {
          // First, try to validate token by making a simple API call
          // Use dashboard API instead of profile API for better reliability
          const response = await apiService.getDashboardStats();
          if (response.success) {
            // Token is valid, restore user session
            setToken(storedToken);
            setUser(storedUser);
            setIsAuthenticated(true);
            
            console.log('App initialized with stored user:', storedUser);
          } else {
            // Token is invalid, clear storage
            console.log('Token validation failed, clearing auth');
            tokenManager.clearAuth();
          }
        } catch (error: any) {
          console.error('Token validation error:', error);
          
          // Check for specific authentication errors
          const isAuthError = error.message && (
            error.message.includes('401') || 
            error.message.includes('403') ||
            error.message.includes('Unauthorized') ||
            error.message.includes('Forbidden') ||
            error.message.includes('Token expired') ||
            error.message.includes('Invalid token') ||
            error.message.includes('Authentication failed')
          );
          
          if (isAuthError) {
            console.log('Authentication error detected, clearing auth');
            tokenManager.clearAuth();
          } else {
            // For network errors, keep the user logged in but show a warning
            console.log('Network error during token validation, keeping user logged in');
            setToken(storedToken);
            setUser(storedUser);
            setIsAuthenticated(true);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      const response: LoginResponse = await apiService.login(credentials);
      
      if (response.success) {
        // Save token and complete user data using token manager
        tokenManager.setToken(response.data.token);
        tokenManager.setUser(response.data.user);
        
        // Update state with complete user data from login response
        setToken(response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        console.log('Login successful:', {
          user: response.data.user,
          token: response.data.token,
          adminDetails: response.data.user.adminDetails
        });
        
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user...');
    
    // Clear auth data using token manager
    tokenManager.clearAuth();
    
    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Call logout API (optional, for server-side cleanup)
    if (token) {
      apiService.logout().catch((error) => {
        // Ignore logout API errors, but log them
        console.log('Logout API call failed (this is normal):', error);
      });
    }
    
    console.log('User logged out successfully');
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 