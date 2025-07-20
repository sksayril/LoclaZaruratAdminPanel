import { User } from '../api';

// Utility functions for user data access
export const userUtils = {
  // Get user's admin details
  getAdminDetails: (user: User | null) => {
    return user?.adminDetails || null;
  },

  // Check if user is super admin
  isSuperAdmin: (user: User | null): boolean => {
    return user?.adminDetails?.isSuperAdmin || false;
  },

  // Get user permissions
  getPermissions: (user: User | null): string[] => {
    return user?.adminDetails?.permissions || [];
  },

  // Check if user has specific permission
  hasPermission: (user: User | null, permission: string): boolean => {
    const permissions = user?.adminDetails?.permissions || [];
    return permissions.includes('all') || permissions.includes(permission);
  },

  // Get user's access level
  getAccessLevel: (user: User | null): string => {
    return user?.adminDetails?.accessLevel || 'none';
  },

  // Get user's vendor details (if they have any)
  getVendorDetails: (user: User | null) => {
    return user?.vendorDetails || null;
  },

  // Check if user is a vendor
  isVendor: (user: User | null): boolean => {
    return !!user?.vendorDetails;
  },

  // Get user's customer details (if they have any)
  getCustomerDetails: (user: User | null) => {
    return user?.customerDetails || null;
  },

  // Check if user is a customer
  isCustomer: (user: User | null): boolean => {
    return !!user?.customerDetails;
  },

  // Get user's address
  getAddress: (user: User | null) => {
    return user?.address || null;
  },

  // Get user's country
  getCountry: (user: User | null): string => {
    return user?.address?.country || 'Unknown';
  },

  // Get user's wallet balance (if vendor)
  getWalletBalance: (user: User | null): number => {
    return user?.vendorDetails?.wallet?.balance || 0;
  },

  // Check if user's KYC is verified (if vendor)
  isKYCVerified: (user: User | null): boolean => {
    return user?.vendorDetails?.kyc?.isVerified || false;
  },

  // Get user's subscription status (if vendor)
  getSubscriptionStatus: (user: User | null): string => {
    return user?.vendorDetails?.subscription?.status || 'inactive';
  },

  // Get user's average rating (if vendor)
  getAverageRating: (user: User | null): number => {
    return user?.vendorDetails?.averageRating || 0;
  },

  // Get user's total ratings (if vendor)
  getTotalRatings: (user: User | null): number => {
    return user?.vendorDetails?.totalRatings || 0;
  },

  // Check if user's shop is listed (if vendor)
  isShopListed: (user: User | null): boolean => {
    return user?.vendorDetails?.isShopListed || false;
  },

  // Get user's last login time
  getLastLogin: (user: User | null): string => {
    return user?.lastLogin || user?.adminDetails?.lastLogin || '';
  },

  // Format last login for display
  formatLastLogin: (user: User | null): string => {
    const lastLogin = userUtils.getLastLogin(user);
    if (!lastLogin) return 'Never';
    
    try {
      const date = new Date(lastLogin);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  },

  // Get user's role display name
  getRoleDisplayName: (user: User | null): string => {
    if (!user) return 'Unknown';
    
    if (userUtils.isSuperAdmin(user)) return 'Super Admin';
    if (user.role === 'admin') return 'Admin';
    if (userUtils.isVendor(user)) return 'Vendor';
    if (userUtils.isCustomer(user)) return 'Customer';
    
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  },

  // Check if user can access admin panel
  canAccessAdminPanel: (user: User | null): boolean => {
    if (!user) return false;
    
    return user.role === 'admin' || userUtils.isSuperAdmin(user);
  },

  // Get user's profile image URL
  getProfileImage: (user: User | null): string | null => {
    return user?.profileImage || null;
  },

  // Get user's display name (name or email fallback)
  getDisplayName: (user: User | null): string => {
    if (!user) return 'Unknown User';
    return user.name || user.email || 'Unknown User';
  },

  // Check if user is active
  isActive: (user: User | null): boolean => {
    return user?.isActive || false;
  },

  // Check if user's email is verified
  isEmailVerified: (user: User | null): boolean => {
    return user?.isEmailVerified || false;
  },

  // Check if user's phone is verified
  isPhoneVerified: (user: User | null): boolean => {
    return user?.isPhoneVerified || false;
  }
}; 