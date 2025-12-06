import React, { useState, useEffect } from 'react';
import { 
  UserCog, 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Key,
  UserX,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react';
import { apiService, SuperEmployee, CreateSuperEmployeeRequest, District, EmployeeCommission } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';
import ConfirmModal from '../ConfirmModal';

const SuperEmployeeManagement: React.FC = () => {
  // State management
  const [employees, setEmployees] = useState<SuperEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<SuperEmployee[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [commissions, setCommissions] = useState<EmployeeCommission[]>([]);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_employee' | 'employee'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modals and forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<SuperEmployee | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<CreateSuperEmployeeRequest>({
    name: '',
    email: '',
    phone: '',
    password: '',
    assignedDistricts: [],
    commissionPercentage: 10
  });
  
  const [commissionForm, setCommissionForm] = useState({
    employeeId: '',
    commissionPercentage: 10
  });
  
  const [districtForm, setDistrictForm] = useState({
    name: '',
    state: '',
    coordinates: {
      latitude: 0,
      longitude: 0
    }
  });
  
  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    employeeId: string | null;
    employeeName: string;
  }>({
    isOpen: false,
    employeeId: null,
    employeeName: ''
  });

  // Toast hook
  const { addToast } = useToast();

  // API hooks
  const { loading, error, execute: fetchEmployees } = useApi({
    onSuccess: (data) => {
      setEmployees(data.data || []);
      setFilteredEmployees(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to fetch employees: ${error.message}`
      });
    }
  });

  const { loading: loadingDistricts, execute: fetchDistricts } = useApi({
    onSuccess: (data) => {
      setDistricts(data.data || []);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to fetch districts: ${error.message}`
      });
    }
  });

  const { loading: loadingCommissions, execute: fetchCommissions } = useApi({
    onSuccess: (data) => {
      setCommissions(data.data?.commissions || []);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to fetch commissions: ${error.message}`
      });
    }
  });

  const { loading: creating, execute: createEmployee } = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        message: 'Super employee created successfully!'
      });
      setShowCreateModal(false);
      resetForm();
      loadEmployees();
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to create employee: ${error.message}`
      });
    }
  });

  const { loading: updating, execute: updateEmployee } = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        message: 'Employee updated successfully!'
      });
      setShowEditModal(false);
      setSelectedEmployee(null);
      loadEmployees();
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to update employee: ${error.message}`
      });
    }
  });

  const { loading: deleting, execute: deleteEmployee } = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        message: 'Employee deleted successfully!'
      });
      setDeleteModal({ isOpen: false, employeeId: null, employeeName: '' });
      loadEmployees();
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to delete employee: ${error.message}`
      });
    }
  });

  const { loading: updatingStatus, execute: updateEmployeeStatus } = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        message: `Employee ${data.data.isActive ? 'activated' : 'deactivated'} successfully!`
      });
      loadEmployees();
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to update employee status: ${error.message}`
      });
    }
  });

  const { loading: settingCommission, execute: setCommission } = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        message: 'Commission percentage updated successfully!'
      });
      setShowCommissionModal(false);
      loadEmployees();
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to set commission: ${error.message}`
      });
    }
  });

  const { loading: creatingDistrict, execute: createDistrict } = useApi({
    onSuccess: (data) => {
      addToast({
        type: 'success',
        message: 'District created successfully!'
      });
      setShowDistrictModal(false);
      resetDistrictForm();
      loadDistricts();
    },
    onError: (error) => {
      addToast({
        type: 'error',
        message: `Failed to create district: ${error.message}`
      });
    }
  });

  // Load data functions
  const loadEmployees = () => {
    fetchEmployees(() => apiService.getEmployees({
      page: currentPage,
      limit: itemsPerPage,
      role: roleFilter === 'all' ? undefined : roleFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm || undefined
    }));
  };

  const loadDistricts = () => {
    fetchDistricts(() => apiService.getDistricts());
  };

  const loadCommissions = () => {
    fetchCommissions(() => apiService.getEmployeeCommissions());
  };

  // Initialize data
  useEffect(() => {
    loadEmployees();
    loadDistricts();
    loadCommissions();
  }, [currentPage, statusFilter, roleFilter, searchTerm]);

  // Filter employees
  useEffect(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => 
        statusFilter === 'active' ? emp.isActive : !emp.isActive
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, statusFilter, roleFilter]);

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      assignedDistricts: [],
      commissionPercentage: 10
    });
  };

  const resetDistrictForm = () => {
    setDistrictForm({
      name: '',
      state: '',
      coordinates: {
        latitude: 0,
        longitude: 0
      }
    });
  };

  const handleCreateEmployee = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      addToast({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    await createEmployee(() => apiService.createSuperEmployee(formData));
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    await updateEmployee(() => apiService.updateEmployeeStatus(
      selectedEmployee._id, 
      selectedEmployee.isActive
    ));
  };

  const handleDeleteEmployee = async () => {
    if (!deleteModal.employeeId) return;

    await deleteEmployee(() => apiService.deleteSuperEmployee(deleteModal.employeeId!));
  };

  const handleToggleStatus = async (employee: SuperEmployee) => {
    await updateEmployeeStatus(() => apiService.updateEmployeeStatus(
      employee._id, 
      !employee.isActive
    ));
  };

  const handleSetCommission = async () => {
    if (!commissionForm.employeeId || !commissionForm.commissionPercentage) {
      addToast({
        type: 'error',
        message: 'Please select an employee and enter commission percentage'
      });
      return;
    }

    await setCommission(() => apiService.setEmployeeCommission(
      commissionForm.employeeId,
      commissionForm.commissionPercentage
    ));
  };

  const handleCreateDistrict = async () => {
    if (!districtForm.name || !districtForm.state) {
      addToast({
        type: 'error',
        message: 'Please fill in district name and state'
      });
      return;
    }

    await createDistrict(() => apiService.createDistrict(districtForm));
  };

  const openCommissionModal = (employee: SuperEmployee) => {
    setCommissionForm({
      employeeId: employee._id,
      commissionPercentage: employee.commissionSettings.percentage
    });
    setShowCommissionModal(true);
  };

  const openViewModal = (employee: SuperEmployee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const openDeleteModal = (employee: SuperEmployee) => {
    setDeleteModal({
      isOpen: true,
      employeeId: employee._id,
      employeeName: employee.name
    });
  };

  // Statistics calculation
  const getStatistics = () => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.isActive).length;
    const superEmployees = employees.filter(emp => emp.role === 'super_employee').length;
    const totalCommissions = commissions.reduce((sum, comm) => sum + comm.commission.amount, 0);
    const pendingCommissions = commissions.filter(comm => comm.status === 'pending').length;

    return {
      totalEmployees,
      activeEmployees,
      superEmployees,
      totalCommissions,
      pendingCommissions
    };
  };

  const stats = getStatistics();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserCog className="h-8 w-8 text-blue-600" />
              Super Employee Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage super employees, districts, and commission settings
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDistrictModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Add District
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Super Employee
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeEmployees}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Super Employees</p>
              <p className="text-2xl font-bold text-purple-600">{stats.superEmployees}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-yellow-600">₹{stats.totalCommissions.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Commissions</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingCommissions}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="super_employee">Super Employee</option>
              <option value="employee">Employee</option>
            </select>
            
            <button
              onClick={loadEmployees}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Districts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                        <div className="text-sm text-gray-500">{employee.phone}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.role === 'super_employee' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {employee.role === 'super_employee' ? 'Super Employee' : 'Employee'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.assignedDistricts.length} districts
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.assignedDistricts.slice(0, 2).map(dist => dist.district).join(', ')}
                      {employee.assignedDistricts.length > 2 && '...'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.commissionSettings.percentage}%
                    </div>
                    <div className="text-sm text-gray-500">
                      ₹{employee.statistics.totalCommissionEarned.toLocaleString()}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openViewModal(employee)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => openCommissionModal(employee)}
                        className="text-green-600 hover:text-green-900"
                        title="Set Commission"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(employee)}
                        className={`${employee.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={employee.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {employee.isActive ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => openDeleteModal(employee)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <UserCog className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new super employee.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Super Employee</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commissionPercentage}
                  onChange={(e) => setFormData({ ...formData, commissionPercentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEmployee}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Set Commission Percentage</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionForm.commissionPercentage}
                  onChange={(e) => setCommissionForm({ ...commissionForm, commissionPercentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCommissionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetCommission}
                disabled={settingCommission}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {settingCommission ? 'Setting...' : 'Set Commission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* District Modal */}
      {showDistrictModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create District</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District Name *
                </label>
                <input
                  type="text"
                  value={districtForm.name}
                  onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={districtForm.state}
                  onChange={(e) => setDistrictForm({ ...districtForm, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={districtForm.coordinates.latitude}
                    onChange={(e) => setDistrictForm({ 
                      ...districtForm, 
                      coordinates: { ...districtForm.coordinates, latitude: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={districtForm.coordinates.longitude}
                    onChange={(e) => setDistrictForm({ 
                      ...districtForm, 
                      coordinates: { ...districtForm.coordinates, longitude: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDistrictModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDistrict}
                disabled={creatingDistrict}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {creatingDistrict ? 'Creating...' : 'Create District'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Employee Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedEmployee.name}</div>
                  <div><span className="font-medium">Email:</span> {selectedEmployee.email}</div>
                  <div><span className="font-medium">Phone:</span> {selectedEmployee.phone}</div>
                  <div><span className="font-medium">Role:</span> {selectedEmployee.role}</div>
                  <div><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      selectedEmployee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Commission Settings</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Percentage:</span> {selectedEmployee.commissionSettings.percentage}%</div>
                  <div><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                      selectedEmployee.commissionSettings.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedEmployee.commissionSettings.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div><span className="font-medium">Wallet Balance:</span> ₹{selectedEmployee.wallet.balance.toLocaleString()}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Sellers Assigned:</span> {selectedEmployee.statistics.totalSellersAssigned}</div>
                  <div><span className="font-medium">Commission Earned:</span> ₹{selectedEmployee.statistics.totalCommissionEarned.toLocaleString()}</div>
                  <div><span className="font-medium">Commission Paid:</span> ₹{selectedEmployee.statistics.totalCommissionPaid.toLocaleString()}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Assigned Districts</h4>
                <div className="space-y-1">
                  {selectedEmployee.assignedDistricts.map((district, index) => (
                    <div key={index} className="text-sm">
                      {district.district}, {district.state}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: '' })}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteModal.employeeName}? This action cannot be undone.`}
        confirmText="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        loading={deleting}
      />
    </div>
  );
};

export default SuperEmployeeManagement;
