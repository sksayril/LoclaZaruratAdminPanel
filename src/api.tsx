// API Service for Local Zarurat Admin Panel
// Base URL: http://localhost:3100

// const BASE_URL = 'https://7cvccltb-3100.inc1.devtunnels.ms';
// const BASE_URL = 'http://localhost:3110';
const BASE_URL = 'https://api.localzarurat.com';

// Types for API responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      address: {
        country: string;
      };
      vendorDetails: {
        vendorAddress: {
          country: string;
        };
        kyc: {
          isVerified: boolean;
        };
        subscription: {
          features: {
            maxProducts: number;
            maxImages: number;
            prioritySupport: boolean;
            featuredListing: boolean;
          };
          status: string;
        };
        wallet: {
          balance: number;
          transactions: any[];
        };
        ratingDistribution: {
          "1": number;
          "2": number;
          "3": number;
          "4": number;
          "5": number;
        };
        shopMetaKeywords: string[];
        shopMetaTags: string[];
        shopImages: string[];
        isShopListed: boolean;
        averageRating: number;
        totalRatings: number;
        withdrawalRequests: any[];
      };
      customerDetails: {
        preferences: {
          categories: string[];
        };
        favorites: any[];
      };
      adminDetails: {
        permissions: string[];
        lastLogin: string;
        createdBy: string | null;
        isSuperAdmin: boolean;
        accessLevel: string;
      };
      _id: string;
      email: string;
      role: string;
      name: string;
      phone: string;
      isActive: boolean;
      isEmailVerified: boolean;
      isPhoneVerified: boolean;
      profileImage: string | null;
      loginAttempts: number;
      lastLogin: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
    };
    token: string;
  };
}

export interface User {
  _id: string;
  email: string;
  role: string;
  name: string;
  phone: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileImage: string | null;
  loginAttempts: number;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  // Additional fields from login response
  address?: {
    country: string;
  };
  vendorDetails?: {
    vendorAddress: {
      country: string;
    };
    kyc: {
      isVerified: boolean;
    };
    subscription: {
      features: {
        maxProducts: number;
        maxImages: number;
        prioritySupport: boolean;
        featuredListing: boolean;
      };
      status: string;
    };
    wallet: {
      balance: number;
      transactions: any[];
    };
    ratingDistribution: {
      "1": number;
      "2": number;
      "3": number;
      "4": number;
      "5": number;
    };
    shopMetaKeywords: string[];
    shopMetaTags: string[];
    shopImages: string[];
    isShopListed: boolean;
    averageRating: number;
    totalRatings: number;
    withdrawalRequests: any[];
  };
  customerDetails?: {
    preferences: {
      categories: string[];
    };
    favorites: any[];
  };
  adminDetails?: {
    permissions: string[];
    lastLogin: string;
    createdBy: string | null;
    isSuperAdmin: boolean;
    accessLevel: string;
  };
}

export interface VendorData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  kyc: {
    isVerified: boolean;
  };
  subscription: {
    status: string;
    features: {
      maxProducts: number;
      maxImages: number;
      prioritySupport: boolean;
      featuredListing: boolean;
    };
  };
  wallet: {
    balance: number;
  };
  averageRating: number;
  totalRatings: number;
  isShopListed: boolean;
  createdAt: string;
}

export interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  preferences: {
    categories: string[];
  };
  favorites: any[];
  createdAt: string;
}

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  revenueByCategory: {
    category: string;
    amount: number;
  }[];
  revenueByVendor: {
    vendorId: string;
    vendorName: string;
    amount: number;
  }[];
}

export interface PnLData {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  monthlyData: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

export interface ReportData {
  totalUsers: number;
  totalVendors: number;
  totalCustomers: number;
  activeVendors: number;
  inactiveVendors: number;
  verifiedVendors: number;
  unverifiedVendors: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

import { tokenManager } from './utils/tokenManager';

// Utility function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return tokenManager.getToken();
};

// Utility function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Enhanced error handling for authentication issues
    if (response.status === 401) {
      throw new Error('Unauthorized: Please log in again');
    } else if (response.status === 403) {
      throw new Error('Forbidden: You do not have permission to access this resource');
    } else if (response.status === 404) {
      throw new Error('Resource not found');
    } else if (response.status >= 500) {
      throw new Error('Server error: Please try again later');
    } else {
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }
  return response.json();
};

// API Service Class
class ApiService {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{ resolve: Function; reject: Function }> = [];

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
  }

  // Process failed requests queue
  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  // Refresh token utility
  private async refreshTokenIfNeeded(): Promise<string | null> {
    const token = getAuthToken();
    if (!token) return null;

    // Check if token is expired or will expire soon
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const fiveMinutes = 5 * 60; // 5 minutes in seconds
      
      if ((payload.exp - currentTime) < fiveMinutes) {
        // Token will expire soon, try to refresh
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          
          try {
            const response = await this.refreshToken();
            if (response.success) {
              tokenManager.setToken(response.data.token);
              this.processQueue(null, response.data.token);
              this.isRefreshing = false;
              return response.data.token;
            } else {
              throw new Error('Token refresh failed');
            }
          } catch (error) {
            this.processQueue(error);
            this.isRefreshing = false;
            throw error;
          }
        } else {
          // Return a promise that resolves when the refresh is complete
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          });
        }
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
    
    return token;
  }

  // Authentication APIs
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  async refreshToken(): Promise<{ success: boolean; data: { token: string } }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  }

  // User Management APIs
  async getUsers(page: number = 1, limit: number = 10, search?: string): Promise<{
    success: boolean;
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const token = await this.refreshTokenIfNeeded();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);

    const response = await fetch(`${this.baseURL}/api/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getUserById(userId: string): Promise<{ success: boolean; data: User }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<{ success: boolean; data: User }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  }

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Vendor Management APIs
  async getVendors(page: number = 1, limit: number = 10, status: string = 'all', kyc: string = 'all', search?: string, pincode?: string): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: status,
      kyc: kyc,
    });
    if (search) params.append('search', search);
    if (pincode) params.append('pincode', pincode);

    const response = await fetch(`${this.baseURL}/api/admin/vendors?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getVendorById(vendorId: string): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/vendors/${vendorId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async updateVendorStatus(vendorId: string, isActive: boolean, reason?: string): Promise<{ success: boolean; message: string; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/vendors/status/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: vendorId,
        isActive: isActive,
        reason: reason
      }),
    });
    return handleResponse(response);
  }

  // KYC Management APIs
  async getPendingKYCRequests(page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseURL}/api/admin/kyc/pending?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getAllKYCRequests(page: number = 1, limit: number = 10, status: string = 'all'): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: status,
    });

    const response = await fetch(`${this.baseURL}/api/admin/kyc/all?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async verifyVendorKYC(vendorId: string, isVerified: boolean, adminNotes?: string): Promise<{ success: boolean; message: string; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/kyc/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorId: vendorId,
        isVerified: isVerified,
        adminNotes: adminNotes
      }),
    });
    return handleResponse(response);
  }

  async rejectVendorKYC(vendorId: string, adminNotes: string): Promise<{ success: boolean; message: string; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/kyc/reject/${vendorId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isVerified: false,
        adminNotes: adminNotes
      }),
    });
    return handleResponse(response);
  }

  async suspendVendor(vendorId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/vendors/${vendorId}/suspend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  }

  async activateVendor(vendorId: string): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/vendors/${vendorId}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Customer Management APIs
  async getCustomers(page: number = 1, limit: number = 10, search?: string): Promise<{
    success: boolean;
    data: CustomerData[];
    total: number;
    page: number;
    limit: number;
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);

    const response = await fetch(`${this.baseURL}/api/admin/customers?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getCustomerById(customerId: string): Promise<{ success: boolean; data: CustomerData }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Revenue APIs
  async getRevenueData(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<{
    success: boolean;
    data: RevenueData;
  }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/revenue?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // P&L APIs
  async getPnLData(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<{
    success: boolean;
    data: PnLData;
  }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/pnl?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Reports APIs
  async getReportsData(): Promise<{
    success: boolean;
    data: ReportData;
  }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/reports`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Dashboard APIs
  async getDashboardStats(): Promise<{
    success: boolean;
    data: {
      stats: {
        totalVendors: number;
        activeVendors: number;
        pendingKYC: number;
        totalCustomers: number;
        totalProducts: number;
        totalCategories: number;
        totalSubCategories: number;
        activeSubscriptions: number;
        pendingWithdrawals: number;
        monthlyRevenue: number;
      };
      recentVendors: Array<{
        _id: string;
        name: string;
        email: string;
        vendorDetails: {
          shopName: string;
          isShopListed: boolean;
          hasActiveSubscription: boolean;
        };
        createdAt: string;
      }>;
      recentKYCRequests: Array<{
        _id: string;
        name: string;
        email: string;
        vendorDetails: {
          kyc: {
            isVerified: boolean;
            panUploaded: boolean;
            aadharUploaded: boolean;
          };
        };
        createdAt: string;
      }>;
      recentWithdrawals: Array<{
        _id: string;
        vendor: {
          name: string;
          email: string;
        };
        amount: number;
        status: string;
        requestDate: string;
      }>;
    };
  }> {
    const token = await this.refreshTokenIfNeeded();
    const response = await fetch(`${this.baseURL}/api/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Order Management APIs
  async getOrders(page: number = 1, limit: number = 10, status?: string): Promise<{
    success: boolean;
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseURL}/api/admin/orders?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getOrderById(orderId: string): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Withdrawal Requests APIs
  async getWithdrawalRequests(page: number = 1, limit: number = 10, status?: string, paymentMethod?: string): Promise<{
    success: boolean;
    data: {
      withdrawalRequests: Array<{
        _id: string;
        name: string;
        email: string;
        vendorDetails: {
          shopName: string;
          wallet: {
            balance: number;
          };
        };
        withdrawalRequest: {
          _id: string;
          amount: number;
          paymentMethod: 'upi' | 'bank';
          upiId?: string;
          bankDetails?: {
            accountNumber: string;
            ifscCode: string;
            accountHolderName: string;
            bankName: string;
          };
          status: 'pending' | 'approved' | 'rejected';
          requestDate: string;
          processedDate?: string;
          processedBy?: string;
          adminNotes?: string;
          transactionId?: string;
        };
      }>;
      summary: {
        pending: { count: number; amount: number };
        approved: { count: number; amount: number };
        rejected: { count: number; amount: number };
      };
      totals: {
        totalRequests: number;
        totalAmount: number;
      };
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status && status !== 'all') {
      params.append('status', status);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      params.append('paymentMethod', paymentMethod);
    }

    const response = await fetch(`${this.baseURL}/api/admin/withdrawals?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  }

  async getWithdrawalRequestDetails(requestId: string): Promise<{
    success: boolean;
    data: {
      _id: string;
      name: string;
      email: string;
      vendorDetails: {
        shopName: string;
        wallet: {
          balance: number;
        };
      };
      withdrawalRequest: {
        _id: string;
        amount: number;
        paymentMethod: 'upi' | 'bank';
        upiId?: string;
        bankDetails?: {
          accountNumber: string;
          ifscCode: string;
          accountHolderName: string;
          bankName: string;
        };
        status: 'pending' | 'approved' | 'rejected';
        requestDate: string;
        processedDate?: string;
        processedBy?: string;
        adminNotes?: string;
        transactionId?: string;
      };
    };
  }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseURL}/api/admin/withdrawals/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return handleResponse(response);
  }

  async processWithdrawalRequest(vendorId: string, requestId: string, status: 'approved' | 'rejected', adminNotes?: string, transactionId?: string): Promise<{
    success: boolean;
    message: string;
    data: {
      withdrawalRequest: {
        _id: string;
        amount: number;
        paymentMethod: 'upi' | 'bank';
        upiId?: string;
        bankDetails?: {
          accountNumber: string;
          ifscCode: string;
          accountHolderName: string;
          bankName: string;
        };
        status: 'pending' | 'approved' | 'rejected';
        requestDate: string;
        processedDate?: string;
        processedBy?: string;
        adminNotes?: string;
        transactionId?: string;
      };
      vendor: {
        _id: string;
        name: string;
        vendorDetails: {
          shopName: string;
        };
      };
      walletBalance: number;
    };
  }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const requestBody: any = {
      vendorId,
      requestId,
      status,
    };

    if (adminNotes) {
      requestBody.adminNotes = adminNotes;
    }

    if (transactionId) {
      requestBody.transactionId = transactionId;
    }

    const response = await fetch(`${this.baseURL}/api/admin/withdrawals/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return handleResponse(response);
  }

  // Settings APIs
  async getSystemSettings(): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async updateSystemSettings(settings: any): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  }

  // Profile APIs
  async getProfile(): Promise<{ success: boolean; data: User }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async updateProfile(profileData: Partial<User>): Promise<{ success: boolean; data: User }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  }

  // Category Management APIs
  async getCategories(page: number = 1, limit: number = 10, search?: string): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);

    const response = await fetch(`${this.baseURL}/api/admin/categories/main?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getCategoryById(categoryId: string): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async createCategory(categoryData: FormData): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/categories/main`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: categoryData,
    });
    return handleResponse(response);
  }

  async updateCategory(categoryId: string, categoryData: FormData): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    // Add the category ID to the FormData
    categoryData.append('id', categoryId);
    
    const response = await fetch(`${this.baseURL}/api/admin/categories/main/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: categoryData,
    });
    return handleResponse(response);
  }

  async deleteCategory(categoryId: string): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/categories/main/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: categoryId }),
    });
    return handleResponse(response);
  }

  // Sub Category Management APIs
  async createSubCategory(subCategoryData: FormData): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/categories/sub`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: subCategoryData,
    });
    return handleResponse(response);
  }

  async getSubCategoriesByMainCategory(mainCategoryId: string, page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseURL}/api/admin/categories/sub/${mainCategoryId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Subscription Management APIs
  async getSubscriptions(page: number = 1, limit: number = 10, status: string = 'all'): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: status,
    });

    const response = await fetch(`${this.baseURL}/api/admin/subscriptions?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getSubscriptionStatistics(): Promise<{
    success: boolean;
    data: {
      total: number;
      active: number;
      pending: number;
      expired: number;
      byPlan: {
        '3months': number;
        '6months': number;
        '1year': number;
      };
      revenue: {
        total: number;
        thisMonth: number;
        lastMonth: number;
      };
    };
  }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Comprehensive Subscription Statistics API
  async getComprehensiveSubscriptionStats(params: {
    period?: 'all' | 'month' | 'quarter' | 'year';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    success: boolean;
    data: {
      summary: {
        totalSubscriptions: number;
        totalAmount: number;
        averageAmount: number;
        activeSubscriptions: number;
        pendingSubscriptions: number;
        expiredSubscriptions: number;
        cancelledSubscriptions: number;
        activeRevenue: number;
        pendingRevenue: number;
        totalCommissions: number;
        netRevenue: number;
      };
      statusDistribution: Array<{
        _id: string;
        count: number;
        totalAmount: number;
        averageAmount: number;
      }>;
      planDistribution: Array<{
        _id: string;
        count: number;
        totalAmount: number;
        averageAmount: number;
        activeCount: number;
        pendingCount: number;
        expiredCount: number;
        cancelledCount: number;
      }>;
      monthlyTrends: Array<{
        _id: {
          year: number;
          month: number;
        };
        count: number;
        totalAmount: number;
        activeCount: number;
        pendingCount: number;
      }>;
      topVendors: Array<{
        vendor: {
          _id: string;
          name: string;
          email: string;
          vendorDetails: {
            shopName: string;
          };
        };
        totalSubscriptions: number;
        totalAmount: number;
        activeSubscriptions: number;
        averageAmount: number;
      }>;
      commissionDistribution: Array<{
        _id: number;
        count: number;
        totalAmount: number;
        averageAmount: number;
      }>;
      growthMetrics: {
        subscriptionGrowth: number;
        revenueGrowth: number;
        activeGrowth: number;
      };
      period: string;
      dateFilter: {
        createdAt: {
          $gte: string;
          $lte: string;
        };
      };
    };
  }> {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(`${this.baseURL}/api/admin/subscriptions/statistics?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async initializeRazorpayPlans(): Promise<{
    success: boolean;
    message: string;
    data: Array<{
      planId: string;
      razorpayPlanId: string;
      plan: {
        id: string;
        name: string;
        amount: number;
        currency: string;
        interval: string;
        interval_count: number;
      };
    }>;
  }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/init-razorpay-plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Vendor Commission Management APIs
  async getVendorCommission(vendorId: string): Promise<{
    success: boolean;
    data: {
      vendor: {
        _id: string;
        name: string;
        vendorDetails: {
          shopName: string;
        };
      };
      commissionSettings: {
        commissionPercentage: number;
        isCustomCommission: boolean;
        notes: string;
        setBy: {
          _id: string;
          name: string;
        };
      };
      statistics: {
        totalCommissions: number;
        totalAmount: number;
        averageCommission: number;
      };
      recentCommissions: Array<{
        _id: string;
        commission: {
          percentage: number;
          amount: number;
          currency: string;
        };
        referredVendor: {
          _id: string;
          name: string;
          vendorDetails: {
            shopName: string;
          };
        };
        status: string;
        createdAt: string;
      }>;
    };
  }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/vendors/${vendorId}/commission`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async setVendorCommission(vendorId: string, commissionData: {
    commissionPercentage: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      vendor: {
        _id: string;
        name: string;
        vendorDetails: {
          shopName: string;
        };
      };
      commissionSettings: {
        commissionPercentage: number;
        isCustomCommission: boolean;
        notes: string;
        setBy: string;
        updatedAt: string;
      };
    };
  }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/vendors/${vendorId}/commission`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commissionData),
    });
    return handleResponse(response);
  }

  // Revenue Analytics APIs
  async getRevenueAnalytics(params: {
    period?: 'all' | 'month' | 'quarter' | 'year';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    success: boolean;
    data: {
      summary: {
        totalSubscriptionRevenue: number;
        totalWalletBalance: number;
        totalCommissionPaid: number;
        netRevenue: number;
        growthPercentage: number;
      };
      subscriptionAnalytics: {
        totalSubscriptions: number;
        averageSubscriptionValue: number;
        byPlan: Array<{
          _id: string;
          count: number;
          totalRevenue: number;
          averageValue: number;
        }>;
      };
      walletAnalytics: {
        totalVendors: number;
        averageWalletBalance: number;
        vendorsWithBalance: number;
        topVendorsByWallet: Array<{
          _id: string;
          name: string;
          vendorDetails: {
            shopName: string;
            wallet: {
              balance: number;
              transactions: Array<{
                type: string;
                amount: number;
                description: string;
                date: string;
              }>;
            };
          };
        }>;
      };
      commissionAnalytics: {
        totalCommissions: number;
        averageCommission: number;
      };
      revenueDistribution: {
        subscriptionRevenue: number;
        walletBalance: number;
        commissionPaid: number;
        netRevenue: number;
        percentages: {
          subscription: number;
          wallet: number;
          commission: number;
        };
      };
      monthlyTrends: Array<{
        _id: {
          year: number;
          month: number;
        };
        subscriptionRevenue: number;
        subscriptionCount: number;
      }>;
      period: string;
      dateFilter: {
        createdAt: {
          $gte: string;
          $lte: string;
        };
      };
    };
  }> {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(`${this.baseURL}/api/admin/revenue/analytics?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  // Super Employee Management APIs
  async getSuperEmployees(page: number = 1, limit: number = 10, status: string = 'all', role: string = 'all', search?: string): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: status,
      role: role,
    });
    if (search) params.append('search', search);

    const response = await fetch(`${this.baseURL}/api/admin/super-employees?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getSuperEmployeeById(employeeId: string): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async getPendingSuperEmployees(page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseURL}/api/admin/super-employees/pending?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async approveSuperEmployee(requestData: {
    superEmployeeId: string;
    status: 'approved';
    adminNotes: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  }

  async rejectSuperEmployee(requestData: {
    superEmployeeId: string;
    status: 'rejected';
    rejectionReason: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  }

  async updateSuperEmployeePermissions(requestData: {
    superEmployeeId: string;
    permissions: string[];
    accessLevel: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  }

  async deactivateSuperEmployee(requestData: {
    superEmployeeId: string;
    reason: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/deactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  }

  async getSuperEmployeeStatistics(): Promise<{ success: boolean; data: any }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async assignAreaToSuperEmployee(requestData: {
    superEmployeeId: string;
    areaId: string;
    areaName: string;
    areaType: string;
    areaCode: string[];
    notes: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/assign-area`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  }

  async removeAreaFromSuperEmployee(requestData: {
    superEmployeeId: string;
    areaId: string;
  }): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/remove-area`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  }

  async updateAreaPermissions(requestData: {
    superEmployeeId: string;
    areaPermissions: {
      canAssignAreas: boolean;
      canViewAllAreas: boolean;
      canManageAreaVendors: boolean;
      canManageAreaCustomers: boolean;
    };
  }): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/area-permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  }

  async createSuperEmployee(employeeData: any): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(employeeData),
    });
    return handleResponse(response);
  }

  async updateSuperEmployee(employeeId: string, employeeData: any): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(employeeData),
    });
    return handleResponse(response);
  }

  async deleteSuperEmployee(employeeId: string): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/${employeeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

  async updateSuperEmployeeStatus(employeeId: string, status: 'active' | 'inactive' | 'suspended'): Promise<{ success: boolean; data: any; message: string }> {
    const token = getAuthToken();
    const response = await fetch(`${this.baseURL}/api/admin/super-employees/${employeeId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  }

  async getSuperEmployeesByArea(params: {
    areaType?: string;
    areaCode?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    
    if (params.areaType) queryParams.append('areaType', params.areaType);
    if (params.areaCode) queryParams.append('areaCode', params.areaCode);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseURL}/api/admin/super-employees/by-area?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  }

}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing or custom instances
export default ApiService; 