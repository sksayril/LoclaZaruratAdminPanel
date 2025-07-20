import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  Eye,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Settings,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { apiService } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';

interface Subscription {
  _id: string;
  vendor: {
    _id: string;
    name: string;
    email: string;
    vendorDetails: {
      shopName: string;
    };
  };
  plan: string;
  amount: number;
  status: 'active' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
  features: {
    maxProducts: number;
    maxImages: number;
    prioritySupport: boolean;
    featuredListing: boolean;
  };
  razorpay: {
    subscriptionId: string;
    paymentId: string;
    orderId: string;
  };
  createdAt: string;
}

interface SubscriptionStats {
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
}

interface ComprehensiveSubscriptionStats {
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
}

const SubscriptionUsers: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveSubscriptionStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTopVendors, setShowTopVendors] = useState(false);

  // Toast hook
  const { addToast } = useToast();

  // API hooks
  const { loading, error, execute: fetchSubscriptions } = useApi({
    onSuccess: (data) => {
      setSubscriptions(data.data || []);
      setFilteredSubscriptions(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load subscriptions. Please refresh the page.'
      });
    }
  });

  const { loading: statsLoading, execute: fetchStats } = useApi({
    onSuccess: (data) => {
      setStats(data.data);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Statistics Failed',
        message: error || 'Failed to load subscription statistics.'
      });
    }
  });

  const { loading: comprehensiveStatsLoading, execute: fetchComprehensiveStats } = useApi({
    onSuccess: (data) => {
      setComprehensiveStats(data.data);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Comprehensive Statistics Failed',
        message: error || 'Failed to load comprehensive subscription statistics.'
      });
    }
  });

  const { loading: initLoading, execute: initializePlans } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Plans Initialized',
        message: 'Razorpay plans have been initialized successfully.'
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Initialization Failed',
        message: error || 'Failed to initialize Razorpay plans.'
      });
    }
  });

  // Load data on component mount
  useEffect(() => {
    fetchSubscriptions(() => apiService.getSubscriptions(currentPage, 10, statusFilter));
    fetchStats(() => apiService.getSubscriptionStatistics());
    
    // Load comprehensive stats
    const params: any = { period: selectedPeriod };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    fetchComprehensiveStats(() => apiService.getComprehensiveSubscriptionStats(params));
  }, [currentPage, statusFilter, selectedPeriod, startDate, endDate]);

  // Filter subscriptions based on search
  useEffect(() => {
    let filtered = subscriptions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(subscription =>
        subscription.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.vendor.vendorDetails.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.plan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm]);

  // Handle status filter change
  const handleStatusFilterChange = (status: 'all' | 'active' | 'pending' | 'expired') => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Open subscription details modal
  const openSubscriptionModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedSubscription(null);
  };

  // Initialize Razorpay plans
  const [confirmingInit, setConfirmingInit] = useState(false);

  const handleInitializePlans = () => {
    if (!confirmingInit) {
      // First click - show warning
      setConfirmingInit(true);
      addToast({
        type: 'warning',
        title: 'Initialize Razorpay Plans',
        message: 'Are you sure you want to initialize Razorpay plans? This action cannot be undone. Click the button again to confirm.',
        duration: 8000, // 8 seconds to give user time to decide
      });
      
      // Reset confirmation state after 8 seconds
      setTimeout(() => {
        setConfirmingInit(false);
      }, 8000);
    } else {
      // Second click - proceed with initialization
      setConfirmingInit(false);
      initializePlans(() => apiService.initializeRazorpayPlans());
    }
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

  // Get month name
  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Export data
  const handleExport = () => {
    addToast({
      type: 'info',
      title: 'Export',
      message: 'Export functionality coming soon!'
    });
  };

  // Get status badge styles
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Subscription Users</h1>
          <p className="text-gray-600 mt-2">Manage vendor subscriptions and plans</p>
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
            onClick={handleInitializePlans}
            disabled={initLoading}
            className={`px-4 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-2 transition-colors ${
              confirmingInit 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>
              {initLoading 
                ? 'Initializing...' 
                : confirmingInit 
                  ? 'Click to Confirm' 
                  : 'Init Plans'
              }
            </span>
          </button>
          
          <button
            onClick={() => {
              fetchSubscriptions(() => apiService.getSubscriptions(currentPage, 10, statusFilter));
              fetchStats(() => apiService.getSubscriptionStatistics());
              const params: any = { period: selectedPeriod };
              if (startDate) params.startDate = startDate;
              if (endDate) params.endDate = endDate;
              fetchComprehensiveStats(() => apiService.getComprehensiveSubscriptionStats(params));
            }}
            disabled={loading || statsLoading || comprehensiveStatsLoading}
            className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || statsLoading || comprehensiveStatsLoading) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Subscriptions */}
          {/* <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div> */}

          {/* Active Subscriptions */}
          {/* <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div> */}

          {/* Pending Subscriptions */}
          {/* <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div> */}

          {/* Total Revenue */}
          {/* <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue?.total || 0)}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div> */}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-gray-500">Failed to load statistics</p>
            <button
              onClick={() => fetchStats(() => apiService.getSubscriptionStatistics())}
              className="mt-2 text-sky-600 hover:text-sky-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Statistics */}
      {comprehensiveStatsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comprehensiveStats ? (
        <>
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Subscriptions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{comprehensiveStats.summary.totalSubscriptions}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatPercentage(comprehensiveStats.growthMetrics.subscriptionGrowth)} growth
                  </p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Net Revenue */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(comprehensiveStats.summary.netRevenue)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatPercentage(comprehensiveStats.growthMetrics.revenueGrowth)} growth
                  </p>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-green-600">{comprehensiveStats.summary.activeSubscriptions}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatPercentage(comprehensiveStats.growthMetrics.activeGrowth)} growth
                  </p>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Average Amount */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Amount</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(comprehensiveStats.summary.averageAmount)}</p>
                  <p className="text-sm text-gray-500 mt-1">per subscription</p>
                </div>
                <div className="bg-purple-100 rounded-lg p-3">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution Flow Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-sky-600" />
              Subscription Status Flow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {comprehensiveStats.statusDistribution.map((status) => (
                <div key={status._id} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    {status._id === 'active' && <CheckCircle className="w-8 h-8 text-green-600" />}
                    {status._id === 'pending' && <Clock className="w-8 h-8 text-yellow-600" />}
                    {status._id === 'expired' && <XCircle className="w-8 h-8 text-red-600" />}
                    {status._id === 'cancelled' && <AlertCircle className="w-8 h-8 text-gray-600" />}
                  </div>
                  <h4 className="font-semibold text-gray-900 capitalize mb-1">{status._id}</h4>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{status.count}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(status.totalAmount)}</p>
                  <p className="text-xs text-gray-500">Avg: {formatCurrency(status.averageAmount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Distribution Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-sky-600" />
              Plan Distribution
            </h3>
            <div className="space-y-4">
              {comprehensiveStats.planDistribution.map((plan) => {
                const totalCount = plan.activeCount + plan.pendingCount + plan.expiredCount + plan.cancelledCount;
                const activePercentage = (plan.activeCount / totalCount) * 100;
                const pendingPercentage = (plan.pendingCount / totalCount) * 100;
                const expiredPercentage = (plan.expiredCount / totalCount) * 100;
                const cancelledPercentage = (plan.cancelledCount / totalCount) * 100;

                return (
                  <div key={plan._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 capitalize">{plan._id} Plan</h4>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{plan.count} total</p>
                        <p className="text-sm text-gray-600">{formatCurrency(plan.totalAmount)}</p>
                      </div>
                    </div>
                    
                    {/* Status Bar Chart */}
                    <div className="flex h-8 bg-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="bg-green-500 h-full transition-all duration-300"
                        style={{ width: `${activePercentage}%` }}
                        title={`Active: ${plan.activeCount}`}
                      ></div>
                      <div 
                        className="bg-yellow-500 h-full transition-all duration-300"
                        style={{ width: `${pendingPercentage}%` }}
                        title={`Pending: ${plan.pendingCount}`}
                      ></div>
                      <div 
                        className="bg-red-500 h-full transition-all duration-300"
                        style={{ width: `${expiredPercentage}%` }}
                        title={`Expired: ${plan.expiredCount}`}
                      ></div>
                      <div 
                        className="bg-gray-500 h-full transition-all duration-300"
                        style={{ width: `${cancelledPercentage}%` }}
                        title={`Cancelled: ${plan.cancelledCount}`}
                      ></div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                        <span>Active: {plan.activeCount}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                        <span>Pending: {plan.pendingCount}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                        <span>Expired: {plan.expiredCount}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-500 rounded mr-1"></div>
                        <span>Cancelled: {plan.cancelledCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-sky-600" />
                Top Vendors by Subscriptions
              </h3>
              <button
                onClick={() => setShowTopVendors(!showTopVendors)}
                className="text-sky-600 hover:text-sky-700 text-sm font-medium"
              >
                {showTopVendors ? 'Show Less' : 'Show More'}
              </button>
            </div>
            <div className="space-y-3">
              {comprehensiveStats.topVendors
                .slice(0, showTopVendors ? undefined : 5)
                .map((vendor, index) => (
                  <div key={vendor.vendor._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                        <span className="text-sky-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{vendor.vendor.name}</div>
                        <div className="text-sm text-gray-500">{vendor.vendor.vendorDetails.shopName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{vendor.totalSubscriptions} subscriptions</div>
                      <div className="text-sm text-gray-500">{formatCurrency(vendor.totalAmount)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Monthly Trends</h3>
            <div className="space-y-4">
              {comprehensiveStats.monthlyTrends.slice(0, 6).map((trend, index) => (
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
                      <p className="text-sm text-gray-500">{trend.count} subscriptions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(trend.totalAmount)}</p>
                    <p className="text-sm text-gray-500">{trend.activeCount} active</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Revenue Comparison */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Revenue</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold text-green-600">{formatCurrency(stats.revenue?.thisMonth || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Month</span>
                <span className="font-semibold text-gray-800">{formatCurrency(stats.revenue?.lastMonth || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Growth</span>
                <div className="flex items-center space-x-1">
                  {(stats.revenue?.thisMonth || 0) > (stats.revenue?.lastMonth || 0) ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    (stats.revenue?.thisMonth || 0) > (stats.revenue?.lastMonth || 0) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.revenue?.lastMonth ? 
                      (((stats.revenue.thisMonth || 0) - (stats.revenue.lastMonth || 0)) / (stats.revenue.lastMonth || 1) * 100).toFixed(1) : 
                      '0.0'
                    }%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Plan Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">3 Months</span>
                <span className="font-semibold text-blue-600">{stats.byPlan?.['3months'] || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">6 Months</span>
                <span className="font-semibold text-green-600">{stats.byPlan?.['6months'] || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">1 Year</span>
                <span className="font-semibold text-purple-600">{stats.byPlan?.['1year'] || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'pending' | 'expired')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Showing {filteredSubscriptions.length} of {stats?.total || 0} subscriptions
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Subscriptions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'No subscriptions have been created yet'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.vendor.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscription.vendor.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {subscription.vendor.vendorDetails.shopName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {subscription.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(subscription.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(subscription.status)}`}>
                        {getStatusIcon(subscription.status)}
                        <span className="ml-1">{subscription.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>Start: {formatDate(subscription.startDate)}</div>
                        <div>End: {formatDate(subscription.endDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openSubscriptionModal(subscription)}
                        className="text-sky-600 hover:text-sky-900 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {showModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Subscription Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Vendor Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Vendor Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedSubscription.vendor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedSubscription.vendor.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shop Name:</span>
                      <span className="font-medium">{selectedSubscription.vendor.vendorDetails.shopName}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Subscription Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{selectedSubscription.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedSubscription.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(selectedSubscription.status)}`}>
                        {getStatusIcon(selectedSubscription.status)}
                        <span className="ml-1">{selectedSubscription.status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{formatDate(selectedSubscription.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{formatDate(selectedSubscription.endDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Features</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Products:</span>
                      <span className="font-medium">{selectedSubscription.features.maxProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Images:</span>
                      <span className="font-medium">{selectedSubscription.features.maxImages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority Support:</span>
                      <span className="font-medium">
                        {selectedSubscription.features.prioritySupport ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Featured Listing:</span>
                      <span className="font-medium">
                        {selectedSubscription.features.featuredListing ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subscription ID:</span>
                      <span className="font-medium text-sm">{selectedSubscription.razorpay.subscriptionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-medium text-sm">{selectedSubscription.razorpay.paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium text-sm">{selectedSubscription.razorpay.orderId}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionUsers; 