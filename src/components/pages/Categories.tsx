import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Tag,
  Grid3X3,
  List,
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { apiService } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../Toast';
import ConfirmModal from '../ConfirmModal';
import SubCategories from './SubCategories';

interface Category {
  _id: string;
  name: string;
  icon?: string;
  description: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  vendorCount: number;
  subCategoryCount: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 1,
    metaTitle: '',
    metaDescription: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingIcon, setExistingIcon] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryName: string;
  }>({
    isOpen: false,
    categoryId: null,
    categoryName: ''
  });
  const [selectedMainCategory, setSelectedMainCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Intersection Observer ref
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Toast hook
  const { addToast } = useToast();

  // API hooks
  const { loading, error, execute: fetchCategories } = useApi({
    onSuccess: (data) => {
      if (currentPage === 1) {
        setCategories(data.data || []);
        setFilteredCategories(data.data || []);
      } else {
        setCategories(prev => [...prev, ...(data.data || [])]);
        setFilteredCategories(prev => [...prev, ...(data.data || [])]);
      }
      setTotalItems(data.pagination?.totalItems || 0);
      setHasMore((data.data || []).length === itemsPerPage);
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error || 'Failed to load categories. Please refresh the page.'
      });
    }
  });

  const { loading: saveLoading, execute: saveCategory } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: modalMode === 'add' ? 'Category Created' : 'Category Updated',
        message: modalMode === 'add' 
          ? 'The category has been successfully created.'
          : 'The category has been successfully updated.'
      });
      setShowModal(false);
      fetchCategories(() => apiService.getCategories());
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: modalMode === 'add' ? 'Create Failed' : 'Update Failed',
        message: error || `Failed to ${modalMode === 'add' ? 'create' : 'update'} category. Please try again.`
      });
    }
  });

  const { loading: deleteLoading, execute: deleteCategory } = useApi({
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'Category Deleted',
        message: 'The category has been successfully deleted.'
      });
      fetchCategories(() => apiService.getCategories());
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error || 'Failed to delete category. Please try again.'
      });
    }
  });

  // Load categories on component mount
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchCategories(() => apiService.getCategories(1, itemsPerPage));
  }, []);

  // Load more categories when page changes
  useEffect(() => {
    if (currentPage > 1) {
      setIsLoadingMore(true);
      fetchCategories(() => apiService.getCategories(currentPage, itemsPerPage))
        .finally(() => setIsLoadingMore(false));
    }
  }, [currentPage]);

  // Filter categories based on search and status
  useEffect(() => {
    let filtered = categories;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(category =>
        statusFilter === 'active' ? category.isActive : !category.isActive
      );
    }

    setFilteredCategories(filtered);
  }, [categories, searchTerm, statusFilter]);

  // Intersection Observer for infinite scroll
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || isLoadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setCurrentPage(prev => prev + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, isLoadingMore, hasMore]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setCategories([]);
    setFilteredCategories([]);
    fetchCategories(() => apiService.getCategories(1, itemsPerPage));
  }, [searchTerm, statusFilter]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Open modal for add/edit/view
  const openModal = (mode: 'add' | 'edit' | 'view', category?: Category) => {
    setModalMode(mode);
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        sortOrder: 1,
        metaTitle: '',
        metaDescription: ''
      });
    }
    // Clear file selection when opening modal
    clearFileSelection();
    if (category?.icon) {
      setExistingIcon(category.icon);
    } else {
      setExistingIcon(null);
    }
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create FormData for file upload (both add and edit)
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('sortOrder', formData.sortOrder.toString());
    formDataToSend.append('metaTitle', formData.metaTitle);
    formDataToSend.append('metaDescription', formData.metaDescription);
    
    if (selectedFile) {
      formDataToSend.append('icon', selectedFile);
    }
    
    if (modalMode === 'add') {
      await saveCategory(() => apiService.createCategory(formDataToSend));
    } else if (modalMode === 'edit' && selectedCategory) {
      await saveCategory(() => apiService.updateCategory(selectedCategory._id, formDataToSend));
    }
  };

  // Handle category deletion
  const handleDelete = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    const categoryName = category?.name || 'this category';
    
    setDeleteModal({
      isOpen: true,
      categoryId,
      categoryName
    });
  };

  // Confirm category deletion
  const confirmDelete = async () => {
    if (deleteModal.categoryId) {
      await deleteCategory(() => apiService.deleteCategory(deleteModal.categoryId!));
      setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
  };

  // Handle go to sub categories
  const handleGoToSubCategories = (category: Category) => {
    setSelectedMainCategory({
      id: category._id,
      name: category.name
    });
  };

  // Handle back from sub categories
  const handleBackFromSubCategories = () => {
    setSelectedMainCategory(null);
  };



  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExistingIcon(null);
  };

  // Show subcategories view if a main category is selected
  if (selectedMainCategory) {
    return (
      <SubCategories
        mainCategoryId={selectedMainCategory.id}
        mainCategoryName={selectedMainCategory.name}
        onBack={handleBackFromSubCategories}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-600 mt-2">Manage product categories and subcategories</p>
        </div>
        
        <button
          onClick={() => openModal('add')}
          className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
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
                placeholder="Search categories..."
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

      {/* Pagination Info */}
      {filteredCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredCategories.length} of {totalItems} categories
            </span>
            <span>
              Page {currentPage} • {itemsPerPage} items per page
            </span>
          </div>
        </div>
      )}

      {/* Categories Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first category'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => openModal('add')}
              className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600"
            >
              Add Category
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredCategories.map((category, index) => (
            <div
              key={category._id}
              ref={index === filteredCategories.length - 1 ? lastElementRef : null}
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
                         {category.icon ? (
                           <img 
                             src={category.icon} 
                             alt={category.name}
                             className="w-5 h-5 object-cover rounded"
                           />
                         ) : (
                           <Tag className="w-5 h-5 text-sky-600" />
                         )}
                       </div>
                       <div>
                         <h3 className="font-semibold text-gray-800">{category.name}</h3>
                         <p className="text-sm text-gray-500">{category.slug}</p>
                       </div>
                     </div>
                    <div className="flex items-center space-x-1">
                      {category.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">{category.description}</p>

                                     <div className="flex items-center justify-between text-sm text-gray-500">
                     <span>{category.vendorCount} vendors</span>
                     <span>{category.subCategoryCount} subcategories</span>
                   </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      Created: {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGoToSubCategories(category)}
                        className="px-2 py-1 text-xs bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition-colors"
                        title="Go to Sub Categories"
                      >
                        Sub Categories
                      </button>
                      <button
                        onClick={() => openModal('view', category)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('edit', category)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
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
                       {category.icon ? (
                         <img 
                           src={category.icon} 
                           alt={category.name}
                           className="w-5 h-5 object-cover rounded"
                         />
                       ) : (
                         <Tag className="w-5 h-5 text-sky-600" />
                       )}
                     </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                                         <div className="text-sm text-gray-500">
                       {category.vendorCount} vendors
                     </div>
                    <div className="flex items-center space-x-1">
                      {category.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" /> 
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleGoToSubCategories(category)}
                      className="px-2 py-1 text-xs bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition-colors"
                      title="Go to Sub Categories"
                    >
                      Sub Categories
                    </button>
                    <button
                      onClick={() => openModal('view', category)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal('edit', category)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {/* Loading indicator for infinite scroll */}
          {isLoadingMore && (
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="flex items-center space-x-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more categories...</span>
              </div>
            </div>
          )}
          
          {/* End of results indicator */}
          {!hasMore && filteredCategories.length > 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">You've reached the end of all categories</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {modalMode === 'add' ? 'Add Category' : 
                   modalMode === 'edit' ? 'Edit Category' : 'View Category'}
                </h2>
                                 <button
                   onClick={() => {
                     setShowModal(false);
                     clearFileSelection();
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
                       Category Name
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
                       Category Icon
                     </label>
                     <div className="space-y-2">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={handleFileChange}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                       />
                       <p className="text-xs text-gray-500">
                         Supported formats: JPG, PNG, GIF. Max size: 5MB
                       </p>
                     </div>
                     
                     {/* File Preview */}
                     {(previewUrl || existingIcon) && (
                       <div className="mt-2">
                         <div className="relative inline-block">
                           <img
                             src={previewUrl || existingIcon || ''}
                             alt="Preview"
                             className="w-16 h-16 object-cover rounded-lg border"
                           />
                           {previewUrl && (
                             <button
                               type="button"
                               onClick={clearFileSelection}
                               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                             >
                               ×
                             </button>
                           )}
                         </div>
                       </div>
                     )}
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



                                     <div className="flex items-center justify-end space-x-3 pt-4">
                     <button
                       type="button"
                       onClick={() => {
                         setShowModal(false);
                         clearFileSelection();
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
                    <p className="text-gray-900">{selectedCategory?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <p className="text-gray-900">{selectedCategory?.slug}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900">{selectedCategory?.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedCategory?.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedCategory?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                                                        <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Vendors</label>
                     <p className="text-gray-900">{selectedCategory?.vendorCount}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Sub Categories</label>
                     <p className="text-gray-900">{selectedCategory?.subCategoryCount}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                     <p className="text-gray-900">{selectedCategory?.sortOrder}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                     <p className="text-gray-900">{selectedCategory?.metaTitle}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                     <p className="text-gray-900">{selectedCategory?.metaDescription}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                     <p className="text-gray-900">
                       {selectedCategory?.createdAt ? new Date(selectedCategory.createdAt).toLocaleDateString() : 'N/A'}
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
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteModal.categoryName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default Categories; 