import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

interface Batch {
  id: number;
  batchIdentifier: string;
  productName: string;
  currentQuantity: number;
  purchasePricePerUnit: number;
}

interface LineItem {
  id: string; // Temporary ID for React key
  batchId: string;
  quantitySold: string;
  sellingPricePerUnit: string;
}

interface LineItemError {
  batchId?: string;
  quantitySold?: string;
  sellingPricePerUnit?: string;
}

const SalesOrderCreate: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), batchId: '', quantitySold: '', sellingPricePerUnit: '' }
  ]);
  const [lineItemErrors, setLineItemErrors] = useState<Record<string, LineItemError>>({});

  // Fetch batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setIsLoadingBatches(true);
      setError(null);
      const response = await apiClient.get<Batch[]>('/batches');
      // Filter out depleted batches (currentQuantity > 0)
      const availableBatches = response.data.filter(batch => batch.currentQuantity > 0);
      setBatches(availableBatches);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch batches');
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), batchId: '', quantitySold: '', sellingPricePerUnit: '' }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
      // Remove errors for this line item
      setLineItemErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
    // Clear error for this field when user starts typing
    if (lineItemErrors[id]?.[field as keyof LineItemError]) {
      setLineItemErrors(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: undefined
        }
      }));
    }
  };

  const getBatchById = (batchId: string): Batch | undefined => {
    return batches.find(b => b.id === parseInt(batchId, 10));
  };

  const calculateLineProfit = (item: LineItem): number => {
    const batch = getBatchById(item.batchId);
    if (!batch || !item.quantitySold || !item.sellingPricePerUnit) {
      return 0;
    }
    const quantity = parseInt(item.quantitySold, 10);
    const sellingPrice = parseFloat(item.sellingPricePerUnit);
    if (isNaN(quantity) || isNaN(sellingPrice)) {
      return 0;
    }
    return (sellingPrice - batch.purchasePricePerUnit) * quantity;
  };

  const calculateTotalProfit = (): number => {
    return lineItems.reduce((total, item) => total + calculateLineProfit(item), 0);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, LineItemError> = {};
    let isValid = true;

    lineItems.forEach(item => {
      const itemErrors: LineItemError = {};

      // Validate batch selection
      if (!item.batchId) {
        itemErrors.batchId = 'Please select a batch';
        isValid = false;
      } else {
        const batch = getBatchById(item.batchId);
        if (!batch) {
          itemErrors.batchId = 'Selected batch does not exist';
          isValid = false;
        }
      }

      // Validate quantity sold
      if (!item.quantitySold) {
        itemErrors.quantitySold = 'Quantity is required';
        isValid = false;
      } else {
        const quantity = parseInt(item.quantitySold, 10);
        if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
          itemErrors.quantitySold = 'Quantity must be a positive integer';
          isValid = false;
        } else {
          const batch = getBatchById(item.batchId);
          if (batch && quantity > batch.currentQuantity) {
            itemErrors.quantitySold = `Insufficient stock (available: ${batch.currentQuantity})`;
            isValid = false;
          }
        }
      }

      // Validate selling price
      if (!item.sellingPricePerUnit) {
        itemErrors.sellingPricePerUnit = 'Selling price is required';
        isValid = false;
      } else {
        const price = parseFloat(item.sellingPricePerUnit);
        if (isNaN(price) || price < 0) {
          itemErrors.sellingPricePerUnit = 'Selling price must be a non-negative number';
          isValid = false;
        }
      }

      if (Object.keys(itemErrors).length > 0) {
        errors[item.id] = itemErrors;
      }
    });

    setLineItemErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const orderData = {
        customerName: customerName.trim() || undefined,
        lineItems: lineItems.map(item => ({
          batchId: parseInt(item.batchId, 10),
          quantitySold: parseInt(item.quantitySold, 10),
          sellingPricePerUnit: parseFloat(item.sellingPricePerUnit)
        }))
      };

      await apiClient.post('/sales-orders', orderData);
      setSuccessMessage('Sales order created successfully!');
      
      // Reset form
      setCustomerName('');
      setLineItems([
        { id: crypto.randomUUID(), batchId: '', quantitySold: '', sellingPricePerUnit: '' }
      ]);
      setLineItemErrors({});
      
      // Refresh batches to get updated quantities
      fetchBatches();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create sales order';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `฿${amount.toFixed(2)}`;
  };

  if (isLoadingBatches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">สร้างใบสั่งขาย</h1>
              <p className="mt-2 text-gray-600">
                บันทึกรายการขายใหม่
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              กลับไป Dashboard
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* No Batches Warning */}
          {batches.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                ไม่พบสินค้าในสต็อก โปรดเพิ่มสินค้าคงคลังก่อนสร้างใบสั่งขาย
              </p>
            </div>
          )}

          {/* Sales Order Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                ชื่อลูกค้า (ไม่บังคับ)
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 block w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name"
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">รายการขาย</h2>
                <button
                  type="button"
                  onClick={addLineItem}
                  disabled={batches.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  เพิ่มรายการขาย
                </button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, index) => {
                  const batch = getBatchById(item.batchId);
                  const lineProfit = calculateLineProfit(item);
                  const itemErrors = lineItemErrors[item.id] || {};

                  return (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          รายการ {index + 1}
                        </h3>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            นำออก
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Batch Selection */}
                        <div>
                          <label htmlFor={`batch-${item.id}`} className="block text-sm font-medium text-gray-700">
                            สินค้า *
                          </label>
                          <select
                            id={`batch-${item.id}`}
                            value={item.batchId}
                            onChange={(e) => updateLineItem(item.id, 'batchId', e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 border ${
                              itemErrors.batchId ? 'border-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                          >
                            <option value="">เลือกสินค้า</option>
                            {batches.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.batchIdentifier} - {b.productName} (Qty: {b.currentQuantity})
                              </option>
                            ))}
                          </select>
                          {itemErrors.batchId && (
                            <p className="mt-1 text-sm text-red-600">{itemErrors.batchId}</p>
                          )}
                          {batch && (
                            <p className="mt-1 text-sm text-gray-600">
                              Available: {batch.currentQuantity} units | Cost: {formatCurrency(batch.purchasePricePerUnit)}/unit
                            </p>
                          )}
                        </div>

                        {/* Quantity Sold */}
                        <div>
                          <label htmlFor={`quantity-${item.id}`} className="block text-sm font-medium text-gray-700">
                            จำนวน *
                          </label>
                          <input
                            type="number"
                            id={`quantity-${item.id}`}
                            value={item.quantitySold}
                            onChange={(e) => updateLineItem(item.id, 'quantitySold', e.target.value)}
                            min="1"
                            step="1"
                            className={`mt-1 block w-full px-3 py-2 border ${
                              itemErrors.quantitySold ? 'border-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="0"
                          />
                          {itemErrors.quantitySold && (
                            <p className="mt-1 text-sm text-red-600">{itemErrors.quantitySold}</p>
                          )}
                        </div>

                        {/* Selling Price */}
                        <div>
                          <label htmlFor={`price-${item.id}`} className="block text-sm font-medium text-gray-700">
                            ราคาขาย (฿/ขีด) *
                          </label>
                          <input
                            type="number"
                            id={`price-${item.id}`}
                            value={item.sellingPricePerUnit}
                            onChange={(e) => updateLineItem(item.id, 'sellingPricePerUnit', e.target.value)}
                            step="0.01"
                            min="0"
                            className={`mt-1 block w-full px-3 py-2 border ${
                              itemErrors.sellingPricePerUnit ? 'border-red-300' : 'border-gray-300'
                            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="0.00"
                          />
                          {itemErrors.sellingPricePerUnit && (
                            <p className="mt-1 text-sm text-red-600">{itemErrors.sellingPricePerUnit}</p>
                          )}
                        </div>
                      </div>

                      {/* Line Item Profit Preview */}
                      {item.batchId && item.quantitySold && item.sellingPricePerUnit && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm font-medium text-blue-900">
                            Line Profit: <span className={lineProfit >= 0 ? 'text-green-700' : 'text-red-700'}>
                              {formatCurrency(lineProfit)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Profit Preview */}
            <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-900">
                  กำไรการสั่งซื้อทั้งหมด:
                </h3>
                <p className={`text-2xl font-bold ${
                  calculateTotalProfit() >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(calculateTotalProfit())}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || batches.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Creating Order...' : 'สร้างใบสั่งขาย'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderCreate;
