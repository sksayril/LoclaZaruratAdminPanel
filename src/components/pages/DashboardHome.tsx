import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Activity, 
  Building2, 
  UserCheck, 
  Package, 
  Tag, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { apiService } from '../../api';
import { useApi } from '../../hooks/useApi';

const DashboardHome: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);

  // API hook for fetching dashboard data
  const { loading, error, execute: fetchDashboardData } = useApi({
    onSuccess: (data) => {
      setDashboardData(data.data);
    },
    onError: (error) => console.error('Failed to fetch dashboard data:', error)
  });

  // Load dashboard data on component mount
  useEffect(() => {
    fetchDashboardData(() => apiService.getDashboardStats());
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <div className="flex space-x-2">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {dashboardData && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboardData.stats.monthlyRevenue)}
                </p>
                </div>
              <div className="bg-green-500 rounded-full p-3">
                <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+12.5%</span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(dashboardData.stats.totalVendors)}
                </p>
              </div>
              <div className="bg-blue-500 rounded-full p-3">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">
                {formatNumber(dashboardData.stats.activeVendors)} active
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(dashboardData.stats.totalCustomers)}
                </p>
              </div>
              <div className="bg-purple-500 rounded-full p-3">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">
                {formatNumber(dashboardData.stats.totalProducts)} products
              </span>
            </div>
      </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(dashboardData.stats.totalCategories)}
                </p>
              </div>
              <div className="bg-orange-500 rounded-full p-3">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">
                {formatNumber(dashboardData.stats.totalSubCategories)} subcategories
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-sky-500 mx-auto mb-2" />
              <p className="text-gray-600">Revenue chart visualization</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Growth</h3>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-center">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">Customer growth chart</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Vendors */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Recent Vendors
            </h3>
            <div className="space-y-4">
              {dashboardData.recentVendors?.slice(0, 5).map((vendor: any) => (
                <div key={vendor._id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {vendor.vendorDetails.isShopListed && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Listed
                        </span>
                      )}
                      {vendor.vendorDetails.hasActiveSubscription && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          <CreditCard className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent KYC Requests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Pending KYC ({dashboardData.stats.pendingKYC})
            </h3>
            <div className="space-y-4">
              {dashboardData.recentKYCRequests?.slice(0, 5).map((kyc: any) => (
                <div key={kyc._id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                  <div className="bg-yellow-100 rounded-full p-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{kyc.name}</p>
                    <p className="text-xs text-gray-500">{kyc.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {kyc.vendorDetails.kyc.panUploaded && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          PAN ✓
                        </span>
                      )}
                      {kyc.vendorDetails.kyc.aadharUploaded && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          Aadhar ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Withdrawals */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Pending Withdrawals ({dashboardData.stats.pendingWithdrawals})
            </h3>
        <div className="space-y-4">
              {dashboardData.recentWithdrawals?.slice(0, 5).map((withdrawal: any) => (
                <div key={withdrawal._id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                  <div className="bg-purple-100 rounded-full p-2">
                    <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{withdrawal.vendor.name}</p>
                    <p className="text-xs text-gray-500">{withdrawal.vendor.email}</p>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {formatCurrency(withdrawal.amount)}
                    </p>
              </div>
              <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      withdrawal.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {withdrawal.status}
                    </span>
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;