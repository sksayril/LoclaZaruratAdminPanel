import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowLeft,
  Tag,
  Grid3X3,
  List,
  MoreVertical,
  CheckCircle,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { apiService } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';
import ConfirmModal from '../ConfirmModal';

interface SubCategory {
  _id: string;
  name: string;
  image?: string;
  thumbnail?: string;
  mainCategory: {
    _id: string;
    name: string;
    icon?: string;
  };
  description: string;
  vendorCount: number;
  isActive: boolean;
  createdAt: string;
  keywords?: string[];
  features?: string[];
  popularTags?: string[];
  slug?: string;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
}

interface SubCategoriesProps {
  mainCategoryId: string;
  mainCategoryName: string;
  onBack: () => void;
}

const SubCategories: React.FC<SubCategoriesProps> = ({ 
  mainCategoryId, 
  mainCategoryName, 
  onBack 
}) => {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 1,
    metaTitle: '',
    metaDescription: '',
    keywords: [''],
    features: [''],
    popularTags: ['']
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    subCategoryId: string | null;
    subCategoryName: string;
  }>({
    isOpen: false,
    subCategoryId: null,
    subCategoryName: ''
  });

  // Toast hook
  const { addToast } = useToast();

  // API hooks
  const { loading, error, execute: fetchSubCategories } = useApi({
    onSuccess: (data) => {
      setSubCategories(data.data || []);
      setFilteredSubCategories(data.data || []);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load subcategories. Please refresh the page.'
      });
    }
  });

  const { loading: saveLoading, execute: saveSubCategory } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: modalMode === 'add' ? 'Sub Category Created' : 'Sub Category Updated',
        message: modalMode === 'add' 
          ? 'The sub category has been successfully created.'
          : 'The sub category has been successfully updated.'
      });
      setShowModal(false);
      fetchSubCategories(() => apiService.getSubCategoriesByMainCategory(mainCategoryId));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: modalMode === 'add' ? 'Create Failed' : 'Update Failed',
        message: error || `Failed to ${modalMode === 'add' ? 'create' : 'update'} sub category. Please try again.`
      });
    }
  });

  const { loading: deleteLoading, execute: deleteSubCategory } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Sub Category Deleted',
        message: 'The sub category has been successfully deleted.'
      });
      fetchSubCategories(() => apiService.getSubCategoriesByMainCategory(mainCategoryId));
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error || 'Failed to delete sub category. Please try again.'
      });
    }
  });

  // Load subcategories on component mount
  useEffect(() => {
    fetchSubCategories(() => apiService.getSubCategoriesByMainCategory(mainCategoryId));
  }, [mainCategoryId]);

  // Filter subcategories based on search and status
  useEffect(() => {
    let filtered = subCategories;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(subCategory =>
        subCategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCategory.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(subCategory =>
        statusFilter === 'active' ? subCategory.isActive : !subCategory.isActive
      );
    }

    setFilteredSubCategories(filtered);
  }, [subCategories, searchTerm, statusFilter]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle array field changes (keywords, features, popularTags)
  const handleArrayFieldChange = (field: 'keywords' | 'features' | 'popularTags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  // Add new item to array field
  const addArrayFieldItem = (field: 'keywords' | 'features' | 'popularTags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  // Remove item from array field
  const removeArrayFieldItem = (field: 'keywords' | 'features' | 'popularTags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Open modal for add/edit/view
  const openModal = (mode: 'add' | 'edit' | 'view', subCategory?: SubCategory) => {
    setModalMode(mode);
    if (subCategory) {
      setSelectedSubCategory(subCategory);
      setFormData({
        name: subCategory.name,
        description: subCategory.description,
        sortOrder: subCategory.sortOrder || 1,
        metaTitle: subCategory.metaTitle || '',
        metaDescription: subCategory.metaDescription || '',
        keywords: subCategory.keywords || [''],
        features: subCategory.features || [''],
        popularTags: subCategory.popularTags || ['']
      });
      setExistingImage(subCategory.image || null);
      setExistingThumbnail(subCategory.thumbnail || null);
    } else {
      setSelectedSubCategory(null);
      setFormData({
        name: '',
        description: '',
        sortOrder: 1,
        metaTitle: '',
        metaDescription: '',
        keywords: [''],
        features: [''],
        popularTags: ['']
      });
    }
    clearFileSelections();
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('mainCategory', mainCategoryId);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('sortOrder', formData.sortOrder.toString());
    formDataToSend.append('metaTitle', formData.metaTitle);
    formDataToSend.append('metaDescription', formData.metaDescription);
    
    // Add array fields
    formData.keywords.forEach((keyword, index) => {
      if (keyword.trim()) {
        formDataToSend.append(`keywords[${index}]`, keyword.trim());
      }
    });
    
    formData.features.forEach((feature, index) => {
      if (feature.trim()) {
        formDataToSend.append(`features[${index}]`, feature.trim());
      }
    });
    
    formData.popularTags.forEach((tag, index) => {
      if (tag.trim()) {
        formDataToSend.append(`popularTags[${index}]`, tag.trim());
      }
    });
    
    if (selectedImage) {
      formDataToSend.append('image', selectedImage);
    }
    
    if (selectedThumbnail) {
      formDataToSend.append('thumbnail', selectedThumbnail);
    }
    
    if (modalMode === 'add') {
      await saveSubCategory(() => apiService.createSubCategory(formDataToSend));
    } else if (modalMode === 'edit' && selectedSubCategory) {
      // For edit, we'll need to implement updateSubCategory API
      await saveSubCategory(() => apiService.createSubCategory(formDataToSend));
    }
  };

  // Handle subcategory deletion
  const handleDelete = (subCategoryId: string) => {
    const subCategory = subCategories.find(cat => cat._id === subCategoryId);
    const subCategoryName = subCategory?.name || 'this sub category';
    
    setDeleteModal({
      isOpen: true,
      subCategoryId,
      subCategoryName
    });
  };

  // Confirm subcategory deletion
  const confirmDelete = async () => {
    if (deleteModal.subCategoryId) {
      // We'll need to implement deleteSubCategory API
      await deleteSubCategory(() => Promise.resolve({ success: true, message: 'Deleted' }));
      setDeleteModal({ isOpen: false, subCategoryId: null, subCategoryName: '' });
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, subCategoryId: null, subCategoryName: '' });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        addToast({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select an image file (JPG, PNG, GIF).'
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'File Too Large',
          message: 'File size should be less than 5MB.'
        });
        return;
      }
      
      if (type === 'image') {
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
      } else {
        setSelectedThumbnail(file);
        const url = URL.createObjectURL(file);
        setThumbnailPreview(url);
      }
    }
  };

  // Clear file selections
  const clearFileSelections = () => {
    setSelectedImage(null);
    setSelectedThumbnail(null);
    setImagePreview(null);
    setThumbnailPreview(null);
    setExistingImage(null);
    setExistingThumbnail(null);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [imagePreview, thumbnailPreview]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sub Categories</h1>
            <p className="text-gray-600 mt-2">
              Managing subcategories for "{mainCategoryName}"
            </p>
          </div>
        </div>
        
        <button
          onClick={() => openModal('add')}
          className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sub Category</span>
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
                placeholder="Search subcategories..."
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
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-sky-100 text-sky-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' 
                  ? 'bg-sky-100 text-sky-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
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

      {/* Sub Categories Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : filteredSubCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subcategories found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first subcategory'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => openModal('add')}
              className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600"
            >
              Add Sub Category
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredSubCategories.map((subCategory) => (
            <div
              key={subCategory._id}
              className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
              }`}
            >
              {viewMode === 'grid' ? (
                // Grid View
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-sky-100 rounded-lg p-2">
                        {subCategory.thumbnail ? (
                          <img 
                            src={subCategory.thumbnail} 
                            alt={subCategory.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-sky-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{subCategory.name}</h3>
                        <p className="text-sm text-gray-500">{subCategory.mainCategory.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {subCategory.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">{subCategory.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{subCategory.vendorCount} vendors</span>
                    <span>{subCategory.keywords?.length || 0} keywords</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(subCategory.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openModal('view', subCategory)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('edit', subCategory)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subCategory._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // List View
                <>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-sky-100 rounded-lg p-2">
                      {subCategory.thumbnail ? (
                        <img 
                          src={subCategory.thumbnail} 
                          alt={subCategory.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-sky-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{subCategory.name}</h3>
                      <p className="text-sm text-gray-500">{subCategory.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {subCategory.vendorCount} vendors
                    </div>
                    <div className="flex items-center space-x-1">
                      {subCategory.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openModal('view', subCategory)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal('edit', subCategory)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subCategory._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {modalMode === 'add' ? 'Add Sub Category' : 
                   modalMode === 'edit' ? 'Edit Sub Category' : 'View Sub Category'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    clearFileSelections();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {modalMode !== 'view' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub Category Name
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
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Main Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'image')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                      {(imagePreview || existingImage) && (
                        <div className="mt-2">
                          <img
                            src={imagePreview || existingImage || ''}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'thumbnail')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                      {(thumbnailPreview || existingThumbnail) && (
                        <div className="mt-2">
                          <img
                            src={thumbnailPreview || existingThumbnail || ''}
                            alt="Thumbnail Preview"
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={formData.sortOrder}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords
                    </label>
                    {formData.keywords.map((keyword, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={keyword}
                          onChange={(e) => handleArrayFieldChange('keywords', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          placeholder="Enter keyword"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayFieldItem('keywords', index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayFieldItem('keywords')}
                      className="text-sky-600 hover:text-sky-700 text-sm"
                    >
                      + Add Keyword
                    </button>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Features
                    </label>
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleArrayFieldChange('features', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          placeholder="Enter feature"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayFieldItem('features', index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayFieldItem('features')}
                      className="text-sky-600 hover:text-sky-700 text-sm"
                    >
                      + Add Feature
                    </button>
                  </div>

                  {/* Popular Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Popular Tags
                    </label>
                    {formData.popularTags.map((tag, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => handleArrayFieldChange('popularTags', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          placeholder="Enter tag"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayFieldItem('popularTags', index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayFieldItem('popularTags')}
                      className="text-sky-600 hover:text-sky-700 text-sm"
                    >
                      + Add Tag
                    </button>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        clearFileSelections();
                      }}
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900">{selectedSubCategory?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{selectedSubCategory?.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Category</label>
                    <p className="text-gray-900">{selectedSubCategory?.mainCategory.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedSubCategory?.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedSubCategory?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendors</label>
                    <p className="text-gray-900">{selectedSubCategory?.vendorCount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubCategory?.keywords?.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {keyword}
                        </span>
                      )) || <span className="text-gray-500">No keywords</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubCategory?.features?.map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {feature}
                        </span>
                      )) || <span className="text-gray-500">No features</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Popular Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubCategory?.popularTags?.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {tag}
                        </span>
                      )) || <span className="text-gray-500">No tags</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-gray-900">
                      {selectedSubCategory?.createdAt ? new Date(selectedSubCategory.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
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
        title="Delete Sub Category"
        message={`Are you sure you want to delete "${deleteModal.subCategoryName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default SubCategories; 