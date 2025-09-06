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
  MapPin
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
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileImage: string | null;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  adminDetails: {
    permissions: string[];
    isSuperAdmin: boolean;
    accessLevel: string;
    lastLogin: string;
  };
  superEmployeeDetails: {
    employeeId: string;
    department: string;
    designation: string;
    reportingManager?: {
      _id: string;
      email: string;
      name: string;
    } | null;
    permissions: string[];
    accessLevel: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    isActive: boolean;
    lastLogin: string;
    assignedAreas: Array<{
      areaId: string;
      areaName: string;
      areaType: string;
      areaCode: string;
      assignedBy: string;
      assignedAt: string;
      isActive: boolean;
      notes?: string;
      _id: string;
    }>;
    approvedAt?: string;
    approvedBy?: {
      _id: string;
      email: string;
      name: string;
    };
    areaPermissions: {
      canAssignAreas: boolean;
      canViewAllAreas: boolean;
      canManageAreaVendors: boolean;
      canManageAreaCustomers: boolean;
    };
  };
}

const SuperEmployee: React.FC = () => {
  const [superEmployees, setSuperEmployees] = useState<SuperEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<SuperEmployee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<SuperEmployee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingEmployees, setPendingEmployees] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [selectedEmployeeForApproval, setSelectedEmployeeForApproval] = useState<any>(null);
  const [approvalForm, setApprovalForm] = useState({
    adminNotes: '',
    rejectionReason: ''
  });
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedEmployeeForPermissions, setSelectedEmployeeForPermissions] = useState<SuperEmployee | null>(null);
  const [permissionsForm, setPermissionsForm] = useState({
    permissions: [] as string[],
    accessLevel: 'limited'
  });
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedEmployeeForDeactivation, setSelectedEmployeeForDeactivation] = useState<SuperEmployee | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [showAssignAreaModal, setShowAssignAreaModal] = useState(false);
  const [selectedEmployeeForArea, setSelectedEmployeeForArea] = useState<SuperEmployee | null>(null);
  const [availableAreas, setAvailableAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [areaAssignmentNotes, setAreaAssignmentNotes] = useState('');
  const [areaAction, setAreaAction] = useState<'assign' | 'remove' | 'update'>('assign');
  const [areaPermissions, setAreaPermissions] = useState({
    canAssignAreas: false,
    canViewAllAreas: true,
    canManageAreaVendors: true,
    canManageAreaCustomers: true
  });
  const [showAreaSearchModal, setShowAreaSearchModal] = useState(false);
  const [areaSearchParams, setAreaSearchParams] = useState({
    areaType: 'city',
    areaCode: 'MUM_001',
    page: 1,
    limit: 10
  });
  const [areaSearchResults, setAreaSearchResults] = useState<any>(null);
  const [areaSearchLoading, setAreaSearchLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    permissions: [] as string[],
    accessLevel: 'limited',
    areaPermissions: {
      canAssignAreas: false,
      canViewAllAreas: false,
      canManageAreaVendors: false,
      canManageAreaCustomers: false
    }
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

  // Available departments
  const departments = ['operations', 'sales', 'marketing', 'hr', 'finance', 'it'];
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
      fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'));
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
      fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error || 'Failed to delete super employee. Please try again.'
      });
    }
  });

  const { execute: fetchEmployeeDetails } = useApi({
    onSuccess: (data) => {
      setSelectedEmployee(data.data);
      setLoadingEmployeeDetails(false);
      addToast({
        type: 'success',
        title: 'Details Loaded',
        message: 'Super employee details have been successfully loaded.'
      });
    },
    onError: (error) => {
      setLoadingEmployeeDetails(false);
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load super employee details. Please try again.'
      });
    }
  });

  const { execute: fetchPendingEmployees } = useApi({
    onSuccess: (data) => {
      setPendingEmployees(data.data || []);
      setLoadingPending(false);
      addToast({
        type: 'success',
        title: 'Pending Employees Loaded',
        message: `Found ${data.data?.length || 0} pending super employees.`
      });
    },
    onError: (error) => {
      setLoadingPending(false);
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load pending super employees. Please try again.'
      });
    }
  });

  const { execute: approveEmployee } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Employee Approved',
        message: 'Super employee has been successfully approved.'
      });
      setShowApprovalModal(false);
      setApprovalForm({ adminNotes: '', rejectionReason: '' });
      // Refresh pending employees list
      fetchPendingEmployees(() => apiService.getPendingSuperEmployees(1, 10));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Approval Failed',
        message: error || 'Failed to approve super employee. Please try again.'
      });
    }
  });

  const { execute: rejectEmployee } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Employee Rejected',
        message: 'Super employee has been successfully rejected.'
      });
      setShowApprovalModal(false);
      setApprovalForm({ adminNotes: '', rejectionReason: '' });
      // Refresh pending employees list
      fetchPendingEmployees(() => apiService.getPendingSuperEmployees(1, 10));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Rejection Failed',
        message: error || 'Failed to reject super employee. Please try again.'
      });
    }
  });

  const { execute: updatePermissions } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Permissions Updated',
        message: 'Super employee permissions have been successfully updated.'
      });
      setShowPermissionsModal(false);
      setPermissionsForm({ permissions: [], accessLevel: 'limited' });
      // Refresh employees list
      fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error || 'Failed to update super employee permissions. Please try again.'
      });
    }
  });

  const { execute: deactivateEmployee } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Employee Deactivated',
        message: 'Super employee has been successfully deactivated.'
      });
      setShowDeactivateModal(false);
      setDeactivationReason('');
      // Refresh employees list
      fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Deactivation Failed',
        message: error || 'Failed to deactivate super employee. Please try again.'
      });
    }
  });

  const { execute: fetchStatistics } = useApi({
    onSuccess: (data) => {
      setStatisticsData(data.data);
      setLoadingStatistics(false);
      addToast({
        type: 'success',
        title: 'Statistics Loaded',
        message: 'Super employee statistics have been successfully loaded.'
      });
    },
    onError: (error) => {
      setLoadingStatistics(false);
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load super employee statistics. Please try again.'
      });
    }
  });

  const { execute: assignArea } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Area Assigned',
        message: 'Area has been successfully assigned to the super employee.'
      });
      setShowAssignAreaModal(false);
      setSelectedArea(null);
      setAreaAssignmentNotes('');
      // Refresh employees list
      fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Assignment Failed',
        message: error || 'Failed to assign area to super employee. Please try again.'
      });
    }
  });

  const { execute: removeArea } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Area Removed',
        message: 'Area has been successfully removed from the super employee.'
      });
      setShowAssignAreaModal(false);
      setSelectedArea(null);
      setAreaAssignmentNotes('');
      // Refresh employees list
      fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Removal Failed',
        message: error || 'Failed to remove area from super employee. Please try again.'
      });
    }
  });

  const { execute: updateAreaPermissions } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Permissions Updated',
        message: 'Area permissions have been successfully updated for the super employee.'
      });
      setShowAssignAreaModal(false);
      setSelectedArea(null);
      setAreaAssignmentNotes('');
      // Refresh employees list
      fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error || 'Failed to update area permissions for super employee. Please try again.'
      });
    }
  });

  const { execute: searchEmployeesByArea } = useApi({
    onSuccess: (data) => {
      setAreaSearchResults(data);
      setAreaSearchLoading(false);
      addToast({
        type: 'success',
        title: 'Search Complete',
        message: `Found ${data.data?.length || 0} super employees in the specified area.`
      });
    },
    onError: (error) => {
      setAreaSearchLoading(false);
      addToast({
        type: 'error',
        title: 'Search Failed',
        message: error || 'Failed to search super employees by area. Please try again.'
      });
    }
  });

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'));
  }, []);

  // Filter employees based on search and filters
  useEffect(() => {
    let filtered = superEmployees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.superEmployeeDetails.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.superEmployeeDetails.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.superEmployeeDetails.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter (based on isActive)
    if (statusFilter !== 'all') {
      const isActiveFilter = statusFilter === 'active';
      filtered = filtered.filter(employee => employee.isActive === isActiveFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(employee => employee.superEmployeeDetails.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  }, [superEmployees, searchTerm, statusFilter, departmentFilter]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else if (name.startsWith('areaPermissions.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        areaPermissions: {
          ...prev.areaPermissions,
          [field]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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
    
    if (mode === 'view' && employee) {
      // For view mode, fetch detailed information from API
      setLoadingEmployeeDetails(true);
      setShowModal(true);
      fetchEmployeeDetails(() => apiService.getSuperEmployeeById(employee._id));
    } else if (employee) {
      // For edit mode, use existing data
      setSelectedEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.superEmployeeDetails.department,
        designation: employee.superEmployeeDetails.designation,
        address: {
          street: employee.address.street || '',
          city: employee.address.city || '',
          state: employee.address.state || '',
          pincode: employee.address.pincode || '',
          country: employee.address.country || 'India'
        },
        permissions: employee.superEmployeeDetails.permissions,
        accessLevel: employee.superEmployeeDetails.accessLevel,
        areaPermissions: employee.superEmployeeDetails.areaPermissions
      });
      setShowModal(true);
    } else {
      // For add mode, clear all data
      setSelectedEmployee(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        address: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        permissions: [],
        accessLevel: 'limited',
        areaPermissions: {
          canAssignAreas: false,
          canViewAllAreas: false,
          canManageAreaVendors: false,
          canManageAreaCustomers: false
        }
      });
      setShowModal(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const employeeData = {
      ...formData
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

  // Handle pending employees
  const handleShowPending = () => {
    setLoadingPending(true);
    setShowPendingModal(true);
    fetchPendingEmployees(() => apiService.getPendingSuperEmployees(1, 10));
  };

  // Handle approval action
  const handleApprovalAction = (employee: any, action: 'approve' | 'reject') => {
    setSelectedEmployeeForApproval(employee);
    setApprovalAction(action);
    setApprovalForm({ adminNotes: '', rejectionReason: '' });
    setShowApprovalModal(true);
  };

  // Handle approval form input change
  const handleApprovalFormChange = (field: string, value: string) => {
    setApprovalForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit approval/rejection
  const handleSubmitApproval = async () => {
    if (!selectedEmployeeForApproval) return;

    if (approvalAction === 'approve') {
      if (!approvalForm.adminNotes.trim()) {
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'Admin notes are required for approval.'
        });
        return;
      }

      const requestData = {
        superEmployeeId: selectedEmployeeForApproval._id,
        status: 'approved' as const,
        adminNotes: approvalForm.adminNotes.trim()
      };

      await approveEmployee(() => apiService.approveSuperEmployee(requestData));
    } else {
      if (!approvalForm.rejectionReason.trim()) {
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'Rejection reason is required.'
        });
        return;
      }

      const requestData = {
        superEmployeeId: selectedEmployeeForApproval._id,
        status: 'rejected' as const,
        rejectionReason: approvalForm.rejectionReason.trim()
      };

      await rejectEmployee(() => apiService.rejectSuperEmployee(requestData));
    }
  };

  // Handle permissions update
  const handleUpdatePermissions = (employee: SuperEmployee) => {
    setSelectedEmployeeForPermissions(employee);
    setPermissionsForm({
      permissions: employee.superEmployeeDetails?.permissions || [],
      accessLevel: employee.superEmployeeDetails?.accessLevel || 'limited'
    });
    setShowPermissionsModal(true);
  };

  // Handle permissions form change
  const handlePermissionsFormChange = (field: string, value: string | string[]) => {
    setPermissionsForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle permission
  const togglePermission = (permission: string) => {
    setPermissionsForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Submit permissions update
  const handleSubmitPermissions = async () => {
    if (!selectedEmployeeForPermissions) return;

    const requestData = {
      superEmployeeId: selectedEmployeeForPermissions._id,
      permissions: permissionsForm.permissions,
      accessLevel: permissionsForm.accessLevel
    };

    await updatePermissions(() => apiService.updateSuperEmployeePermissions(requestData));
  };

  // Handle deactivation
  const handleDeactivateEmployee = (employee: SuperEmployee) => {
    setSelectedEmployeeForDeactivation(employee);
    setDeactivationReason('');
    setShowDeactivateModal(true);
  };

  // Submit deactivation
  const handleSubmitDeactivation = async () => {
    if (!selectedEmployeeForDeactivation) return;

    if (!deactivationReason.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Deactivation reason is required.'
      });
      return;
    }

    const requestData = {
      superEmployeeId: selectedEmployeeForDeactivation._id,
      reason: deactivationReason.trim()
    };

    await deactivateEmployee(() => apiService.deactivateSuperEmployee(requestData));
  };

  // Handle statistics
  const handleShowStatistics = () => {
    setLoadingStatistics(true);
    setShowStatisticsModal(true);
    fetchStatistics(() => apiService.getSuperEmployeeStatistics());
  };

  // Handle assign area
  const handleAssignArea = (employee: SuperEmployee) => {
    setSelectedEmployeeForArea(employee);
    setSelectedArea(null);
    setAreaAssignmentNotes('');
    setAreaAction('assign');
    setShowAssignAreaModal(true);
    // Mock areas with proper structure matching API requirements
    setAvailableAreas([
      { 
        areaId: 'MH_MUM_001', 
        areaName: 'Mumbai Central', 
        areaType: 'city', 
        areaCode: ['MUM_001', '723145'],
        description: 'Primary coverage area for Mumbai Central region'
      },
      { 
        areaId: 'MH_MUM_002', 
        areaName: 'Mumbai South', 
        areaType: 'city', 
        areaCode: ['MUM_002', '723146'],
        description: 'South Mumbai commercial district'
      },
      { 
        areaId: 'MH_PUN_001', 
        areaName: 'Pune Central', 
        areaType: 'city', 
        areaCode: ['PUN_001', '411001'],
        description: 'Central Pune area covering main commercial zones'
      },
      { 
        areaId: 'DL_DEL_001', 
        areaName: 'New Delhi', 
        areaType: 'metro', 
        areaCode: ['DEL_001', '110001'],
        description: 'New Delhi metropolitan area'
      },
      { 
        areaId: 'KA_BLR_001', 
        areaName: 'Bangalore Central', 
        areaType: 'city', 
        areaCode: ['BLR_001', '560001'],
        description: 'Bangalore city center and tech parks'
      }
    ]);
  };

  // Handle area selection (single selection for API structure)
  const handleAreaSelection = (area: any) => {
    setSelectedArea(area);
  };

  // Submit area assignment
  const handleSubmitAreaAssignment = async () => {
    if (!selectedEmployeeForArea) return;
    if (areaAction !== 'update' && !selectedArea) return;

    // Validation for assign and remove actions
    if (areaAction !== 'update' && !areaAssignmentNotes.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: `${areaAction === 'remove' ? 'Removal reason' : 'Assignment notes'} are required.`
      });
      return;
    }

    if (areaAction === 'assign') {
      const requestData = {
        superEmployeeId: selectedEmployeeForArea._id,
        areaId: selectedArea.areaId,
        areaName: selectedArea.areaName,
        areaType: selectedArea.areaType,
        areaCode: Array.isArray(selectedArea.areaCode) ? selectedArea.areaCode : [selectedArea.areaCode],
        notes: areaAssignmentNotes.trim()
      };
      await assignArea(() => apiService.assignAreaToSuperEmployee(requestData));
    } else if (areaAction === 'remove') {
      const requestData = {
        superEmployeeId: selectedEmployeeForArea._id,
        areaId: selectedArea.areaId
      };
      await removeArea(() => apiService.removeAreaFromSuperEmployee(requestData));
    } else if (areaAction === 'update') {
      const requestData = {
        superEmployeeId: selectedEmployeeForArea._id,
        areaPermissions: areaPermissions
      };
      await updateAreaPermissions(() => apiService.updateAreaPermissions(requestData));
    }
  };

  // Handle area search
  const handleAreaSearch = async () => {
    setAreaSearchLoading(true);
    setAreaSearchResults(null);
    await searchEmployeesByArea(() => apiService.getSuperEmployeesByArea(areaSearchParams));
  };

  // Get status color
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  // Get approval status color
  const getApprovalStatusColor = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get department color
  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'operations': return 'bg-blue-100 text-blue-700';
      case 'sales': return 'bg-green-100 text-green-700';
      case 'marketing': return 'bg-purple-100 text-purple-700';
      case 'hr': return 'bg-pink-100 text-pink-700';
      case 'finance': return 'bg-orange-100 text-orange-700';
      case 'it': return 'bg-indigo-100 text-indigo-700';
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
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleShowPending}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Pending Super Employee</span>
          </button>
          
          <button
            onClick={handleShowStatistics}
            className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Super Employee Statistic</span>
          </button>

          <button
            onClick={() => setShowAreaSearchModal(true)}
            className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 flex items-center space-x-2 text-sm"
          >
            <Search className="w-4 h-4" />
            <span>Get by Area</span>
          </button>
        </div>
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
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchEmployees(() => apiService.getSuperEmployees(1, 10, 'all', 'all'))}
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
            {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first super employee'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && departmentFilter === 'all' && (
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
                    <p className="text-sm text-gray-500">{employee.superEmployeeDetails.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {employee.adminDetails.isSuperAdmin && (
                    <Shield className="w-4 h-4 text-purple-500" />
                  )}
                  {employee.isActive ? (
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
                  Joined: {new Date(employee.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(employee.superEmployeeDetails.department)}`}>
                  {employee.superEmployeeDetails.department.charAt(0).toUpperCase() + employee.superEmployeeDetails.department.slice(1)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.isActive)}`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApprovalStatusColor(employee.superEmployeeDetails.approvalStatus)}`}>
                  {employee.superEmployeeDetails.approvalStatus.charAt(0).toUpperCase() + employee.superEmployeeDetails.approvalStatus.slice(1)}
                </span>
                <span>{employee.superEmployeeDetails.permissions.length} permissions</span>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <div className="flex items-center justify-between">
                  <span>Designation:</span>
                  <span className="font-medium">{employee.superEmployeeDetails.designation}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Areas Assigned:</span>
                  <span className="font-medium">{employee.superEmployeeDetails.assignedAreas.length}</span>
                </div>
                {employee.superEmployeeDetails.reportingManager && (
                  <div className="flex items-center justify-between mt-1">
                    <span>Reports To:</span>
                    <span className="font-medium text-xs">{employee.superEmployeeDetails.reportingManager.name}</span>
                  </div>
                )}
              </div>

              {/* Verification Status */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <div className="flex items-center space-x-4">
                  <span className={`flex items-center ${employee.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    <Mail className="w-3 h-3 mr-1" />
                    {employee.isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                  <span className={`flex items-center ${employee.isPhoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                    <Phone className="w-3 h-3 mr-1" />
                    {employee.isPhoneVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
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
                    onClick={() => handleUpdatePermissions(employee)}
                    className="p-1 text-gray-400 hover:text-purple-600"
                    title="Update Permissions"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAssignArea(employee)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Assign Area"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeactivateEmployee(employee)}
                    className="p-1 text-gray-400 hover:text-orange-600"
                    title="Deactivate Employee"
                  >
                    <UserX className="w-4 h-4" />
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
                        Designation *
                      </label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
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
                        Access Level *
                      </label>
                      <select
                        name="accessLevel"
                        value={formData.accessLevel}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="limited">Limited</option>
                        <option value="full">Full</option>
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
                          <option key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street
                        </label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          name="address.pincode"
                          value={formData.address.pincode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                    </div>
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
                  {/* Loading State for View Mode */}
                  {loadingEmployeeDetails ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mb-4"></div>
                      <p className="text-gray-600">Loading employee details...</p>
                    </div>
                  ) : selectedEmployee ? (
                    <>
                  {/* Employee Header Card */}
                  <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white bg-opacity-20 rounded-full p-4">
                        <UserCog className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold">{selectedEmployee?.name}</h2>
                        <p className="text-sky-100">{selectedEmployee?.superEmployeeDetails?.designation}</p>
                        <p className="text-sky-200 text-sm">ID: {selectedEmployee?.superEmployeeDetails?.employeeId}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          {selectedEmployee?.adminDetails?.isSuperAdmin && (
                            <Shield className="w-5 h-5 text-yellow-300" />
                          )}
                          {selectedEmployee?.isActive ? (
                            <CheckCircle className="w-5 h-5 text-green-300" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-300" />
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedEmployee?.superEmployeeDetails?.approvalStatus === 'approved' ? 'bg-green-500 text-white' :
                          selectedEmployee?.superEmployeeDetails?.approvalStatus === 'pending' ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {selectedEmployee?.superEmployeeDetails?.approvalStatus?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Contact Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-blue-500" />
                        Contact Info
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{selectedEmployee?.email}</span>
                            <span className={`w-2 h-2 rounded-full ${selectedEmployee?.isEmailVerified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Phone:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{selectedEmployee?.phone}</span>
                            <span className={`w-2 h-2 rounded-full ${selectedEmployee?.isPhoneVerified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Department & Role */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <UserCog className="w-5 h-5 mr-2 text-purple-500" />
                        Role & Department
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Department:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(selectedEmployee?.superEmployeeDetails?.department || '')}`}>
                            {selectedEmployee?.superEmployeeDetails?.department?.charAt(0).toUpperCase() + selectedEmployee?.superEmployeeDetails?.department?.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Access Level:</span>
                          <span className="text-sm font-medium capitalize">{selectedEmployee?.superEmployeeDetails?.accessLevel}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Super Admin:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedEmployee?.adminDetails?.isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {selectedEmployee?.adminDetails?.isSuperAdmin ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Activity Status */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-green-500" />
                        Activity
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEmployee?.isActive || false)}`}>
                            {selectedEmployee?.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Last Login:</span>
                          <span className="text-sm font-medium">
                            {selectedEmployee?.lastLogin ? new Date(selectedEmployee.lastLogin).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Joined:</span>
                          <span className="text-sm font-medium">
                            {selectedEmployee?.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Card */}
                  {selectedEmployee?.address && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Address
                      </h3>
                      <div className="space-y-1 text-gray-700">
                        {selectedEmployee.address.street && <p className="font-medium">{selectedEmployee.address.street}</p>}
                        {selectedEmployee.address.city && selectedEmployee.address.state && (
                          <p>{selectedEmployee.address.city}, {selectedEmployee.address.state} {selectedEmployee.address.pincode}</p>
                        )}
                        {selectedEmployee.address.country && <p className="text-sm text-gray-600">{selectedEmployee.address.country}</p>}
                      </div>
                    </div>
                  )}

                  {/* Permissions Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-green-500" />
                      Permissions ({selectedEmployee?.superEmployeeDetails?.permissions?.length || 0})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee?.superEmployeeDetails?.permissions?.map((permission, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {permission.replace('_', ' ')}
                        </span>
                      )) || <span className="text-gray-500 italic">No permissions assigned</span>}
                    </div>
                  </div>

                  {/* Area Permissions Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Area Permissions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Assign Areas</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedEmployee?.superEmployeeDetails?.areaPermissions?.canAssignAreas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedEmployee?.superEmployeeDetails?.areaPermissions?.canAssignAreas ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">View All Areas</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedEmployee?.superEmployeeDetails?.areaPermissions?.canViewAllAreas ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedEmployee?.superEmployeeDetails?.areaPermissions?.canViewAllAreas ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Manage Vendors</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedEmployee?.superEmployeeDetails?.areaPermissions?.canManageAreaVendors ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedEmployee?.superEmployeeDetails?.areaPermissions?.canManageAreaVendors ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Manage Customers</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedEmployee?.superEmployeeDetails?.areaPermissions?.canManageAreaCustomers ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedEmployee?.superEmployeeDetails?.areaPermissions?.canManageAreaCustomers ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Areas Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Assigned Areas ({selectedEmployee?.superEmployeeDetails?.assignedAreas?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {selectedEmployee?.superEmployeeDetails?.assignedAreas && selectedEmployee.superEmployeeDetails.assignedAreas.length > 0 ? (
                        selectedEmployee.superEmployeeDetails.assignedAreas.map((area, index) => (
                          <div key={index} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-gray-800">{area.areaName}</p>
                                <p className="text-sm text-gray-600">Code: {area.areaCode} • Type: {area.areaType}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${area.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {area.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {area.notes && (
                              <p className="text-sm text-gray-600 mb-2 italic">"{area.notes}"</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Assigned: {new Date(area.assignedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <p className="italic">No areas assigned</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reporting Manager Card */}
                  {selectedEmployee?.superEmployeeDetails?.reportingManager && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <UserCog className="w-5 h-5 mr-2 text-indigo-500" />
                        Reporting Manager
                      </h3>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                        <p className="font-semibold text-indigo-800">{selectedEmployee.superEmployeeDetails.reportingManager.name}</p>
                        <p className="text-sm text-indigo-600">{selectedEmployee.superEmployeeDetails.reportingManager.email}</p>
                      </div>
                    </div>
                  )}

                  {/* Timeline & Approval Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                      Timeline & Approval
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-600">Join Date:</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {selectedEmployee?.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-600">Last Login:</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {selectedEmployee?.lastLogin ? new Date(selectedEmployee.lastLogin).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                      
                      {(selectedEmployee?.superEmployeeDetails?.approvedAt || selectedEmployee?.superEmployeeDetails?.approvedBy) && (
                        <div className="space-y-3">
                          {selectedEmployee?.superEmployeeDetails?.approvedAt && (
                            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <span className="text-sm font-medium text-green-600">Approved At:</span>
                              <span className="text-sm font-semibold text-green-800">
                                {new Date(selectedEmployee.superEmployeeDetails.approvedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {selectedEmployee?.superEmployeeDetails?.approvedBy && (
                            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <span className="text-sm font-medium text-green-600">Approved By:</span>
                              <span className="text-sm font-semibold text-green-800">
                                {selectedEmployee.superEmployeeDetails.approvedBy.name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <UserCog className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">No employee data available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Super Employees Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Super Employees
                </h2>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Loading State */}
              {loadingPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                  <p className="text-gray-600">Loading pending employees...</p>
                </div>
              ) : pendingEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Employees</h3>
                  <p className="text-gray-500">All super employees have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 font-semibold text-gray-700">
                      <div>Email Address</div>
                      <div>Approval Status</div>
                    </div>
                  </div>

                  {/* Pending Employees List */}
                  <div className="space-y-3">
                    {pendingEmployees.map((employee, index) => (
                      <div key={employee._id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-2 gap-4 items-center">
                          {/* Email */}
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 rounded-full p-2">
                              <Mail className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{employee.email}</p>
                              {employee.name && (
                                <p className="text-sm text-gray-500">{employee.name}</p>
                              )}
                            </div>
                          </div>

                          {/* Approval Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getApprovalStatusColor(employee.superEmployeeDetails?.approvalStatus || employee.approvalStatus || 'pending')}`}>
                                {(employee.superEmployeeDetails?.approvalStatus || employee.approvalStatus || 'pending').charAt(0).toUpperCase() + (employee.superEmployeeDetails?.approvalStatus || employee.approvalStatus || 'pending').slice(1)}
                              </span>
                              {(employee.superEmployeeDetails?.approvalStatus === 'pending' || employee.approvalStatus === 'pending') && (
                                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            {(employee.superEmployeeDetails?.approvalStatus === 'pending' || employee.approvalStatus === 'pending') && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleApprovalAction(employee, 'approve')}
                                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center space-x-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleApprovalAction(employee, 'reject')}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center space-x-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional Information */}
                        {(employee.superEmployeeDetails?.department || employee.superEmployeeDetails?.designation) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              {employee.superEmployeeDetails?.department && (
                                <span className="flex items-center">
                                  <UserCog className="w-4 h-4 mr-1" />
                                  Department: {employee.superEmployeeDetails.department.charAt(0).toUpperCase() + employee.superEmployeeDetails.department.slice(1)}
                                </span>
                              )}
                              {employee.superEmployeeDetails?.designation && (
                                <span className="flex items-center">
                                  <Shield className="w-4 h-4 mr-1" />
                                  {employee.superEmployeeDetails.designation}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="border-t pt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Total: {pendingEmployees.length} pending employee{pendingEmployees.length !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => {
                        setLoadingPending(true);
                        fetchPendingEmployees(() => apiService.getPendingSuperEmployees(1, 10));
                      }}
                      className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Area Modal */}
      {showAssignAreaModal && selectedEmployeeForArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <MapPin className="w-6 h-6 mr-2 text-blue-500" />
                  Assign Areas
                </h2>
                <button
                  onClick={() => setShowAssignAreaModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <UserCog className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedEmployeeForArea.name}</p>
                    <p className="text-sm text-gray-500">{selectedEmployeeForArea.email}</p>
                    <p className="text-sm text-gray-500">
                      {selectedEmployeeForArea.superEmployeeDetails?.designation} - {selectedEmployeeForArea.superEmployeeDetails?.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Action</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      areaAction === 'assign'
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setAreaAction('assign')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        areaAction === 'assign' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {areaAction === 'assign' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Assign Area</p>
                        <p className="text-sm text-gray-600">Assign a new area to this employee</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      areaAction === 'remove'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setAreaAction('remove')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        areaAction === 'remove' ? 'border-red-500' : 'border-gray-300'
                      }`}>
                        {areaAction === 'remove' && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Remove Area</p>
                        <p className="text-sm text-gray-600">Remove an assigned area from employee</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      areaAction === 'update'
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setAreaAction('update')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        areaAction === 'update' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {areaAction === 'update' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Update Area</p>
                        <p className="text-sm text-gray-600">Update details of an assigned area</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Assigned Areas */}
              {selectedEmployeeForArea.superEmployeeDetails?.assignedAreas && selectedEmployeeForArea.superEmployeeDetails.assignedAreas.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Currently Assigned Areas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEmployeeForArea.superEmployeeDetails.assignedAreas.map((area, index) => (
                      <div key={area._id || index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">{area.areaName}</p>
                            <p className="text-sm text-green-600">{area.areaCode} - {area.areaType}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-500">Assigned</p>
                          </div>
                        </div>
                        {area.notes && (
                          <p className="text-sm text-green-600 mt-2">{area.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas Section */}
              {areaAction !== 'update' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {areaAction === 'assign' && 'Select Area to Assign'}
                    {areaAction === 'remove' && 'Select Area to Remove'}
                  </h3>
                
                {areaAction === 'assign' && (
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {availableAreas.map((area) => (
                      <div
                        key={area.areaId}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedArea?.areaId === area.areaId
                            ? 'bg-green-50 border-green-500'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleAreaSelection(area)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="font-medium text-gray-800">{area.areaName}</p>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {area.areaType}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Area ID:</span> {area.areaId}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Codes:</span> {Array.isArray(area.areaCode) ? area.areaCode.join(', ') : area.areaCode}
                              </p>
                              <p className="text-sm text-gray-500">{area.description}</p>
                            </div>
                          </div>
                          <div>
                            {selectedArea?.areaId === area.areaId ? (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {areaAction === 'remove' && (
                  <>
                    {selectedEmployeeForArea.superEmployeeDetails?.assignedAreas && selectedEmployeeForArea.superEmployeeDetails.assignedAreas.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                        {selectedEmployeeForArea.superEmployeeDetails.assignedAreas.map((area, index) => (
                          <div
                            key={area._id || index}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedArea?.areaId === area.areaId
                                ? 'bg-red-50 border-red-500'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleAreaSelection(area)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <p className="font-medium text-gray-800">{area.areaName}</p>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    {area.areaType}
                                  </span>
                                  <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                                    Currently Assigned
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Area ID:</span> {area.areaId}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Area Code:</span> {area.areaCode}
                                  </p>
                                  {area.notes && (
                                    <p className="text-sm text-gray-500">
                                      <span className="font-medium">Notes:</span> {area.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div>
                                {selectedArea?.areaId === area.areaId ? (
                                  <CheckCircle className="w-6 h-6 text-red-500" />
                                ) : (
                                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No areas currently assigned to this employee</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              )}

              {/* Notes / Permissions */}
              {areaAction === 'update' ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Area Permissions</h3>
                  <div className="space-y-4 bg-blue-50 rounded-lg p-4">
                    {/* Can Assign Areas */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Can Assign Areas
                        </label>
                        <p className="text-xs text-gray-600">Allow employee to assign areas to other employees</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={areaPermissions.canAssignAreas}
                          onChange={(e) => setAreaPermissions({
                            ...areaPermissions,
                            canAssignAreas: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Can View All Areas */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Can View All Areas
                        </label>
                        <p className="text-xs text-gray-600">Allow employee to view all areas in the system</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={areaPermissions.canViewAllAreas}
                          onChange={(e) => setAreaPermissions({
                            ...areaPermissions,
                            canViewAllAreas: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Can Manage Area Vendors */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Can Manage Area Vendors
                        </label>
                        <p className="text-xs text-gray-600">Allow employee to manage vendors in assigned areas</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={areaPermissions.canManageAreaVendors}
                          onChange={(e) => setAreaPermissions({
                            ...areaPermissions,
                            canManageAreaVendors: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Can Manage Area Customers */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Can Manage Area Customers
                        </label>
                        <p className="text-xs text-gray-600">Allow employee to manage customers in assigned areas</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={areaPermissions.canManageAreaCustomers}
                          onChange={(e) => setAreaPermissions({
                            ...areaPermissions,
                            canManageAreaCustomers: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {areaAction === 'assign' && 'Assignment Notes'}
                    {areaAction === 'remove' && 'Removal Reason'}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={areaAssignmentNotes}
                    onChange={(e) => setAreaAssignmentNotes(e.target.value)}
                    rows={3}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                      areaAction === 'assign' ? 'focus:ring-green-500' : 'focus:ring-red-500'
                    } focus:border-transparent`}
                    placeholder={
                      areaAction === 'assign' ? 'Enter notes about this area assignment (e.g., Primary coverage area for Mumbai Central region)' :
                      'Enter reason for removing this area (e.g., Employee relocated to different region)'
                    }
                  />
                </div>
              )}

              {/* Selected Area Summary */}
              {selectedArea && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">
                    Selected Area for Assignment:
                  </h4>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="font-medium text-gray-800">{selectedArea.areaName}</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {selectedArea.areaType}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Area ID:</span> {selectedArea.areaId}</p>
                      <p><span className="font-medium">Codes:</span> {Array.isArray(selectedArea.areaCode) ? selectedArea.areaCode.join(', ') : selectedArea.areaCode}</p>
                      <p><span className="font-medium">Description:</span> {selectedArea.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowAssignAreaModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAreaAssignment}
                  className={`px-4 py-2 text-white rounded-lg flex items-center space-x-2 ${
                    areaAction === 'assign' ? 'bg-green-500 hover:bg-green-600' :
                    areaAction === 'remove' ? 'bg-red-500 hover:bg-red-600' :
                    'bg-blue-500 hover:bg-blue-600'
                  }`}
                  disabled={
                    (areaAction !== 'update' && !selectedArea) || 
                    (areaAction !== 'update' && !areaAssignmentNotes.trim())
                  }
                >
                  <MapPin className="w-4 h-4" />
                  <span>
                    {areaAction === 'assign' && 'Assign Area'}
                    {areaAction === 'remove' && 'Remove Area'}
                    {areaAction === 'update' && 'Update Permissions'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatisticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Super Employee Statistics
                </h2>
                <button
                  onClick={() => setShowStatisticsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Loading State */}
              {loadingStatistics ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mb-4"></div>
                  <p className="text-gray-600">Loading statistics...</p>
                </div>
              ) : statisticsData ? (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Employees */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Employees</p>
                          <p className="text-2xl font-bold text-blue-800">{statisticsData.totalEmployees || 0}</p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-2">
                          <UserCog className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    {/* Active Employees */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Active Employees</p>
                          <p className="text-2xl font-bold text-green-800">{statisticsData.activeEmployees || 0}</p>
                        </div>
                        <div className="bg-green-100 rounded-full p-2">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    {/* Pending Approval */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Pending Approval</p>
                          <p className="text-2xl font-bold text-orange-800">{statisticsData.pendingEmployees || 0}</p>
                        </div>
                        <div className="bg-orange-100 rounded-full p-2">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Inactive/Deactivated */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600 font-medium">Inactive/Deactivated</p>
                          <p className="text-2xl font-bold text-red-800">{statisticsData.inactiveEmployees || 0}</p>
                        </div>
                        <div className="bg-red-100 rounded-full p-2">
                          <UserX className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Department Distribution */}
                  {statisticsData.departmentDistribution && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Distribution</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Array.isArray(statisticsData.departmentDistribution) ? (
                          statisticsData.departmentDistribution.map((item: any, index: number) => (
                            <div key={item._id || index} className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-lg font-bold text-gray-800">{item.count || 0}</p>
                              <p className="text-sm text-gray-600 capitalize">{item._id || 'Unknown'}</p>
                            </div>
                          ))
                        ) : typeof statisticsData.departmentDistribution === 'object' ? (
                          Object.entries(statisticsData.departmentDistribution).map(([department, count]) => (
                            <div key={department} className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-lg font-bold text-gray-800">{typeof count === 'object' ? (count as any).count || 0 : count as number}</p>
                              <p className="text-sm text-gray-600 capitalize">{department}</p>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center text-gray-500">No department data available</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Permission Statistics */}
                  {statisticsData.permissionStats && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Permission Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.isArray(statisticsData.permissionStats) ? (
                          statisticsData.permissionStats.map((item: any, index: number) => (
                            <div key={item._id || index} className="text-center p-3 bg-purple-50 rounded-lg">
                              <p className="text-lg font-bold text-purple-800">{item.count || 0}</p>
                              <p className="text-sm text-purple-600 capitalize">{item._id || 'Unknown'}</p>
                            </div>
                          ))
                        ) : typeof statisticsData.permissionStats === 'object' ? (
                          Object.entries(statisticsData.permissionStats).map(([permission, count]) => (
                            <div key={permission} className="text-center p-3 bg-purple-50 rounded-lg">
                              <p className="text-lg font-bold text-purple-800">{typeof count === 'object' ? (count as any).count || 0 : count as number}</p>
                              <p className="text-sm text-purple-600 capitalize">{permission}</p>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center text-gray-500">No permission data available</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {statisticsData.recentActivity && Array.isArray(statisticsData.recentActivity) && statisticsData.recentActivity.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {statisticsData.recentActivity.map((activity: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">{activity.action || 'Unknown Action'}</p>
                              <p className="text-sm text-gray-600">{activity.employee || activity.user || 'System'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">{activity.date || activity.timestamp || activity.createdAt || 'N/A'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Statistics */}
                  {Object.keys(statisticsData).filter(key => 
                    !['totalEmployees', 'activeEmployees', 'pendingEmployees', 'inactiveEmployees', 'departmentDistribution', 'permissionStats', 'recentActivity'].includes(key)
                  ).length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(statisticsData).filter(([key]) => 
                          !['totalEmployees', 'activeEmployees', 'pendingEmployees', 'inactiveEmployees', 'departmentDistribution', 'permissionStats', 'recentActivity'].includes(key)
                        ).map(([key, value]) => (
                          <div key={key} className="bg-indigo-50 rounded-lg p-4">
                            <p className="text-sm text-indigo-600 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="text-lg font-bold text-indigo-800">
                              {typeof value === 'object' && value !== null ? (
                                Array.isArray(value) ? (
                                  `${value.length} items`
                                ) : (
                                  Object.keys(value).length > 0 ? `${Object.keys(value).length} entries` : 'Empty'
                                )
                              ) : (
                                String(value)
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Statistics Available</h3>
                  <p className="text-gray-500">Unable to load statistics data.</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-4 flex items-center justify-between text-sm text-gray-500 mt-6">
                <span>Last updated: {new Date().toLocaleString()}</span>
                <button
                  onClick={() => {
                    setLoadingStatistics(true);
                    fetchStatistics(() => apiService.getSuperEmployeeStatistics());
                  }}
                  className="flex items-center px-3 py-1 bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Employee Modal */}
      {showDeactivateModal && selectedEmployeeForDeactivation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <UserX className="w-6 h-6 mr-2 text-orange-500" />
                  Deactivate Employee
                </h2>
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <UserCog className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedEmployeeForDeactivation.name}</p>
                    <p className="text-sm text-gray-500">{selectedEmployeeForDeactivation.email}</p>
                    <p className="text-sm text-gray-500">
                      {selectedEmployeeForDeactivation.superEmployeeDetails?.designation} - {selectedEmployeeForDeactivation.superEmployeeDetails?.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-orange-800">Warning</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      This will deactivate the employee's account and revoke their access to the system. This action can be reversed later if needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deactivation Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deactivationReason}
                    onChange={(e) => setDeactivationReason(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter reason for deactivation (e.g., Policy violation, Temporary suspension, etc.)"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDeactivation}
                  className="px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600 flex items-center space-x-2"
                >
                  <UserX className="w-4 h-4" />
                  <span>Deactivate Employee</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Permissions Modal */}
      {showPermissionsModal && selectedEmployeeForPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Key className="w-6 h-6 mr-2 text-purple-500" />
                  Update Permissions
                </h2>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <UserCog className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedEmployeeForPermissions.name}</p>
                    <p className="text-sm text-gray-500">{selectedEmployeeForPermissions.email}</p>
                    <p className="text-sm text-gray-500">
                      {selectedEmployeeForPermissions.superEmployeeDetails?.designation} - {selectedEmployeeForPermissions.superEmployeeDetails?.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Access Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Level
                  </label>
                  <select
                    value={permissionsForm.accessLevel}
                    onChange={(e) => handlePermissionsFormChange('accessLevel', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="limited">Limited</option>
                    <option value="full">Full</option>
                    <option value="read-only">Read Only</option>
                  </select>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-3">
                    {['dashboard', 'vendors', 'kyc', 'withdrawals', 'reports', 'users', 'analytics', 'settings'].map((permission) => (
                      <div key={permission} className="flex items-center">
                        <input
                          id={permission}
                          type="checkbox"
                          checked={permissionsForm.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <label htmlFor={permission} className="ml-3 text-sm font-medium text-gray-700 capitalize">
                          {permission}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Permissions Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Permissions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {permissionsForm.permissions.length > 0 ? (
                      permissionsForm.permissions.map((permission) => (
                        <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {permission}
                        </span>
                      ))
                    ) : (
                      <span className="text-blue-600 text-xs">No permissions selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPermissions}
                  className="px-4 py-2 text-white bg-purple-500 rounded-lg hover:bg-purple-600 flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Update Permissions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedEmployeeForApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  {approvalAction === 'approve' ? (
                    <>
                      <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Employee
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject Employee
                    </>
                  )}
                </h2>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedEmployeeForApproval.email}</p>
                    {selectedEmployeeForApproval.name && (
                      <p className="text-sm text-gray-500">{selectedEmployeeForApproval.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {approvalAction === 'approve' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={approvalForm.adminNotes}
                      onChange={(e) => handleApprovalFormChange('adminNotes', e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter admin notes for approval (e.g., Employee credentials verified and approved)"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={approvalForm.rejectionReason}
                      onChange={(e) => handleApprovalFormChange('rejectionReason', e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter reason for rejection (e.g., Invalid employee ID or missing documentation)"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApproval}
                  className={`px-4 py-2 text-white rounded-lg flex items-center space-x-2 ${
                    approvalAction === 'approve'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {approvalAction === 'approve' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Approve Employee</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reject Employee</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Area Search Modal */}
      {showAreaSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Search className="w-6 h-6 mr-2 text-purple-500" />
                  Get Super Employees by Area
                </h2>
                <button
                  onClick={() => {
                    setShowAreaSearchModal(false);
                    setAreaSearchResults(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Form */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area Type
                    </label>
                    <select
                      value={areaSearchParams.areaType}
                      onChange={(e) => setAreaSearchParams({
                        ...areaSearchParams,
                        areaType: e.target.value
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="city">City</option>
                      <option value="metro">Metro</option>
                      <option value="state">State</option>
                      <option value="region">Region</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area Code
                    </label>
                    <input
                      type="text"
                      value={areaSearchParams.areaCode}
                      onChange={(e) => setAreaSearchParams({
                        ...areaSearchParams,
                        areaCode: e.target.value
                      })}
                      placeholder="e.g., MUM_001"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={areaSearchParams.page}
                      onChange={(e) => setAreaSearchParams({
                        ...areaSearchParams,
                        page: parseInt(e.target.value) || 1
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={areaSearchParams.limit}
                      onChange={(e) => setAreaSearchParams({
                        ...areaSearchParams,
                        limit: parseInt(e.target.value) || 10
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleAreaSearch}
                    disabled={areaSearchLoading}
                    className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {areaSearchLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{areaSearchLoading ? 'Searching...' : 'Search Employees'}</span>
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {areaSearchResults && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Search Results
                    </h3>
                    <div className="text-sm text-gray-600">
                      {areaSearchResults.pagination && (
                        <span>
                          Page {areaSearchResults.pagination.currentPage} of {areaSearchResults.pagination.totalPages} 
                          ({areaSearchResults.pagination.totalItems} total)
                        </span>
                      )}
                    </div>
                  </div>

                  {areaSearchResults.data && areaSearchResults.data.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {areaSearchResults.data.map((employee: any, index: number) => (
                        <div key={employee._id || index} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-800">{employee.name}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  employee.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {employee.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  employee.superEmployeeDetails?.approvalStatus === 'approved' 
                                    ? 'bg-green-100 text-green-700' 
                                    : employee.superEmployeeDetails?.approvalStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {employee.superEmployeeDetails?.approvalStatus || 'Unknown'}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <p><span className="font-medium">Email:</span> {employee.email}</p>
                                  <p><span className="font-medium">Phone:</span> {employee.phone}</p>
                                </div>
                                <div>
                                  <p><span className="font-medium">Department:</span> {employee.superEmployeeDetails?.department}</p>
                                  <p><span className="font-medium">Designation:</span> {employee.superEmployeeDetails?.designation}</p>
                                </div>
                              </div>
                              {employee.superEmployeeDetails?.assignedAreas && employee.superEmployeeDetails.assignedAreas.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Assigned Areas:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {employee.superEmployeeDetails.assignedAreas.map((area: any, areaIndex: number) => (
                                      <span 
                                        key={areaIndex} 
                                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                      >
                                        {area.areaName} ({area.areaCode})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No super employees found in the specified area</p>
                    </div>
                  )}
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
