import React, { useState, useEffect } from 'react';
import { apiService, VendorData } from '../api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalCustomers: number;
  totalRevenue: number;
  activeVendors: number;
  pendingKYC: number;
  recentOrders: any[];
  topVendors: any[];
}

const ExampleApiUsage: React.FC = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Using the useApi hook for automatic error handling
  const { loading: vendorsLoading, error: vendorsError, execute: fetchVendors } = useApi({
    onSuccess: (data) => setVendors(data.data || []),
    onError: (error) => console.error('Failed to fetch vendors:', error)
  });

  const { loading: statsLoading, error: statsError, execute: fetchStats } = useApi({
    onSuccess: (data) => setStats(data.data),
    onError: (error) => console.error('Failed to fetch stats:', error)
  });

  // Example of using the API service directly
  const handleDirectApiCall = async () => {
    try {
      const response = await apiService.getDashboardStats();
      if (response.success) {
        console.log('Dashboard stats:', response.data);
      }
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  // Example of using the useApi hook
  const handleHookApiCall = () => {
    fetchVendors(() => apiService.getVendors(1, 10));
  };

  const handleFetchStats = () => {
    fetchStats(() => apiService.getDashboardStats());
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">API Usage Examples</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current User</h3>
        <p className="text-gray-600">
          Logged in as: {user?.name} ({user?.email})
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Direct API Call</h3>
          <button
            onClick={handleDirectApiCall}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Fetch Dashboard Stats (Direct)
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Using useApi Hook</h3>
          <div className="space-y-2">
            <button
              onClick={handleHookApiCall}
              disabled={vendorsLoading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {vendorsLoading ? 'Loading...' : 'Fetch Vendors (Hook)'}
            </button>
            
            <button
              onClick={handleFetchStats}
              disabled={statsLoading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
            >
              {statsLoading ? 'Loading...' : 'Fetch Stats (Hook)'}
            </button>
          </div>
          
          {vendorsError && (
            <p className="text-red-600 text-sm mt-2">Vendors Error: {vendorsError}</p>
          )}
          
          {statsError && (
            <p className="text-red-600 text-sm mt-2">Stats Error: {statsError}</p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">
              Vendors loaded: {vendors.length}
            </p>
            {stats && (
              <p className="text-sm text-gray-600">
                Stats loaded: {stats.totalUsers} users, {stats.totalVendors} vendors
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleApiUsage; 