import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Users,
  Wallet,
  CreditCard,
  PieChart,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiService } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';

interface RevenueAnalytics {
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
}

const Revenue: React.FC = () => {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTopVendors, setShowTopVendors] = useState(false);
  const { addToast } = useToast();

  // API hook for revenue analytics
  const { loading, error, execute: fetchAnalytics } = useApi({
    onSuccess: (data) => {
      setAnalytics(data.data);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load revenue analytics.'
      });
    }
  });

  // Load analytics on component mount and when filters change
  useEffect(() => {
    const params: any = { period: selectedPeriod };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    fetchAnalytics(() => apiService.getRevenueAnalytics(params));
  }, [selectedPeriod, startDate, endDate]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get month name
  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  };

  // Handle period change
  const handlePeriodChange = (period: 'all' | 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(period);
    setStartDate('');
    setEndDate('');
  };

  // Handle custom date range
  const handleCustomDateRange = () => {
    if (startDate && endDate) {
      setSelectedPeriod('all');
      setShowDatePicker(false);
    } else {
      addToast({
        type: 'error',
        title: 'Invalid Date Range',
        message: 'Please select both start and end dates.'
      });
    }
  };

  // Generate pie chart data
  const getPieChartData = () => {
    if (!analytics) return [];
    
    return [
      {
        name: 'Subscription Revenue',
        value: analytics.revenueDistribution.subscriptionRevenue,
        percentage: analytics.revenueDistribution.percentages.subscription,
        color: '#3B82F6'
      },
      {
        name: 'Wallet Balance',
        value: analytics.revenueDistribution.walletBalance,
        percentage: analytics.revenueDistribution.percentages.wallet,
        color: '#10B981'
      },
      {
        name: 'Commission Paid',
        value: analytics.revenueDistribution.commissionPaid,
        percentage: analytics.revenueDistribution.percentages.commission,
        color: '#8B5CF6'
      }
    ];
  };

  // Export data
  const handleExport = () => {
    addToast({
      type: 'info',
      title: 'Export',
      message: 'Export functionality coming soon!'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Revenue Analytics</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Comprehensive revenue insights and analytics</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Period Selector */}
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value as 'all' | 'month' | 'quarter' | 'year')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm sm:text-base"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* Custom Date Range */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Custom Range</span>
                  {showDatePicker ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </button>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 min-w-80">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCustomDateRange}
                          className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setShowDatePicker(false);
                          }}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          Clear
          </button>
        </div>
      </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => {
                  const params: any = { period: selectedPeriod };
                  if (startDate) params.startDate = startDate;
                  if (endDate) params.endDate = endDate;
                  fetchAnalytics(() => apiService.getRevenueAnalytics(params));
                }}
                disabled={loading}
                className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mr-3" />
              <span className="text-gray-600">Loading revenue analytics...</span>
            </div>
          </div>
        )}

        {/* Revenue Analytics Content */}
        {!loading && analytics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Total Revenue */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                      {formatCurrency(analytics.summary.netRevenue)}
              </p>
            </div>
            <div className="bg-green-500 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
                  {analytics.summary.growthPercentage > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    analytics.summary.growthPercentage > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.summary.growthPercentage > 0 ? '+' : ''}{formatPercentage(analytics.summary.growthPercentage)}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">vs previous period</span>
          </div>
        </div>

              {/* Subscription Revenue */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
                    <p className="text-sm font-medium text-gray-600">Subscription Revenue</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                      {formatCurrency(analytics.summary.totalSubscriptionRevenue)}
              </p>
            </div>
            <div className="bg-blue-500 rounded-full p-3">
                    <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    {analytics.subscriptionAnalytics.totalSubscriptions} subscriptions
                  </p>
          </div>
        </div>

              {/* Wallet Balance */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
                    <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                      {formatCurrency(analytics.summary.totalWalletBalance)}
              </p>
            </div>
                  <div className="bg-green-500 rounded-full p-3">
                    <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    {analytics.walletAnalytics.vendorsWithBalance} vendors with balance
                  </p>
        </div>
      </div>

              {/* Commission Paid */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Commission Paid</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">
                      {formatCurrency(analytics.summary.totalCommissionPaid)}
                    </p>
                  </div>
                  <div className="bg-purple-500 rounded-full p-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    {analytics.commissionAnalytics.totalCommissions} commissions
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Distribution Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-sky-600" />
                Revenue Distribution
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart Visualization */}
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {getPieChartData().map((item, index) => {
                        const total = getPieChartData().reduce((sum, d) => sum + d.value, 0);
                        const percentage = (item.value / total) * 100;
                        const circumference = 2 * Math.PI * 40;
                        const strokeDasharray = (percentage / 100) * circumference;
                        const strokeDashoffset = circumference - strokeDasharray;
                        
                        let offset = 0;
                        for (let i = 0; i < index; i++) {
                          const prevItem = getPieChartData()[i];
                          const prevPercentage = (prevItem.value / total) * 100;
                          offset += (prevPercentage / 100) * circumference;
                        }
                        
                        return (
                          <circle
                            key={item.name}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={item.color}
                            strokeWidth="20"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className="transition-all duration-300"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm text-gray-500">Revenue</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-4">
                  {getPieChartData().map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                  <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                  ></div>
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(item.value)}</div>
                        <div className="text-sm text-gray-500">{formatPercentage(item.percentage)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subscription Analytics */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Subscription Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {analytics.subscriptionAnalytics.byPlan.map((plan) => (
                  <div key={plan._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 capitalize">{plan._id} Plan</h4>
                      <span className="text-sm text-gray-500">{plan.count} subscriptions</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Revenue:</span>
                        <span className="font-medium">{formatCurrency(plan.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Value:</span>
                        <span className="font-medium">{formatCurrency(plan.averageValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

            {/* Top Vendors by Wallet */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Vendors by Wallet Balance</h3>
                <button
                  onClick={() => setShowTopVendors(!showTopVendors)}
                  className="text-sky-600 hover:text-sky-700 text-sm font-medium"
                >
                  {showTopVendors ? 'Show Less' : 'Show More'}
                </button>
              </div>
              <div className="space-y-3">
                {analytics.walletAnalytics.topVendorsByWallet
                  .slice(0, showTopVendors ? undefined : 5)
                  .map((vendor, index) => (
                    <div key={vendor._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                          <span className="text-sky-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{vendor.name}</div>
                          <div className="text-sm text-gray-500">{vendor.vendorDetails.shopName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(vendor.vendorDetails.wallet.balance)}</div>
                        <div className="text-sm text-gray-500">Wallet Balance</div>
                      </div>
            </div>
                  ))}
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Trends</h3>
              <div className="space-y-4">
                {analytics.monthlyTrends.slice(0, 6).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {getMonthName(trend._id.month)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getMonthName(trend._id.month)} {trend._id.year}
                        </p>
                        <p className="text-sm text-gray-500">{trend.subscriptionCount} subscriptions</p>
                      </div>
              </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(trend.subscriptionRevenue)}</p>
                      <p className="text-sm text-gray-500">Revenue</p>
            </div>
          </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Revenue;