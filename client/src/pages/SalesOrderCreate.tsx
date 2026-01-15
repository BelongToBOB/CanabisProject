import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Select } from '@/components/common/Select';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '../contexts/CustomToastContext';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';

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
    const quantity = parseInt(item.quantitySold, 10);
    
    if (isNaN(sellingPrice) || isNaN(quantity)) return 0;

    // Calculate subtotal before discount
    const subtotalBeforeDiscount = sellingPrice * quantity;
    const discountValue = parseFloat(item.discountValue) || 0;
    
    let finalSubtotal: number;
    
    if (item.discountType === 'PERCENT') {
      // PERCENT: discount applied as percentage of subtotal
      const discountAmount = subtotalBeforeDiscount * (discountValue / 100);
      finalSubtotal = subtotalBeforeDiscount - discountAmount;
    } else if (item.discountType === 'AMOUNT') {
      // AMOUNT: discount applied as fixed amount to line item total
      finalSubtotal = Math.max(subtotalBeforeDiscount - discountValue, 0);
    } else {
      // NONE: no discount
      finalSubtotal = subtotalBeforeDiscount;
    }
    
    // Return final price per unit
    return finalSubtotal / quantity;
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
          const quantity = parseInt(item.quantitySold, 10);
          if (!isNaN(sellingPrice) && !isNaN(quantity)) {
            const subtotal = sellingPrice * quantity;
            if (discountValue > subtotal) {
              itemErrors.discountValue = 'ส่วนลดไม่สามารถเกินยอดรวมของรายการ';
              isValid = false;
              console.log(`[SalesOrder] Line ${index + 1}: Discount amount > subtotal. Discount:`, discountValue, 'Subtotal:', subtotal);
            }
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
      
      // Show success toast
      toast.success("สร้างคำสั่งขายสำเร็จ");
      
      // Reset form
      setCustomerName('');
      setLineItems([
        { id: crypto.randomUUID(), batchId: '', quantitySold: '', sellingPricePerUnit: '', discountType: 'NONE', discountValue: '0' }
      ]);
      setLineItemErrors({});
      
      // Refresh batches to get updated quantities
      fetchBatches();
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
      <div className="container mx-auto p-6">
        <LoadingState type="page" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">สร้างใบสั่งขาย</h1>
            <p className="text-muted-foreground mt-1">
              บันทึกรายการขายใหม่
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
          >
            กลับไป Dashboard
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* No Batches Warning */}
      {batches.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ไม่พบสินค้าในสต็อก โปรดเพิ่มสินค้าคงคลังก่อนสร้างใบสั่งขาย
          </AlertDescription>
        </Alert>
      )}

      {/* Sales Order Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลลูกค้า</CardTitle>
            <CardDescription>กรอกข้อมูลลูกค้า (ไม่บังคับ)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="customerName">ชื่อลูกค้า</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="กรอกชื่อลูกค้า"
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>รายการขาย</CardTitle>
                <CardDescription>เพิ่มสินค้าที่ต้องการขาย</CardDescription>
              </div>
              <Button
                type="button"
                onClick={addLineItem}
                disabled={batches.length === 0}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => {
              const batch = getBatchById(item.batchId);
              const lineProfit = calculateLineProfit(item);
              const itemErrors = lineItemErrors[item.id] || {};

              return (
                <Card key={item.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">รายการ {index + 1}</CardTitle>
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          ลบ
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Batch Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`batch-${item.id}`}>
                        สินค้า <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        id={`batch-${item.id}`}
                        value={item.batchId}
                        onChange={(e) => updateLineItem(item.id, 'batchId', e.target.value)}
                        className={itemErrors.batchId ? 'border-destructive' : ''}
                      >
                        <option value="">เลือกสินค้า</option>
                        {batches.map(b => (
                          <option key={b.id} value={b.id.toString()}>
                            {b.batchIdentifier} - {b.productName} (Qty: {b.currentQuantity})
                          </option>
                        ))}
                      </Select>
                      {itemErrors.batchId && (
                        <p className="text-sm text-destructive">{itemErrors.batchId}</p>
                      )}
                      {batch && (
                        <p className="text-sm text-muted-foreground">
                          มีอยู่: {batch.currentQuantity} หน่วย | ทุน: {formatCurrency(batch.purchasePricePerUnit)}/หน่วย
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Quantity */}
                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${item.id}`}>
                          จำนวน <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={item.quantitySold}
                          onChange={(e) => updateLineItem(item.id, 'quantitySold', e.target.value)}
                          min="1"
                          step="1"
                          placeholder="0"
                          className={itemErrors.quantitySold ? 'border-destructive' : ''}
                        />
                        {itemErrors.quantitySold && (
                          <p className="text-sm text-destructive">{itemErrors.quantitySold}</p>
                        )}
                      </div>

                      {/* Selling Price */}
                      <div className="space-y-2">
                        <Label htmlFor={`price-${item.id}`}>
                          ราคาขาย (฿/กรัม) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`price-${item.id}`}
                          type="number"
                          value={item.sellingPricePerUnit}
                          onChange={(e) => updateLineItem(item.id, 'sellingPricePerUnit', e.target.value)}
                          step="0.01"
                          min="0"
                          placeholder={batch ? `ทุน ฿${batch.purchasePricePerUnit}/unit` : "0.00"}
                          className={itemErrors.sellingPricePerUnit ? 'border-destructive' : ''}
                        />
                        {batch && (
                          <p className="text-sm text-muted-foreground">
                            ทุน ฿{batch.purchasePricePerUnit}/unit
                          </p>
                        )}
                        {itemErrors.sellingPricePerUnit && (
                          <p className="text-sm text-destructive">{itemErrors.sellingPricePerUnit}</p>
                        )}
                      </div>
                    </div>

                    {/* Discount Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Discount Type */}
                      <div className="space-y-2">
                        <Label htmlFor={`discount-type-${item.id}`}>ประเภทส่วนลด</Label>
                        <Select
                          id={`discount-type-${item.id}`}
                          value={item.discountType}
                          onChange={(e) => {
                            updateLineItem(item.id, 'discountType', e.target.value);
                            if (e.target.value === 'NONE') {
                              updateLineItem(item.id, 'discountValue', '0');
                            }
                          }}
                        >
                          <option value="NONE">ไม่มีส่วนลด</option>
                          <option value="PERCENT">ส่วนลดเปอร์เซ็นต์ (%)</option>
                          <option value="AMOUNT">ส่วนลดจำนวนเงิน (฿)</option>
                        </Select>
                      </div>

                      {/* Discount Value */}
                      {item.discountType !== 'NONE' && (
                        <div className="space-y-2">
                          <Label htmlFor={`discount-value-${item.id}`}>
                            {item.discountType === 'PERCENT' ? 'ส่วนลด (%)' : 'ส่วนลด (฿) - จากยอดรวมรายการ'}
                          </Label>
                          <Input
                            id={`discount-value-${item.id}`}
                            type="number"
                            value={item.discountValue}
                            onChange={(e) => updateLineItem(item.id, 'discountValue', e.target.value)}
                            step={item.discountType === 'PERCENT' ? '0.01' : '0.01'}
                            min="0"
                            max={item.discountType === 'PERCENT' ? '100' : undefined}
                            placeholder="0.00"
                            className={itemErrors.discountValue ? 'border-destructive' : ''}
                          />
                          {itemErrors.discountValue && (
                            <p className="text-sm text-destructive">{itemErrors.discountValue}</p>
                          )}
                          {item.discountType === 'AMOUNT' && item.batchId && item.quantitySold && item.sellingPricePerUnit && (
                            <p className="text-sm text-muted-foreground">
                              ยอดรวมก่อนลด: {formatCurrency(parseFloat(item.sellingPricePerUnit) * parseInt(item.quantitySold, 10))}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Line Item Summary */}
                    {item.batchId && item.quantitySold && item.sellingPricePerUnit && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">ราคาเดิม:</p>
                            <p className="font-semibold">{formatCurrency(parseFloat(item.sellingPricePerUnit))}</p>
                          </div>
                          {item.discountType !== 'NONE' && parseFloat(item.discountValue) > 0 && (
                            <div>
                              <p className="text-muted-foreground">ส่วนลด:</p>
                              <p className="font-semibold text-amber-600 dark:text-amber-400">
                                {item.discountType === 'PERCENT' 
                                  ? `${item.discountValue}%` 
                                  : formatCurrency(parseFloat(item.discountValue))}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground">ยอดรวม:</p>
                            <p className="font-semibold">{formatCurrency(calculateLineSubtotal(item))}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">กำไร:</p>
                            <p className={`font-semibold ${lineProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatCurrency(lineProfit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>

        {/* Total Profit Card */}
        <Card className="border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                กำไรการสั่งซื้อทั้งหมด:
              </h3>
              <p className={`text-2xl font-bold ${
                calculateTotalProfit() >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(calculateTotalProfit())}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || batches.length === 0}
            size="lg"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'กำลังสร้างคำสั่งขาย...' : 'สร้างใบสั่งขาย'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
            size="lg"
          >
            ยกเลิก
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SalesOrderCreate;
