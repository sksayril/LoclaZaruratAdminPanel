import React, { useState, useEffect } from 'react';
import { 
  UserCog, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  Star,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';
import ConfirmModal from '../ConfirmModal';

interface SuperEmployee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employeeId: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
  lastLogin: string;
  profileImage?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  skills: string[];
  performance: {
    rating: number;
    reviews: number;
    achievements: string[];
  };
  salary?: {
    amount: number;
    currency: string;
    frequency: string;
  };
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

const SuperEmployee: React.FC = () => {
  const [superEmployees, setSuperEmployees] = useState<SuperEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<SuperEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<SuperEmployee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    employeeId: '',
    address: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    skills: [''],
    permissions: [] as string[],
    isSuperAdmin: false
  });
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

  // Available roles and departments
  const roles = ['Super Admin', 'Admin', 'Manager', 'Supervisor', 'Employee'];
  const departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales'];
  const availablePermissions = [
    'user_management',
    'vendor_management',
    'customer_management',
    'category_management',
    'subscription_management',
    'financial_access',
    'report_access',
    'system_settings',
    'backup_restore',
    'audit_logs'
  ];

  // API hooks
  const { loading, error, execute: fetchEmployees } = useApi({
    onSuccess: (data) => {
      setSuperEmployees(data.data || []);
      setFilteredEmployees(data.data || []);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load super employees. Please refresh the page.'
      });
    }
  });

  const { loading: saveLoading, execute: saveEmployee } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: modalMode === 'add' ? 'Super Employee Created' : 'Super Employee Updated',
        message: modalMode === 'add' 
          ? 'The super employee has been successfully created.'
          : 'The super employee has been successfully updated.'
      });
      setShowModal(false);
      fetchEmployees(() => apiService.getSuperEmployees());
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: modalMode === 'add' ? 'Create Failed' : 'Update Failed',
        message: error || `Failed to ${modalMode === 'add' ? 'create' : 'update'} super employee. Please try again.`
      });
    }
  });

  const { loading: deleteLoading, execute: deleteEmployee } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Super Employee Deleted',
        message: 'The super employee has been successfully deleted.'
      });
      fetchEmployees(() => apiService.getSuperEmployees());
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error || 'Failed to delete super employee. Please try again.'
      });
    }
  });

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees(() => apiService.getSuperEmployees());
  }, []);

  // Filter employees based on search and filters
  useEffect(() => {
    let filtered = superEmployees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => employee.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(employee => employee.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  }, [superEmployees, searchTerm, statusFilter, roleFilter]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle skills array changes
  const handleSkillChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => i === index ? value : skill)
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, '']
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Handle permissions
  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  // Open modal for add/edit/view
  const openModal = (mode: 'add' | 'edit' | 'view', employee?: SuperEmployee) => {
    setModalMode(mode);
    if (employee) {
      setSelectedEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        employeeId: employee.employeeId,
        address: employee.address || '',
        emergencyContact: employee.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        },
        skills: employee.skills.length > 0 ? employee.skills : [''],
        permissions: employee.permissions,
        isSuperAdmin: employee.isSuperAdmin
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        employeeId: '',
        address: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        skills: [''],
        permissions: [],
        isSuperAdmin: false
      });
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const employeeData = {
      ...formData,
      skills: formData.skills.filter(skill => skill.trim() !== '')
    };
    
    if (modalMode === 'add') {
      await saveEmployee(() => apiService.createSuperEmployee(employeeData));
    } else if (modalMode === 'edit' && selectedEmployee) {
      await saveEmployee(() => apiService.updateSuperEmployee(selectedEmployee._id, employeeData));
    }
  };

  // Handle employee deletion
  const handleDelete = (employeeId: string) => {
    const employee = superEmployees.find(emp => emp._id === employeeId);
    const employeeName = employee?.name || 'this employee';
    
    setDeleteModal({
      isOpen: true,
      employeeId,
      employeeName
    });
  };

  // Confirm employee deletion
  const confirmDelete = async () => {
    if (deleteModal.employeeId) {
      await deleteEmployee(() => apiService.deleteSuperEmployee(deleteModal.employeeId!));
      setDeleteModal({ isOpen: false, employeeId: null, employeeName: '' });
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, employeeId: null, employeeName: '' });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'bg-purple-100 text-purple-700';
      case 'Admin': return 'bg-blue-100 text-blue-700';
      case 'Manager': return 'bg-green-100 text-green-700';
      case 'Supervisor': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <UserCog className="w-8 h-8 mr-3 text-sky-600" />
            Super Employee Management
          </h1>
          <p className="text-gray-600 mt-2">Manage super employees and their permissions</p>
        </div>
        
        <button
          onClick={() => openModal('add')}
          className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Super Employee</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'suspended')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchEmployees(() => apiService.getSuperEmployees())}
              disabled={loading}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={() => addToast({
                type: 'info',
                title: 'Export',
                message: 'Export functionality coming soon!'
              })}
              className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Super Employees List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No super employees found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first super employee'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && roleFilter === 'all' && (
            <button
              onClick={() => openModal('add')}
              className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600"
            >
              Add Super Employee
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-sky-100 rounded-full p-3">
                    <UserCog className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{employee.name}</h3>
                    <p className="text-sm text-gray-500">{employee.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {employee.isSuperAdmin && (
                    <Shield className="w-4 h-4 text-purple-500" />
                  )}
                  {employee.status === 'active' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {employee.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {employee.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined: {new Date(employee.joinDate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                  {employee.role}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                  {employee.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{employee.department}</span>
                <span>{employee.permissions.length} permissions</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Last login: {employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : 'Never'}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal('view', employee)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal('edit', employee)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(employee._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {modalMode === 'add' ? 'Add Super Employee' : 
                   modalMode === 'edit' ? 'Edit Super Employee' : 'View Super Employee'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {modalMode !== 'view' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee ID *
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department *
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          name="emergencyContact.name"
                          value={formData.emergencyContact.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          name="emergencyContact.phone"
                          value={formData.emergencyContact.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relationship
                        </label>
                        <input
                          type="text"
                          name="emergencyContact.relationship"
                          value={formData.emergencyContact.relationship}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills
                    </label>
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleSkillChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          placeholder="Enter skill"
                        />
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSkill}
                      className="text-sky-600 hover:text-sky-700 text-sm"
                    >
                      + Add Skill
                    </button>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permissions
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availablePermissions.map(permission => (
                        <label key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission)}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {permission.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Super Admin */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isSuperAdmin"
                      checked={formData.isSuperAdmin}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Super Admin Access
                    </label>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50"
                    >
                      {saveLoading ? 'Saving...' : modalMode === 'add' ? 'Create' : 'Update'}
                    </button>
                  </div>
                </form>
              ) : (
                // View Mode
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{selectedEmployee?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <p className="text-gray-900">{selectedEmployee?.employeeId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedEmployee?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900">{selectedEmployee?.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedEmployee?.role || '')}`}>
                        {selectedEmployee?.role}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <p className="text-gray-900">{selectedEmployee?.department}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEmployee?.status || '')}`}>
                        {selectedEmployee?.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Super Admin</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedEmployee?.isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedEmployee?.isSuperAdmin ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  {selectedEmployee?.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <p className="text-gray-900">{selectedEmployee.address}</p>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  {selectedEmployee?.emergencyContact && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="text-gray-900">{selectedEmployee.emergencyContact.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-gray-900">{selectedEmployee.emergencyContact.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Relationship</p>
                          <p className="text-gray-900">{selectedEmployee.emergencyContact.relationship}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee?.skills?.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {skill}
                        </span>
                      )) || <span className="text-gray-500">No skills listed</span>}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee?.permissions?.map((permission, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {permission.replace('_', ' ')}
                        </span>
                      )) || <span className="text-gray-500">No permissions assigned</span>}
                    </div>
                  </div>

                  {/* Performance */}
                  {selectedEmployee?.performance && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Performance</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-gray-900">{selectedEmployee.performance.rating}/5</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Reviews</p>
                          <p className="text-gray-900">{selectedEmployee.performance.reviews}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Achievements</p>
                          <p className="text-gray-900">{selectedEmployee.performance.achievements.length}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                      <p className="text-gray-900">
                        {selectedEmployee?.joinDate ? new Date(selectedEmployee.joinDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                      <p className="text-gray-900">
                        {selectedEmployee?.lastLogin ? new Date(selectedEmployee.lastLogin).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Super Employee"
        message={`Are you sure you want to delete "${deleteModal.employeeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default SuperEmployee;
