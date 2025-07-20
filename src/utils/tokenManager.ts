// Token Management Utilities

const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

export const tokenManager = {
  // Save token to localStorage
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Remove token from localStorage
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Save user data to localStorage
  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Get user data from localStorage
  getUser: (): any | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  // Remove user data from localStorage
  removeUser: (): void => {
    localStorage.removeItem(USER_KEY);
  },

  // Clear all auth data
  clearAuth: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    return !!(token && user);
  },

  // Get auth headers for API requests
  getAuthHeaders: (): Record<string, string> => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
};

// Token expiration utilities
export const tokenUtils = {
  // Check if token is expired (if token has expiration time)
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't parse
    }
  },

  // Get token expiration time
  getTokenExpiration: (token: string): Date | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  },

  // Check if token will expire soon (within 5 minutes)
  isTokenExpiringSoon: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const fiveMinutes = 5 * 60; // 5 minutes in seconds
      return (payload.exp - currentTime) < fiveMinutes;
    } catch (error) {
      console.error('Error checking if token expires soon:', error);
      return true;
    }
  }
}; 