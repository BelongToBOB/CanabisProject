import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useApiError } from '../hooks/useApiError';
import LoadingSpinner from '../components/LoadingSpinner';

interface Batch {
  id: number;
  batchIdentifier: string;
  productName: string;
  purchaseDate: string;
  purchasePricePerUnit: number;
  initialQuantity: number;
  currentQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface BatchFormData {
  batchIdentifier: string;
  productName: string;
  purchaseDate: string;
  purchasePricePerUnit: string;
  initialQuantity: string;
}

const BatchManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const { handleError } = useApiError();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [productNameFilter, setProductNameFilter] = useState('');
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<BatchFormData>({
    batchIdentifier: '',
    productName: '',
    purchaseDate: '',
    purchasePricePerUnit: '',
    initialQuantity: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Detail view state
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
  // Delete confirmation state
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);

  // Fetch batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

  // Apply filter when batches or filter changes
  useEffect(() => {
    if (productNameFilter.trim() === '') {
      setFilteredBatches(batches);
    } else {
      const filtered = batches.filter(batch =>
        batch.productName.toLowerCase().includes(productNameFilter.toLowerCase())
      );
      setFilteredBatches(filtered);
    }
  }, [batches, productNameFilter]);

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<Batch[]>('/batches');
      setBatches(response.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch batches';
      setError(errorMsg);
      handleError(err, 'Failed to fetch batches');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.batchIdentifier.trim()) {
      errors.batchIdentifier = 'Batch identifier is required';
    }
    
    if (!formData.productName.trim()) {
      errors.productName = 'Product name is required';
    }
    
    if (!formData.purchaseDate) {
      errors.purchaseDate = 'Purchase date is required';
    }
    
    if (!formData.purchasePricePerUnit) {
      errors.purchasePricePerUnit = 'Purchase price is required';
    } else {
      const price = parseFloat(formData.purchasePricePerUnit);
      if (isNaN(price) || price < 0) {
        errors.purchasePricePerUnit = 'Purchase price must be a non-negative number';
      }
    }
    
    if (!formData.initialQuantity) {
      errors.initialQuantity = 'Initial quantity is required';
    } else {
      const quantity = parseInt(formData.initialQuantity, 10);
      if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        errors.initialQuantity = 'Initial quantity must be a positive integer';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the validation errors');
      return;
    }

    try {
      setError(null);
      const batchData = {
        batchIdentifier: formData.batchIdentifier,
        productName: formData.productName,
        purchaseDate: formData.purchaseDate,
        purchasePricePerUnit: parseFloat(formData.purchasePricePerUnit),
        initialQuantity: parseInt(formData.initialQuantity, 10),
      };
      
      await apiClient.post('/batches', batchData);
      showSuccess('Batch created successfully');
      setShowCreateForm(false);
      resetForm();
      fetchBatches();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create batch';
      setError(errorMsg);
      handleError(err, 'Failed to create batch');
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;

    try {
      setError(null);
      await apiClient.delete(`/batches/${batchToDelete.id}`);
      showSuccess('Batch deleted successfully');
      setBatchToDelete(null);
      setSelectedBatch(null);
      fetchBatches();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete batch';
      setError(errorMessage);
      handleError(err, 'Failed to delete batch');
      setBatchToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      batchIdentifier: '',
      productName: '',
      purchaseDate: '',
      purchasePricePerUnit: '',
      initialQuantity: '',
    });
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading batches..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">รายการสินค้า</h1>
              <p className="mt-2 text-gray-600">
                จัดการล็อตสินค้าคงคลังกัญชา
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setSelectedBatch(null);
                resetForm();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {showCreateForm ? 'ยกเลิก' : 'สร้างสินค้าใหม่'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Create Batch Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Batch</h2>
              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="batchIdentifier" className="block text-sm font-medium text-gray-700">
                      รหัสสินค้า
                    </label>
                    <input
                      type="text"
                      id="batchIdentifier"
                      name="batchIdentifier"
                      value={formData.batchIdentifier}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border ${
                        formErrors.batchIdentifier ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="191268 (ตามวันที่)"
                    />
                    {formErrors.batchIdentifier && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.batchIdentifier}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
                      ชื่อสินค้า
                    </label>
                    <input
                      type="text"
                      id="productName"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border ${
                        formErrors.productName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="กรอกชื่อสินค้า"
                    />
                    {formErrors.productName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.productName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">
                      วันที่ซื้อ
                    </label>
                    <input
                      type="date"
                      id="purchaseDate"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border ${
                        formErrors.purchaseDate ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    />
                    {formErrors.purchaseDate && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.purchaseDate}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="purchasePricePerUnit" className="block text-sm font-medium text-gray-700">
                      ราคา/ขีด
                    </label>
                    <input
                      type="number"
                      id="purchasePricePerUnit"
                      name="purchasePricePerUnit"
                      value={formData.purchasePricePerUnit}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`mt-1 block w-full px-3 py-2 border ${
                        formErrors.purchasePricePerUnit ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="0.00"
                    />
                    {formErrors.purchasePricePerUnit && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.purchasePricePerUnit}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="initialQuantity" className="block text-sm font-medium text-gray-700">
                      จำนวนที่ซื้อ
                    </label>
                    <input
                      type="number"
                      id="initialQuantity"
                      name="initialQuantity"
                      value={formData.initialQuantity}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      className={`mt-1 block w-full px-3 py-2 border ${
                        formErrors.initialQuantity ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="0"
                    />
                    {formErrors.initialQuantity && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.initialQuantity}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    เพิ่มสินค้า
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter Section */}
          <div className="mb-6">
            <label htmlFor="productNameFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Product Name
            </label>
            <input
              type="text"
              id="productNameFilter"
              value={productNameFilter}
              onChange={(e) => setProductNameFilter(e.target.value)}
              className="block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by product name..."
            />
          </div>

          {/* Batches Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initial Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      {productNameFilter ? 'No batches found matching the filter' : 'No batches found'}
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {batch.batchIdentifier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {batch.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={batch.currentQuantity === 0 ? 'text-red-600 font-semibold' : ''}>
                          {batch.currentQuantity}
                          {batch.currentQuantity === 0 && ' (Depleted)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {batch.initialQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(batch.purchasePricePerUnit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(batch.purchaseDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedBatch(batch)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setBatchToDelete(batch)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Batch Details
              </h3>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Batch Identifier</p>
                  <p className="mt-1 text-lg text-gray-900">{selectedBatch.batchIdentifier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Product Name</p>
                  <p className="mt-1 text-lg text-gray-900">{selectedBatch.productName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Quantity</p>
                  <p className={`mt-1 text-lg ${selectedBatch.currentQuantity === 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                    {selectedBatch.currentQuantity} units
                    {selectedBatch.currentQuantity === 0 && ' (Depleted)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Initial Quantity</p>
                  <p className="mt-1 text-lg text-gray-900">{selectedBatch.initialQuantity} units</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Purchase Price Per Unit</p>
                  <p className="mt-1 text-lg text-gray-900">{formatCurrency(selectedBatch.purchasePricePerUnit)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Purchase Date</p>
                  <p className="mt-1 text-lg text-gray-900">{formatDate(selectedBatch.purchaseDate)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Purchase Value</p>
                    <p className="mt-1 text-lg text-gray-900">
                      {formatCurrency(selectedBatch.purchasePricePerUnit * selectedBatch.initialQuantity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Remaining Value</p>
                    <p className="mt-1 text-lg text-gray-900">
                      {formatCurrency(selectedBatch.purchasePricePerUnit * selectedBatch.currentQuantity)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Units Sold</p>
                    <p className="mt-1 text-lg text-gray-900">
                      {selectedBatch.initialQuantity - selectedBatch.currentQuantity} units
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Inventory Status</p>
                    <p className="mt-1 text-lg">
                      <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                        selectedBatch.currentQuantity === 0
                          ? 'bg-red-100 text-red-800'
                          : selectedBatch.currentQuantity < selectedBatch.initialQuantity * 0.2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedBatch.currentQuantity === 0
                          ? 'Depleted'
                          : selectedBatch.currentQuantity < selectedBatch.initialQuantity * 0.2
                          ? 'Low Stock'
                          : 'In Stock'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedBatch.createdAt).toLocaleString()}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedBatch.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {batchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete batch <strong>{batchToDelete.batchIdentifier}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. Note: Batches referenced by sales orders cannot be deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setBatchToDelete(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBatch}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
