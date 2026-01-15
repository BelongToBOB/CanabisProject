import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { toast } from '../contexts/CustomToastContext';
import { useApiError } from '../hooks/useApiError';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Badge } from '@/components/common/Badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { Package, Plus, Trash2, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Batch {
  id: number;
  batchIdentifier: string;
  productName: string;
  purchaseDate: string;
  purchasePricePerUnit: number;
  defaultSellingPricePerUnit: number;
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
  defaultSellingPricePerUnit: string;
  initialQuantity: string;
}

const BatchManagement: React.FC = () => {
  const { handleError } = useApiError();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<BatchFormData>({
    batchIdentifier: '',
    productName: '',
    purchaseDate: '',
    purchasePricePerUnit: '',
    defaultSellingPricePerUnit: '',
    initialQuantity: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<Batch[]>('/batches');
      setBatches(response.data);
    } catch (err: any) {
      handleError(err, 'ไม่สามารถดึงข้อมูลสินค้าได้');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.batchIdentifier.trim()) {
      errors.batchIdentifier = 'กรุณากรอกรหัสสินค้า';
    }
    
    if (!formData.productName.trim()) {
      errors.productName = 'กรุณากรอกชื่อสินค้า';
    }
    
    if (!formData.purchaseDate) {
      errors.purchaseDate = 'กรุณาเลือกวันที่ซื้อ';
    }
    
    if (!formData.purchasePricePerUnit) {
      errors.purchasePricePerUnit = 'กรุณากรอกราคาทุน';
    } else {
      const price = parseFloat(formData.purchasePricePerUnit);
      if (isNaN(price) || price < 0) {
        errors.purchasePricePerUnit = 'ราคาทุนต้องเป็นตัวเลขที่ไม่ติดลบ';
      }
    }
    
    if (!formData.initialQuantity) {
      errors.initialQuantity = 'กรุณากรอกจำนวนที่ซื้อ';
    } else {
      const quantity = parseInt(formData.initialQuantity, 10);
      if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        errors.initialQuantity = 'จำนวนที่ซื้อต้องเป็นจำนวนเต็มบวก';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('กรุณาแก้ไขข้อผิดพลาดในการตรวจสอบ');
      return;
    }

    try {
      setIsSubmitting(true);
      const batchData = {
        batchIdentifier: formData.batchIdentifier,
        productName: formData.productName,
        purchaseDate: formData.purchaseDate,
        purchasePricePerUnit: parseFloat(formData.purchasePricePerUnit),
        defaultSellingPricePerUnit: formData.defaultSellingPricePerUnit ? parseFloat(formData.defaultSellingPricePerUnit) : 0,
        initialQuantity: parseInt(formData.initialQuantity, 10),
      };
      
      await apiClient.post('/batches', batchData);
      toast.success('สร้างสินค้าสำเร็จ');
      setShowCreateDialog(false);
      resetForm();
      fetchBatches();
    } catch (err: any) {
      handleError(err, 'ไม่สามารถสร้างสินค้าได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!selectedBatch) return;

    try {
      setIsSubmitting(true);
      await apiClient.delete(`/batches/${selectedBatch.id}`);
      toast.success('ลบสินค้าสำเร็จ');
      setShowDeleteDialog(false);
      setShowDetailDialog(false);
      setSelectedBatch(null);
      fetchBatches();
    } catch (err: any) {
      handleError(err, 'ไม่สามารถลบสินค้าได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      batchIdentifier: '',
      productName: '',
      purchaseDate: '',
      purchasePricePerUnit: '',
      defaultSellingPricePerUnit: '',
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

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openDetailDialog = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowDetailDialog(true);
  };

  const openDeleteDialog = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowDeleteDialog(true);
  };

  const getStockStatus = (batch: Batch): { label: string; variant: 'success' | 'warning' | 'danger' } => {
    if (batch.currentQuantity === 0) {
      return { label: 'หมด', variant: 'danger' };
    }
    if (batch.currentQuantity < batch.initialQuantity * 0.2) {
      return { label: 'สต็อกต่ำ', variant: 'warning' };
    }
    return { label: 'มีสินค้า', variant: 'success' };
  };

  // Define table columns
  const columns: ColumnDef<Batch>[] = [
    {
      key: 'batchIdentifier',
      header: 'รหัสสินค้า',
      sortable: true,
      render: (batch) => (
        <span className="font-medium">{batch.batchIdentifier}</span>
      ),
    },
    {
      key: 'productName',
      header: 'ชื่อสินค้า',
      sortable: true,
    },
    {
      key: 'currentQuantity',
      header: 'จำนวนปัจจุบัน',
      sortable: true,
      render: (batch) => (
        <span className={batch.currentQuantity === 0 ? 'text-destructive font-semibold' : ''}>
          {batch.currentQuantity}
        </span>
      ),
    },
    {
      key: 'initialQuantity',
      header: 'จำนวนเริ่มต้น',
      sortable: true,
    },
    {
      key: 'purchasePricePerUnit',
      header: 'ราคาทุน',
      sortable: true,
      render: (batch) => formatCurrency(batch.purchasePricePerUnit),
    },
    {
      key: 'purchaseDate',
      header: 'วันที่ซื้อ',
      sortable: true,
      render: (batch) => formatDate(batch.purchaseDate),
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (batch) => {
        const status = getStockStatus(batch);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'การดำเนินการ',
      render: (batch) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDetailDialog(batch)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteDialog(batch)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingState type="page" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายการสินค้า</h1>
          <p className="text-muted-foreground mt-1">
            จัดการล็อตสินค้าคงคลังกัญชา
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          สร้างสินค้าใหม่
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={batches}
        columns={columns}
        searchKey="productName"
        searchPlaceholder="ค้นหาชื่อสินค้า..."
        emptyState={
          <EmptyState
            icon={<Package className="h-12 w-12 text-muted-foreground" />}
            title="ไม่มีสินค้า"
            description="เริ่มต้นโดยการสร้างสินค้าใหม่"
            action={{
              label: 'สร้างสินค้าใหม่',
              onClick: openCreateDialog,
            }}
          />
        }
      />

      {/* Create Batch Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>สร้างสินค้าใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลสินค้าใหม่ที่ต้องการเพิ่มเข้าสู่ระบบ
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBatch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchIdentifier" required>
                  รหัสสินค้า
                </Label>
                <Input
                  id="batchIdentifier"
                  name="batchIdentifier"
                  value={formData.batchIdentifier}
                  onChange={handleInputChange}
                  placeholder="191268 (ตามวันที่)"
                  className={formErrors.batchIdentifier ? 'border-rose-500 focus:ring-rose-500' : ''}
                />
                {formErrors.batchIdentifier && (
                  <p className="text-sm text-rose-600 dark:text-rose-400">{formErrors.batchIdentifier}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName" required>
                  ชื่อสินค้า
                </Label>
                <Input
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="กรอกชื่อสินค้า"
                  className={formErrors.productName ? 'border-rose-500 focus:ring-rose-500' : ''}
                />
                {formErrors.productName && (
                  <p className="text-sm text-rose-600 dark:text-rose-400">{formErrors.productName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate" required>
                  วันที่ซื้อ
                </Label>
                <Input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className={formErrors.purchaseDate ? 'border-rose-500 focus:ring-rose-500' : ''}
                />
                {formErrors.purchaseDate && (
                  <p className="text-sm text-rose-600 dark:text-rose-400">{formErrors.purchaseDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePricePerUnit" required>
                  ราคาทุน/กรัม
                </Label>
                <Input
                  type="number"
                  id="purchasePricePerUnit"
                  name="purchasePricePerUnit"
                  value={formData.purchasePricePerUnit}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={formErrors.purchasePricePerUnit ? 'border-rose-500 focus:ring-rose-500' : ''}
                />
                {formErrors.purchasePricePerUnit && (
                  <p className="text-sm text-rose-600 dark:text-rose-400">{formErrors.purchasePricePerUnit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultSellingPricePerUnit">
                  ราคาขาย/กรัม (ค่าเริ่มต้น)
                </Label>
                <Input
                  type="number"
                  id="defaultSellingPricePerUnit"
                  name="defaultSellingPricePerUnit"
                  value={formData.defaultSellingPricePerUnit}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialQuantity" required>
                  จำนวนที่ซื้อ
                </Label>
                <Input
                  type="number"
                  id="initialQuantity"
                  name="initialQuantity"
                  value={formData.initialQuantity}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  placeholder="0"
                  className={formErrors.initialQuantity ? 'border-rose-500 focus:ring-rose-500' : ''}
                />
                {formErrors.initialQuantity && (
                  <p className="text-sm text-rose-600 dark:text-rose-400">{formErrors.initialQuantity}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มสินค้า'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {selectedBatch && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>รายละเอียดสินค้า</DialogTitle>
              <DialogDescription>
                ข้อมูลรายละเอียดของสินค้า {selectedBatch.batchIdentifier}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">รหัสสินค้า</p>
                  <p className="mt-1.5 text-base font-semibold">{selectedBatch.batchIdentifier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ชื่อสินค้า</p>
                  <p className="mt-1.5 text-base">{selectedBatch.productName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">จำนวนปัจจุบัน</p>
                  <p className={`mt-1.5 text-base font-semibold ${selectedBatch.currentQuantity === 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                    {selectedBatch.currentQuantity} หน่วย
                    {selectedBatch.currentQuantity === 0 && ' (หมด)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">จำนวนเริ่มต้น</p>
                  <p className="mt-1.5 text-base">{selectedBatch.initialQuantity} หน่วย</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ราคาทุนต่อหน่วย</p>
                  <p className="mt-1.5 text-base font-semibold">{formatCurrency(selectedBatch.purchasePricePerUnit)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">วันที่ซื้อ</p>
                  <p className="mt-1.5 text-base">{formatDate(selectedBatch.purchaseDate)}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">มูลค่าการซื้อทั้งหมด</p>
                    <p className="mt-1.5 text-base font-semibold">
                      {formatCurrency(selectedBatch.purchasePricePerUnit * selectedBatch.initialQuantity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">มูลค่าคงเหลือ</p>
                    <p className="mt-1.5 text-base font-semibold">
                      {formatCurrency(selectedBatch.purchasePricePerUnit * selectedBatch.currentQuantity)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">จำนวนที่ขายแล้ว</p>
                    <p className="mt-1.5 text-base">
                      {selectedBatch.initialQuantity - selectedBatch.currentQuantity} หน่วย
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">สถานะสินค้า</p>
                    <div className="mt-1.5">
                      <Badge variant={getStockStatus(selectedBatch).variant}>
                        {getStockStatus(selectedBatch).label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">วันที่สร้าง</p>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{new Date(selectedBatch.createdAt).toLocaleString('th-TH')}</p>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">อัปเดตล่าสุด</p>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{new Date(selectedBatch.updatedAt).toLocaleString('th-TH')}</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDetailDialog(false);
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                ลบสินค้า
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDetailDialog(false)}
              >
                ปิด
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedBatch && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการลบ</DialogTitle>
              <DialogDescription>
                คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า <strong>{selectedBatch.batchIdentifier}</strong>?
                <br />
                <br />
                การดำเนินการนี้ไม่สามารถย้อนกลับได้ หมายเหตุ: สินค้าที่ถูกอ้างอิงโดยคำสั่งขายไม่สามารถลบได้
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBatch}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังลบ...' : 'ลบ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BatchManagement;
