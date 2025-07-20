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
  Download,
  Wallet,
  Banknote,
  Smartphone,
  Building,
  FileText,
  Check,
  X,
  Info
} from 'lucide-react';
import { apiService } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';

interface WithdrawalRequest {
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
}

interface WithdrawalSummary {
  pending: { count: number; amount: number };
  approved: { count: number; amount: number };
  rejected: { count: number; amount: number };
}

interface WithdrawalTotals {
  totalRequests: number;
  totalAmount: number;
}

const WithdrawalRequests: React.FC = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WithdrawalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'upi' | 'bank'>('all');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null);
  const [totals, setTotals] = useState<WithdrawalTotals | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Toast hook
  const { addToast } = useToast();

  // API hooks
  const { loading: requestsLoading, error, execute: fetchWithdrawalRequests } = useApi({
    onSuccess: (data) => {
      setWithdrawalRequests(data.data.withdrawalRequests || []);
      setFilteredRequests(data.data.withdrawalRequests || []);
      setSummary(data.data.summary);
      setTotals(data.data.totals);
      setTotalPages(data.pagination?.totalPages || 1);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load withdrawal requests. Please refresh the page.'
      });
    }
  });

  const { loading: processLoading, execute: processRequest } = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        title: 'Request Processed',
        message: data.message || `Withdrawal request ${processAction}d successfully.`
      });
      setShowProcessModal(false);
      setProcessingRequest(null);
      setAdminNotes('');
      setTransactionId('');
      // Refresh the list
      fetchWithdrawalRequests(() => apiService.getWithdrawalRequests(currentPage, 10, statusFilter, paymentMethodFilter));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Processing Failed',
        message: error || `Failed to ${processAction} withdrawal request.`
      });
      setProcessingRequest(null);
    }
  });

  // Load data on component mount
  useEffect(() => {
    fetchWithdrawalRequests(() => apiService.getWithdrawalRequests(currentPage, 10, statusFilter, paymentMethodFilter));
  }, [currentPage, statusFilter, paymentMethodFilter]);

  // Filter requests based on search
  useEffect(() => {
    let filtered = withdrawalRequests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.vendorDetails.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.withdrawalRequest.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [withdrawalRequests, searchTerm]);

  // Handle status filter change
  const handleStatusFilterChange = (status: 'all' | 'pending' | 'approved' | 'rejected') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle payment method filter change
  const handlePaymentMethodFilterChange = (method: 'all' | 'upi' | 'bank') => {
    setPaymentMethodFilter(method);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Open withdrawal request details modal
  const openRequestModal = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Open process modal
  const openProcessModal = (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setProcessAction(action);
    setProcessingRequest(request.withdrawalRequest._id);
    setShowProcessModal(true);
  };

  // Close process modal
  const closeProcessModal = () => {
    setShowProcessModal(false);
    setSelectedRequest(null);
    setProcessingRequest(null);
    setAdminNotes('');
    setTransactionId('');
  };

  // Process withdrawal request
  const handleProcessRequest = () => {
    if (!selectedRequest) return;

    const requestBody: any = {
      vendorId: selectedRequest._id,
      requestId: selectedRequest.withdrawalRequest._id,
      status: processAction === 'approve' ? 'approved' : 'rejected',
    };

    if (adminNotes) {
      requestBody.adminNotes = adminNotes;
    }

    if (processAction === 'approve' && transactionId) {
      requestBody.transactionId = transactionId;
    }

    processRequest(() => apiService.processWithdrawalRequest(
      requestBody.vendorId,
      requestBody.requestId,
      requestBody.status,
      requestBody.adminNotes,
      requestBody.transactionId
    ));
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge styles
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'upi':
        return <Smartphone className="w-4 h-4" />;
      case 'bank':
        return <Building className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Withdrawal Requests</h1>
          <p className="text-gray-600 mt-2">Manage vendor withdrawal requests and payments</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => {
              fetchWithdrawalRequests(() => apiService.getWithdrawalRequests(currentPage, 10, statusFilter, paymentMethodFilter));
            }}
            disabled={requestsLoading}
            className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${requestsLoading ? 'animate-spin' : ''}`} />
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
      {requestsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{totals?.totalRequests || 0}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(totals?.totalAmount || 0)}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pending.count}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(summary.pending.amount)}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Approved Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{summary.approved.count}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(summary.approved.amount)}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Rejected Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{summary.rejected.count}</p>
                <p className="text-sm text-gray-500 mt-1">{formatCurrency(summary.rejected.amount)}</p>
              </div>
              <div className="bg-red-100 rounded-lg p-3">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => handlePaymentMethodFilterChange(e.target.value as 'all' | 'upi' | 'bank')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Payment Methods</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Showing {filteredRequests.length} of {totals?.totalRequests || 0} requests
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Withdrawal Requests Table */}
      {requestsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawal requests found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' || paymentMethodFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No withdrawal requests have been submitted yet'
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
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {request.vendorDetails.shopName}
                        </div>
                        <div className="text-xs text-gray-400">
                          Wallet: {formatCurrency(request.vendorDetails.wallet.balance)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">{formatCurrency(request.withdrawalRequest.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(request.withdrawalRequest.paymentMethod)}
                        <span className="text-sm text-gray-900 capitalize">
                          {request.withdrawalRequest.paymentMethod}
                        </span>
                      </div>
                      {request.withdrawalRequest.paymentMethod === 'upi' && request.withdrawalRequest.upiId && (
                        <div className="text-xs text-gray-500 mt-1">
                          {request.withdrawalRequest.upiId}
                        </div>
                      )}
                      {request.withdrawalRequest.paymentMethod === 'bank' && request.withdrawalRequest.bankDetails && (
                        <div className="text-xs text-gray-500 mt-1">
                          {request.withdrawalRequest.bankDetails.bankName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(request.withdrawalRequest.status)}`}>
                        {getStatusIcon(request.withdrawalRequest.status)}
                        <span className="ml-1 capitalize">{request.withdrawalRequest.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.withdrawalRequest.requestDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openRequestModal(request)}
                          className="text-sky-600 hover:text-sky-900 flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        
                        {request.withdrawalRequest.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openProcessModal(request, 'approve')}
                              disabled={processingRequest === request.withdrawalRequest._id}
                              className="text-green-600 hover:text-green-900 flex items-center space-x-1 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => openProcessModal(request, 'reject')}
                              disabled={processingRequest === request.withdrawalRequest._id}
                              className="text-red-600 hover:text-red-900 flex items-center space-x-1 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
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

      {/* Withdrawal Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Withdrawal Request Details</h2>
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
                      <span className="font-medium">{selectedRequest.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedRequest.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shop Name:</span>
                      <span className="font-medium">{selectedRequest.vendorDetails.shopName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wallet Balance:</span>
                      <span className="font-medium">{formatCurrency(selectedRequest.vendorDetails.wallet.balance)}</span>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Request Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Withdrawal Request Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedRequest.withdrawalRequest.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">{selectedRequest.withdrawalRequest.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(selectedRequest.withdrawalRequest.status)}`}>
                        {getStatusIcon(selectedRequest.withdrawalRequest.status)}
                        <span className="ml-1 capitalize">{selectedRequest.withdrawalRequest.status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request Date:</span>
                      <span className="font-medium">{formatDate(selectedRequest.withdrawalRequest.requestDate)}</span>
                    </div>
                    {selectedRequest.withdrawalRequest.processedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processed Date:</span>
                        <span className="font-medium">{formatDate(selectedRequest.withdrawalRequest.processedDate)}</span>
                      </div>
                    )}
                    {selectedRequest.withdrawalRequest.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-medium text-sm">{selectedRequest.withdrawalRequest.transactionId}</span>
                      </div>
                    )}
                    {selectedRequest.withdrawalRequest.adminNotes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Admin Notes:</span>
                        <span className="font-medium">{selectedRequest.withdrawalRequest.adminNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {selectedRequest.withdrawalRequest.paymentMethod === 'upi' && selectedRequest.withdrawalRequest.upiId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">UPI ID:</span>
                        <span className="font-medium">{selectedRequest.withdrawalRequest.upiId}</span>
                      </div>
                    )}
                    {selectedRequest.withdrawalRequest.paymentMethod === 'bank' && selectedRequest.withdrawalRequest.bankDetails && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank Name:</span>
                          <span className="font-medium">{selectedRequest.withdrawalRequest.bankDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Holder:</span>
                          <span className="font-medium">{selectedRequest.withdrawalRequest.bankDetails.accountHolderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Number:</span>
                          <span className="font-medium">{selectedRequest.withdrawalRequest.bankDetails.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">IFSC Code:</span>
                          <span className="font-medium">{selectedRequest.withdrawalRequest.bankDetails.ifscCode}</span>
                        </div>
                      </>
                    )}
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

      {/* Process Withdrawal Request Modal */}
      {showProcessModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {processAction === 'approve' ? 'Approve' : 'Reject'} Withdrawal Request
                </h2>
                <button
                  onClick={closeProcessModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Vendor: {selectedRequest.name}</div>
                  <div className="text-sm text-gray-600 mb-2">Amount: {formatCurrency(selectedRequest.withdrawalRequest.amount)}</div>
                  <div className="text-sm text-gray-600">Payment Method: {selectedRequest.withdrawalRequest.paymentMethod.toUpperCase()}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes {processAction === 'reject' && '*'}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder={processAction === 'approve' ? 'Optional notes about the approval...' : 'Reason for rejection...'}
                    required={processAction === 'reject'}
                  />
                </div>

                {processAction === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Enter transaction ID..."
                    />
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={closeProcessModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessRequest}
                    disabled={processLoading || (processAction === 'reject' && !adminNotes.trim())}
                    className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center space-x-2 ${
                      processAction === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {processLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : processAction === 'approve' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span>
                      {processLoading 
                        ? 'Processing...' 
                        : processAction === 'approve' 
                          ? 'Approve Request' 
                          : 'Reject Request'
                      }
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequests; 