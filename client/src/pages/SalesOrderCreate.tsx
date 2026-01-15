import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

interface Batch {
  id: number;
  batchIdentifier: string;
  productName: string;
  currentQuantity: number;
  purchasePricePerUnit: number;
  defaultSellingPricePerUnit: number;
}

interface LineItem {
  id: string; // Temporary ID for React key
  batchId: string;
  quantitySold: string;
  sellingPricePerUnit: string;
  discountType: 'NONE' | 'PERCENT' | 'AMOUNT';
  discountValue: string;
}

interface LineItemError {
  batchId?: string;
  quantitySold?: string;
  sellingPricePerUnit?: string;
  discountValue?: string;
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
    { id: crypto.randomUUID(), batchId: '', quantitySold: '', sellingPricePerUnit: '', discountType: 'NONE', discountValue: '0' }
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
      // Use the dedicated endpoint for available batches (accessible by both ADMIN and STAFF)
      const response = await apiClient.get<Batch[]>('/batches/available');
      // The backend already filters for currentQuantity > 0, so no need to filter here
      setBatches(response.data);
    } catch (err: any) {
      // Show detailed error message from server
      let errorMessage = 'ไม่สามารถดึงข้อมูลสินค้าได้';
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          errorMessage = 'ต้องการการยืนยันตัวตน กรุณาเข้าสู่ระบบอีกครั้ง';
        } else if (err.response.status === 403) {
          errorMessage = 'การเข้าถึงถูกปฏิเสธ คุณไม่มีสิทธิ์ดูสินค้า';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'ข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อของคุณ';
      } else {
        // Something else happened
        errorMessage = err.message || 'ไม่สามารถดึงข้อมูลสินค้าได้';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), batchId: '', quantitySold: '', sellingPricePerUnit: '', discountType: 'NONE', discountValue: '0' }
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
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-fill selling price when batch is selected
        if (field === 'batchId' && value) {
          const batch = batches.find(b => b.id === parseInt(value, 10));
          if (batch && batch.defaultSellingPricePerUnit > 0) {
            updatedItem.sellingPricePerUnit = batch.defaultSellingPricePerUnit.toString();
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
    
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

  const calculateFinalPrice = (item: LineItem): number => {
    const sellingPrice = parseFloat(item.sellingPricePerUnit);
    if (isNaN(sellingPrice)) return 0;

    const discountValue = parseFloat(item.discountValue) || 0;
    
    if (item.discountType === 'PERCENT') {
      return sellingPrice * (1 - discountValue / 100);
    } else if (item.discountType === 'AMOUNT') {
      return Math.max(0, sellingPrice - discountValue);
    }
    return sellingPrice;
  };

  const calculateLineProfit = (item: LineItem): number => {
    const batch = getBatchById(item.batchId);
    if (!batch || !item.quantitySold) {
      return 0;
    }
    const quantity = parseInt(item.quantitySold, 10);
    if (isNaN(quantity)) {
      return 0;
    }
    const finalPrice = calculateFinalPrice(item);
    return (finalPrice - batch.purchasePricePerUnit) * quantity;
  };

  const calculateLineSubtotal = (item: LineItem): number => {
    const quantity = parseInt(item.quantitySold, 10);
    if (isNaN(quantity)) return 0;
    return calculateFinalPrice(item) * quantity;
  };

  const calculateTotalProfit = (): number => {
    return lineItems.reduce((total, item) => total + calculateLineProfit(item), 0);
  };

  const validateForm = (): boolean => {
    console.log('[SalesOrder] Starting form validation');
    console.log('[SalesOrder] Line items to validate:', lineItems.length);
    
    const errors: Record<string, LineItemError> = {};
    let isValid = true;

    lineItems.forEach((item, index) => {
      console.log(`[SalesOrder] Validating line item ${index + 1}:`, item);
      const itemErrors: LineItemError = {};

      // Validate batch selection
      if (!item.batchId) {
        itemErrors.batchId = 'กรุณาเลือกสินค้า';
        isValid = false;
        console.log(`[SalesOrder] Line ${index + 1}: No batch selected`);
      } else {
        const batch = getBatchById(item.batchId);
        if (!batch) {
          itemErrors.batchId = 'สินค้าที่เลือกไม่มีอยู่';
          isValid = false;
          console.log(`[SalesOrder] Line ${index + 1}: Batch not found:`, item.batchId);
        }
      }

      // Validate quantity sold
      if (!item.quantitySold) {
        itemErrors.quantitySold = 'กรุณากรอกจำนวน';
        isValid = false;
        console.log(`[SalesOrder] Line ${index + 1}: No quantity`);
      } else {
        const quantity = parseInt(item.quantitySold, 10);
        if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
          itemErrors.quantitySold = 'จำนวนต้องเป็นจำนวนเต็มบวก';
          isValid = false;
          console.log(`[SalesOrder] Line ${index + 1}: Invalid quantity:`, item.quantitySold);
        } else {
          const batch = getBatchById(item.batchId);
          if (batch && quantity > batch.currentQuantity) {
            itemErrors.quantitySold = `สต็อกไม่เพียงพอ (มีอยู่: ${batch.currentQuantity})`;
            isValid = false;
            console.log(`[SalesOrder] Line ${index + 1}: Insufficient stock. Requested:`, quantity, 'Available:', batch.currentQuantity);
          }
        }
      }

      // Validate selling price
      if (!item.sellingPricePerUnit) {
        itemErrors.sellingPricePerUnit = 'กรุณากรอกราคาขาย';
        isValid = false;
        console.log(`[SalesOrder] Line ${index + 1}: No selling price`);
      } else {
        const price = parseFloat(item.sellingPricePerUnit);
        if (isNaN(price) || price < 0) {
          itemErrors.sellingPricePerUnit = 'ราคาขายต้องเป็นตัวเลขที่ไม่ติดลบ';
          isValid = false;
          console.log(`[SalesOrder] Line ${index + 1}: Invalid price:`, item.sellingPricePerUnit);
        }
      }

      // Validate discount
      if (item.discountType !== 'NONE') {
        const discountValue = parseFloat(item.discountValue);
        if (isNaN(discountValue) || discountValue < 0) {
          itemErrors.discountValue = 'ส่วนลดต้องเป็นตัวเลขที่ไม่ติดลบ';
          isValid = false;
          console.log(`[SalesOrder] Line ${index + 1}: Invalid discount value:`, item.discountValue);
        } else if (item.discountType === 'PERCENT' && discountValue > 100) {
          itemErrors.discountValue = 'ส่วนลดเปอร์เซ็นต์ไม่สามารถเกิน 100%';
          isValid = false;
          console.log(`[SalesOrder] Line ${index + 1}: Discount percent > 100:`, discountValue);
        } else if (item.discountType === 'AMOUNT') {
          const sellingPrice = parseFloat(item.sellingPricePerUnit);
          if (!isNaN(sellingPrice) && discountValue > sellingPrice) {
            itemErrors.discountValue = 'ส่วนลดไม่สามารถเกินราคาขาย';
            isValid = false;
            console.log(`[SalesOrder] Line ${index + 1}: Discount amount > price. Discount:`, discountValue, 'Price:', sellingPrice);
          }
        }
      }

      if (Object.keys(itemErrors).length > 0) {
        errors[item.id] = itemErrors;
        console.log(`[SalesOrder] Line ${index + 1} has errors:`, itemErrors);
      } else {
        console.log(`[SalesOrder] Line ${index + 1}: Valid`);
      }
    });

    setLineItemErrors(errors);
    console.log('[SalesOrder] Validation complete. isValid:', isValid);
    console.log('[SalesOrder] Total errors:', Object.keys(errors).length);
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[SalesOrder] Form submitted');
    console.log('[SalesOrder] Customer name:', customerName);
    console.log('[SalesOrder] Line items count:', lineItems.length);

    // Validate form
    const isValid = validateForm();
    console.log('[SalesOrder] Validation result:', isValid);
    
    if (!isValid) {
      console.error('[SalesOrder] Validation failed, errors:', lineItemErrors);
      setError('กรุณาแก้ไขข้อผิดพลาดในการตรวจสอบก่อนส่ง');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare order data with proper type casting
      const orderData = {
        customerName: customerName.trim() || undefined,
        lineItems: lineItems.map(item => ({
          batchId: Number(item.batchId),
          quantitySold: Number(item.quantitySold),
          sellingPricePerUnit: Number(item.sellingPricePerUnit),
          discountType: item.discountType,
          discountValue: Number(item.discountValue) || 0
        }))
      };

      console.log('[SalesOrder] Sending order data:', JSON.stringify(orderData, null, 2));
      console.log('[SalesOrder] POST /api/sales-orders');

      const response = await apiClient.post('/sales-orders', orderData);
      
      console.log('[SalesOrder] Response status:', response.status);
      console.log('[SalesOrder] Response data:', response.data);
      
      setSuccessMessage('สร้างคำสั่งขายสำเร็จ!');
      
      // Reset form
      setCustomerName('');
      setLineItems([
        { id: crypto.randomUUID(), batchId: '', quantitySold: '', sellingPricePerUnit: '', discountType: 'NONE', discountValue: '0' }
      ]);
      setLineItemErrors({});
      
      // Refresh batches to get updated quantities
      fetchBatches();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('[SalesOrder] Submit failed');
      console.error('[SalesOrder] Error object:', err);
      console.error('[SalesOrder] Error response:', err.response);
      console.error('[SalesOrder] Error response status:', err.response?.status);
      console.error('[SalesOrder] Error response data:', err.response?.data);
      console.error('[SalesOrder] Error message:', err.message);
      
      let errorMessage = 'ไม่สามารถสร้างคำสั่งขายได้';
      
      if (err.response) {
        // Server responded with error
        if (err.response.status === 401) {
          errorMessage = 'ต้องการการยืนยันตัวตน กรุณาเข้าสู่ระบบอีกครั้ง';
        } else if (err.response.status === 403) {
          errorMessage = 'การเข้าถึงถูกปฏิเสธ คุณไม่มีสิทธิ์สร้างใบสั่งขาย';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        // Request was made but no response
        errorMessage = 'ข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อของคุณ';
      }
      
      console.error('[SalesOrder] Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log('[SalesOrder] Submit complete, isSubmitting:', false);
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
          <p className="mt-4 text-gray-600">กำลังโหลดสินค้า...</p>
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
                    placeholder="กรอกชื่อลูกค้า"
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
                              มีอยู่: {batch.currentQuantity} หน่วย | ทุน: {formatCurrency(batch.purchasePricePerUnit)}/หน่วย
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
                            ราคาขาย (฿/กรัม) *
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
                            placeholder={batch ? `Cost ฿${batch.purchasePricePerUnit}/unit` : "0.00"}
                          />
                          {batch && (
                            <p className="mt-1 text-sm text-gray-600">
                              ทุน ฿{batch.purchasePricePerUnit}/unit
                            </p>
                          )}
                          {itemErrors.sellingPricePerUnit && (
                            <p className="mt-1 text-sm text-red-600">{itemErrors.sellingPricePerUnit}</p>
                          )}
                        </div>
                      </div>

                      {/* Discount Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Discount Type */}
                        <div>
                          <label htmlFor={`discount-type-${item.id}`} className="block text-sm font-medium text-gray-700">
                            ประเภทส่วนลด
                          </label>
                          <select
                            id={`discount-type-${item.id}`}
                            value={item.discountType}
                            onChange={(e) => {
                              updateLineItem(item.id, 'discountType', e.target.value);
                              // Reset discount value when changing type
                              if (e.target.value === 'NONE') {
                                updateLineItem(item.id, 'discountValue', '0');
                              }
                            }}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="NONE">ไม่มีส่วนลด</option>
                            <option value="PERCENT">ส่วนลดเปอร์เซ็นต์ (%)</option>
                            <option value="AMOUNT">ส่วนลดจำนวนเงิน (฿)</option>
                          </select>
                        </div>

                        {/* Discount Value */}
                        {item.discountType !== 'NONE' && (
                          <div>
                            <label htmlFor={`discount-value-${item.id}`} className="block text-sm font-medium text-gray-700">
                              {item.discountType === 'PERCENT' ? 'ส่วนลด (%)' : 'ส่วนลด (฿)'}
                            </label>
                            <input
                              type="number"
                              id={`discount-value-${item.id}`}
                              value={item.discountValue}
                              onChange={(e) => updateLineItem(item.id, 'discountValue', e.target.value)}
                              step={item.discountType === 'PERCENT' ? '0.01' : '0.01'}
                              min="0"
                              max={item.discountType === 'PERCENT' ? '100' : undefined}
                              className={`mt-1 block w-full px-3 py-2 border ${
                                itemErrors.discountValue ? 'border-red-300' : 'border-gray-300'
                              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                              placeholder="0.00"
                            />
                            {itemErrors.discountValue && (
                              <p className="mt-1 text-sm text-red-600">{itemErrors.discountValue}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Line Item Preview with Discount */}
                      {item.batchId && item.quantitySold && item.sellingPricePerUnit && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">ราคาเดิม:</p>
                              <p className="font-semibold">{formatCurrency(parseFloat(item.sellingPricePerUnit))}</p>
                            </div>
                            {item.discountType !== 'NONE' && parseFloat(item.discountValue) > 0 && (
                              <>
                                <div>
                                  <p className="text-gray-600">ส่วนลด:</p>
                                  <p className="font-semibold text-orange-600">
                                    {item.discountType === 'PERCENT' 
                                      ? `${item.discountValue}%` 
                                      : formatCurrency(parseFloat(item.discountValue))}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">ราคาหลังลด:</p>
                                  <p className="font-semibold text-green-600">{formatCurrency(calculateFinalPrice(item))}</p>
                                </div>
                              </>
                            )}
                            <div>
                              <p className="text-gray-600">ยอดรวม:</p>
                              <p className="font-semibold">{formatCurrency(calculateLineSubtotal(item))}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">กำไร:</p>
                              <p className={`font-semibold ${lineProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCurrency(lineProfit)}
                              </p>
                            </div>
                          </div>
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
                {isSubmitting ? 'กำลังสร้างคำสั่งขาย...' : 'สร้างใบสั่งขาย'}
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
