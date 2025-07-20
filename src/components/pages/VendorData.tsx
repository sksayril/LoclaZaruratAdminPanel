import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Store,
  Star,
  Wallet,
  Calendar,
  Shield,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Filter,
  X,
  Download,
  RefreshCw,
  Percent,
  DollarSign,
  Settings
} from 'lucide-react';
import { apiService } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';

const statusOptions = [
  { value: 'all', label: 'All Status', icon: Users },
  { value: 'active', label: 'Active', icon: CheckCircle },
  { value: 'inactive', label: 'Inactive', icon: XCircle },
];

const kycOptions = [
  { value: 'all', label: 'All KYC', icon: Shield },
  { value: 'verified', label: 'Verified', icon: CheckCircle },
  { value: 'pending', label: 'Pending', icon: Clock },
];

const VendorData: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState('all');
  const [kyc, setKyc] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [commissionNotes, setCommissionNotes] = useState('');
  const { addToast } = useToast();

  const { loading, error, execute: fetchVendors } = useApi({
    onSuccess: (data) => {
      setVendors(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    },
    onError: (error) => {
      addToast({ type: 'error', title: 'Load Failed', message: error || 'Failed to load vendors.' });
    }
  });

  const { loading: statusLoading, execute: updateStatus } = useApi({
    onSuccess: () => {
      addToast({ type: 'success', title: 'Status Updated', message: 'Vendor status updated successfully.' });
      fetchVendors(() => apiService.getVendors(currentPage, 10, status, kyc, search, pincode || undefined));
    },
    onError: (error) => {
      addToast({ type: 'error', title: 'Update Failed', message: error || 'Failed to update status.' });
    }
  });

  const { loading: commissionLoading, execute: fetchCommission } = useApi({
    onSuccess: (data) => {
      setCommissionData(data.data);
      setCommissionPercentage(data.data.commissionSettings?.commissionPercentage?.toString() || '');
      setCommissionNotes(data.data.commissionSettings?.notes || '');
    },
    onError: (error) => {
      addToast({ type: 'error', title: 'Commission Load Failed', message: error || 'Failed to load commission data.' });
    }
  });

  const { loading: setCommissionLoading, execute: setCommission } = useApi({
    onSuccess: (data) => {
      addToast({ type: 'success', title: 'Commission Updated', message: data.message || 'Commission updated successfully.' });
      setShowCommissionModal(false);
      // Refresh commission data
      if (selectedVendor) {
        fetchCommission(() => apiService.getVendorCommission(selectedVendor._id));
      }
    },
    onError: (error) => {
      addToast({ type: 'error', title: 'Commission Update Failed', message: error || 'Failed to update commission.' });
    }
  });

  useEffect(() => {
    fetchVendors(() => apiService.getVendors(currentPage, 10, status, kyc, search, pincode || undefined));
  }, [currentPage, status, kyc, search, pincode]);

  const handleStatusChange = (vendor: any, isActive: boolean) => {
    const reason = !isActive ? window.prompt('Reason for deactivation?') : undefined;
    updateStatus(() => apiService.updateVendorStatus(vendor._id, isActive, reason || undefined));
  };

  const openVendorModal = (vendor: any) => {
    setSelectedVendor(vendor);
    setShowModal(true);
    // Load commission data when opening vendor modal
    fetchCommission(() => apiService.getVendorCommission(vendor._id));
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVendor(null);
    setCommissionData(null);
    setCommissionPercentage('');
    setCommissionNotes('');
  };

  const openCommissionModal = () => {
    setShowCommissionModal(true);
  };

  const closeCommissionModal = () => {
    setShowCommissionModal(false);
    setCommissionPercentage('');
    setCommissionNotes('');
  };

  const handleSetCommission = () => {
    const percentage = parseFloat(commissionPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      addToast({ type: 'error', title: 'Invalid Percentage', message: 'Please enter a valid percentage between 0 and 100.' });
      return;
    }
    
    setCommission(() => apiService.setVendorCommission(selectedVendor._id, {
      commissionPercentage: percentage,
      notes: commissionNotes
    }));
  };

  const clearFilters = () => {
    setSearch('');
    setPincode('');
    setStatus('all');
    setKyc('all');
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getKycIcon = (kyc: string) => {
    switch (kyc) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendor Management</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage all vendor accounts, statuses, and KYC verification</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button
                onClick={() => fetchVendors(() => apiService.getVendors(currentPage, 10, status, kyc, search, pincode || undefined))}
                disabled={loading}
                className="flex items-center justify-center px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
        </button>
            </div>
          </div>
      </div>

                {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-sm sm:text-base"
              />
            </div>

            {/* Pincode Search */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by pincode..."
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-sm sm:text-base"
              />
          </div>

            {/* Status Filter */}
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)} 
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-sm sm:text-base"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* KYC Filter */}
            <select 
              value={kyc} 
              onChange={e => setKyc(e.target.value)} 
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-sm sm:text-base"
            >
              {kycOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(search || pincode || status !== 'all' || kyc !== 'all') && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {search && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-sky-100 text-sky-700 text-xs">
                    Search: {search}
                  </span>
                )}
                {pincode && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                    Pincode: {pincode}
                  </span>
                )}
                {status !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                    Status: {statusOptions.find(opt => opt.value === status)?.label}
                  </span>
                )}
                {kyc !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs">
                    KYC: {kycOptions.find(opt => opt.value === kyc)?.label}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center self-start sm:self-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
        </div>
      </div>
        )}

        {/* Vendors Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Vendor Info
                </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Shop Details
                </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    KYC
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mr-2" />
                        <span className="text-gray-500">Loading vendors...</span>
                      </div>
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-gray-300 mb-4" />
                        <span className="text-gray-500 text-lg">No vendors found</span>
                        <span className="text-gray-400 text-sm">Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : vendors.map(vendor => (
                  <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                          {vendor.profileImage ? (
                            <img
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-gray-200"
                              src={vendor.profileImage}
                              alt={vendor.name}
                            />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-semibold text-base sm:text-lg">
                                {vendor.name?.charAt(0)?.toUpperCase()}
                          </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{vendor.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">ID: {vendor._id}</div>
                          <div className="text-xs text-gray-400">
                            Joined {new Date(vendor.createdAt).toLocaleDateString()}
                          </div>
                          {/* Mobile Contact Info */}
                          <div className="sm:hidden mt-1 space-y-1">
                            <div className="flex items-center text-xs text-gray-600">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="truncate">{vendor.email}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="truncate">{vendor.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{vendor.phone}</span>
                        </div>
                        {vendor.address?.pincode && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {vendor.address.pincode}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Store className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{vendor.vendorDetails?.shopName || 'No shop name'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="w-4 h-4 mr-2 text-gray-400" />
                          {vendor.vendorDetails?.averageRating || 0} ({vendor.vendorDetails?.totalRatings || 0} ratings)
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Wallet className="w-4 h-4 mr-2 text-gray-400" />
                          ₹{vendor.vendorDetails?.wallet?.balance || 0}
                    </div>
                    </div>
                  </td>
                    <td className="px-3 sm:px-6 py-4">
                      {vendor.isActive ? (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Active</span>
                          <span className="sm:hidden">✓</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs sm:text-sm font-medium">
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Inactive</span>
                          <span className="sm:hidden">✗</span>
                        </span>
                      )}
                  </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-4">
                      {vendor.vendorDetails?.kyc?.isVerified ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                          <Clock className="w-4 h-4 mr-1" />
                          Pending
                    </span>
                      )}
                  </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => openVendorModal(vendor)}
                          className="p-1.5 sm:p-2 text-sky-600 hover:text-sky-900 hover:bg-sky-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {vendor.isActive ? (
                          <button
                            disabled={statusLoading}
                            onClick={() => handleStatusChange(vendor, false)}
                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Deactivate"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            disabled={statusLoading}
                            onClick={() => handleStatusChange(vendor, true)}
                            className="p-1.5 sm:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Activate"
                          >
                            <UserCheck className="w-4 h-4" />
                    </button>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                <span className="text-sm text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="text-sm text-gray-500 text-center sm:text-right">
                Showing {vendors.length} vendors
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Vendor Details Modal */}
        {showModal && selectedVendor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    {selectedVendor.profileImage ? (
                      <img
                        src={selectedVendor.profileImage}
                        alt="Profile"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 font-semibold text-base sm:text-lg">
                          {selectedVendor.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedVendor.name}</h2>
                      <p className="text-gray-600 text-sm sm:text-base truncate">{selectedVendor.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl p-3 sm:p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sky-100 text-xs sm:text-sm">Rating</p>
                        <p className="text-lg sm:text-2xl font-bold">{selectedVendor.vendorDetails?.averageRating || 0}</p>
                      </div>
                      <Star className="w-6 h-6 sm:w-8 sm:h-8 text-sky-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 sm:p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs sm:text-sm">Wallet</p>
                        <p className="text-lg sm:text-2xl font-bold">₹{selectedVendor.vendorDetails?.wallet?.balance || 0}</p>
                      </div>
                      <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-green-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-3 sm:p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs sm:text-sm">Ratings</p>
                        <p className="text-lg sm:text-2xl font-bold">{selectedVendor.vendorDetails?.totalRatings || 0}</p>
                      </div>
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3 sm:p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-xs sm:text-sm">Status</p>
                        <p className="text-lg sm:text-2xl font-bold">{selectedVendor.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                      {selectedVendor.isActive ? (
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-200" />
                      ) : (
                        <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-200" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <UserCheck className="w-5 h-5 mr-2 text-sky-600" />
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{selectedVendor.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{selectedVendor.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{selectedVendor.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Role:</span>
                          <span className="font-medium capitalize">{selectedVendor.role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email Verified:</span>
                          <span className={`font-medium ${selectedVendor.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedVendor.isEmailVerified ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone Verified:</span>
                          <span className={`font-medium ${selectedVendor.isPhoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedVendor.isPhoneVerified ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    {selectedVendor.address && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <MapPin className="w-5 h-5 mr-2 text-sky-600" />
                          Address Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Street:</span>
                            <span className="font-medium">{selectedVendor.address.street || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">City:</span>
                            <span className="font-medium">{selectedVendor.address.city || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">State:</span>
                            <span className="font-medium">{selectedVendor.address.state || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pincode:</span>
                            <span className="font-medium">{selectedVendor.address.pincode || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Country:</span>
                            <span className="font-medium">{selectedVendor.address.country || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shop Details */}
                    {selectedVendor.vendorDetails && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Store className="w-5 h-5 mr-2 text-sky-600" />
                          Shop Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shop Name:</span>
                            <span className="font-medium">{selectedVendor.vendorDetails.shopName || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">GST Number:</span>
                            <span className="font-medium">{selectedVendor.vendorDetails.gstNumber || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shop Listed:</span>
                            <span className={`font-medium ${selectedVendor.vendorDetails.isShopListed ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedVendor.vendorDetails.isShopListed ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Referral Code:</span>
                            <span className="font-medium">{selectedVendor.vendorDetails.referralCode || '-'}</span>
                          </div>
                        </div>

                        {/* Shop Images */}
                        {selectedVendor.vendorDetails.shopImages?.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Shop Images</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedVendor.vendorDetails.shopImages.map((img: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt="Shop"
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vendor Address */}
                        {selectedVendor.vendorDetails.vendorAddress && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Shop Address</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Door No:</span>
                                <span className="font-medium">{selectedVendor.vendorDetails.vendorAddress.doorNumber || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Street:</span>
                                <span className="font-medium">{selectedVendor.vendorDetails.vendorAddress.street || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                <span className="font-medium">{selectedVendor.vendorDetails.vendorAddress.location || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">City:</span>
                                <span className="font-medium">{selectedVendor.vendorDetails.vendorAddress.city || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">State:</span>
                                <span className="font-medium">{selectedVendor.vendorDetails.vendorAddress.state || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Pincode:</span>
                                <span className="font-medium">{selectedVendor.vendorDetails.vendorAddress.pincode || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Country:</span>
                                <span className="font-medium">{selectedVendor.vendorDetails.vendorAddress.country || '-'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Subscription Information */}
                    {selectedVendor.vendorDetails?.subscription && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-sky-600" />
                          Subscription Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                              selectedVendor.vendorDetails.subscription.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedVendor.vendorDetails.subscription.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Products:</span>
                            <span className="font-medium">{selectedVendor.vendorDetails.subscription.features?.maxProducts || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Images:</span>
                            <span className="font-medium">{selectedVendor.vendorDetails.subscription.features?.maxImages || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Priority Support:</span>
                            <span className={`font-medium ${selectedVendor.vendorDetails.subscription.features?.prioritySupport ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedVendor.vendorDetails.subscription.features?.prioritySupport ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Featured Listing:</span>
                            <span className={`font-medium ${selectedVendor.vendorDetails.subscription.features?.featuredListing ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedVendor.vendorDetails.subscription.features?.featuredListing ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* KYC Information */}
                    {selectedVendor.vendorDetails?.kyc && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-sky-600" />
                          KYC Verification
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verified:</span>
                            <span className={`font-medium ${selectedVendor.vendorDetails.kyc.isVerified ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedVendor.vendorDetails.kyc.isVerified ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wallet Information */}
                    {selectedVendor.vendorDetails?.wallet && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Wallet className="w-5 h-5 mr-2 text-sky-600" />
                          Wallet Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Balance:</span>
                            <span className="font-medium text-lg text-green-600">₹{selectedVendor.vendorDetails.wallet.balance || 0}</span>
                          </div>
                          {selectedVendor.vendorDetails.wallet.transactions?.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Transactions</h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedVendor.vendorDetails.wallet.transactions.slice(0, 5).map((txn: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{txn.type}</span>
                                    <span className="font-medium">₹{txn.amount}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ratings Information */}
                    {selectedVendor.vendorDetails && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Star className="w-5 h-5 mr-2 text-sky-600" />
                          Ratings & Reviews
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average Rating:</span>
                            <span className="font-medium text-lg">{selectedVendor.vendorDetails.averageRating || 0} ⭐</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Ratings:</span>
                            <span className="font-medium">{selectedVendor.vendorDetails.totalRatings || 0}</span>
                          </div>
                          {selectedVendor.vendorDetails.ratingDistribution && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Rating Distribution</h4>
                              <div className="space-y-2">
                                {Object.entries(selectedVendor.vendorDetails.ratingDistribution).map(([star, count]: any) => (
                                  <div key={star} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{star} ⭐</span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-yellow-400 h-2 rounded-full"
                                          style={{ width: `${(count / selectedVendor.vendorDetails.totalRatings) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium">{count}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Commission Information */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Percent className="w-5 h-5 mr-2 text-sky-600" />
                          Commission Settings
                        </h3>
                        <button
                          onClick={openCommissionModal}
                          className="flex items-center px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Manage
                        </button>
                      </div>
                      
                      {commissionLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin mr-2" />
                          <span className="text-gray-500">Loading commission data...</span>
                        </div>
                      ) : commissionData ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Commission Percentage:</span>
                            <span className="font-medium text-lg text-green-600">
                              {commissionData.commissionSettings?.commissionPercentage || 0}%
                            </span>
                          </div>
                          
                          {commissionData.commissionSettings?.isCustomCommission && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Custom Commission:</span>
                              <span className="font-medium text-green-600">Yes</span>
                            </div>
                          )}
                          
                          {commissionData.commissionSettings?.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm font-medium text-blue-800 mb-1">Notes:</div>
                              <div className="text-sm text-blue-700">{commissionData.commissionSettings.notes}</div>
                            </div>
                          )}
                          
                          {/* Commission Statistics */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Commission Statistics</h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{commissionData.statistics?.totalCommissions || 0}</div>
                                <div className="text-xs text-gray-500">Total</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">₹{commissionData.statistics?.totalAmount || 0}</div>
                                <div className="text-xs text-gray-500">Amount</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{commissionData.statistics?.averageCommission || 0}%</div>
                                <div className="text-xs text-gray-500">Average</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Recent Commissions */}
                          {commissionData.recentCommissions?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Commissions</h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {commissionData.recentCommissions.slice(0, 3).map((commission: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white rounded border">
                                    <div>
                                      <div className="font-medium">{commission.referredVendor?.vendorDetails?.shopName || commission.referredVendor?.name}</div>
                                      <div className="text-xs text-gray-500">{new Date(commission.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium text-green-600">₹{commission.commission.amount}</div>
                                      <div className="text-xs text-gray-500">{commission.commission.percentage}%</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <span className="text-gray-500">No commission data available</span>
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-sky-600" />
                        Timestamps
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created At:</span>
                          <span className="font-medium text-sm">{selectedVendor.createdAt ? new Date(selectedVendor.createdAt).toLocaleString() : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Updated At:</span>
                          <span className="font-medium text-sm">{selectedVendor.updatedAt ? new Date(selectedVendor.updatedAt).toLocaleString() : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Login:</span>
                          <span className="font-medium text-sm">{selectedVendor.lastLogin ? new Date(selectedVendor.lastLogin).toLocaleString() : '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Add export functionality here
                      addToast({ type: 'info', title: 'Export', message: 'Export functionality coming soon!' });
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Management Modal */}
        {showCommissionModal && selectedVendor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Percent className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Set Commission</h2>
                      <p className="text-gray-600 text-sm truncate">{selectedVendor.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeCommissionModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Current Commission Display */}
                {commissionData && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Current Commission</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Percentage:</span>
                      <span className="text-lg font-bold text-green-600">
                        {commissionData.commissionSettings?.commissionPercentage || 0}%
                      </span>
                    </div>
                    {commissionData.commissionSettings?.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {commissionData.commissionSettings.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Commission Form */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="commissionPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="commissionPercentage"
                        value={commissionPercentage}
                        onChange={(e) => setCommissionPercentage(e.target.value)}
                        min="0"
                        max="100"
                        step="0.1"
                        className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                        placeholder="Enter percentage (0-100)"
                      />
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter a value between 0 and 100</p>
                  </div>

                  <div>
                    <label htmlFor="commissionNotes" className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="commissionNotes"
                      value={commissionNotes}
                      onChange={(e) => setCommissionNotes(e.target.value)}
                      rows={3}
                      className="px-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors resize-none"
                      placeholder="Add notes about this commission setting..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeCommissionModal}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetCommission}
                    disabled={setCommissionLoading || !commissionPercentage}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
                  >
                    {setCommissionLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Set Commission
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorData;