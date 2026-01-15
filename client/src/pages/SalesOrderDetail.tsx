import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { LoadingState } from '@/components/shared/LoadingState';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { toast } from '../contexts/CustomToastContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Lock, Unlock, Trash2, AlertCircle, ArrowLeft } from 'lucide-react';

interface LineItem {
  id: number;
  batchId: number;
  batchIdentifier: string;
  productName: string;
  quantitySold: number;
  sellingPricePerUnit: number;
  purchasePricePerUnit: number;
  discountType: 'NONE' | 'PERCENT' | 'AMOUNT';
  discountValue: number;
  finalSellingPricePerUnit: number;
  subtotal: number;
  lineProfit: number;
}

interface SalesOrderDetail {
  id: number;
  orderDate: string;
  customerName: string | null;
  totalProfit: number;
  isLocked: boolean;
  lineItems: LineItem[];
}

const SalesOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<SalesOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<SalesOrderDetail>(`/sales-orders/${id}`);
      setOrder(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'ไม่สามารถดึงรายละเอียดคำสั่งขายได้';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!order) return;

    if (order.isLocked) {
      toast.error('ไม่สามารถลบคำสั่งขายที่ถูกล็อกได้');
      return;
    }
    
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!order) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/sales-orders/${id}`);
      toast.success('ลบคำสั่งขายเรียบร้อยแล้ว');
      navigate('/sales-orders');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'ไม่สามารถลบคำสั่งขายได้';
      toast.error(errorMessage);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return formatDateTime(dateString);
  };

  if (isLoading) {
    return <LoadingState type="page" />;
  }

  if (error && !order) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/sales-orders')} variant="secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปยังรายการคำสั่งขาย
        </Button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              คำสั่งขาย #{order.id}
            </h1>
            {order.isLocked ? (
              <Badge variant="default" className="gap-1">
                <Lock className="h-3 w-3" />
                ล็อกแล้ว
              </Badge>
            ) : (
              <Badge variant="success" className="gap-1">
                <Unlock className="h-3 w-3" />
                ยังไม่ล็อก
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            ดูรายละเอียดข้อมูลของรายการขายนี้
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/sales-orders')} variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปยังรายการ
          </Button>
          {!order.isLocked && (
            <Button
              onClick={handleDeleteClick}
              variant="destructive"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบคำสั่งขาย
            </Button>
          )}
        </div>
      </div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลคำสั่งขาย</CardTitle>
            <CardDescription>รายละเอียดทั่วไป</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">วันที่ขาย:</span>
              <span className="font-medium">{formatDate(order.orderDate)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">ชื่อลูกค้า:</span>
              <span className="font-medium">{order.customerName || <span className="italic text-muted-foreground">ไม่ระบุ</span>}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">จำนวนรายการ:</span>
              <Badge variant="secondary">{order.lineItems.length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30">
          <CardHeader>
            <CardTitle className="text-emerald-700 dark:text-emerald-400">สรุปผลทางการเงิน</CardTitle>
            <CardDescription>กำไรรวมจากการขาย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">กำไรรวม:</span>
              <span className={`text-3xl font-bold ${
                order.totalProfit >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(order.totalProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            รายการสินค้า
          </CardTitle>
          <CardDescription>รายละเอียดสินค้าที่ขาย</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">สินค้า</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">ล็อต</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">จำนวน</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">ต้นทุน/หน่วย</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">ราคาขาย/หน่วย</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">ส่วนลด</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">ราคาสุทธิ/หน่วย</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">ยอดรวม</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">กำไร</th>
                </tr>
              </thead>
              <tbody>
                {order.lineItems.map((item, index) => (
                  <tr key={item.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${index === order.lineItems.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="py-3 px-2 font-medium">{item.productName || <span className="italic text-muted-foreground">ไม่ระบุ</span>}</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{item.batchIdentifier || <span className="italic">ไม่ระบุ</span>}</td>
                    <td className="py-3 px-2 text-right">{item.quantitySold}</td>
                    <td className="py-3 px-2 text-right text-sm">
                      {formatCurrency(item.purchasePricePerUnit)}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      {formatCurrency(item.sellingPricePerUnit)}
                    </td>
                    <td className="py-3 px-2 text-right text-sm">
                      {item.discountType === 'NONE' ? (
                        <span className="text-muted-foreground">-</span>
                      ) : item.discountType === 'PERCENT' ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">{item.discountValue}%</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">{formatCurrency(item.discountValue)}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {item.discountType !== 'NONE' && item.discountValue > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(item.finalSellingPricePerUnit)}
                        </span>
                      ) : (
                        <span className="font-medium">{formatCurrency(item.sellingPricePerUnit)}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold">
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-semibold ${
                        item.lineProfit >= 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatCurrency(item.lineProfit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบคำสั่งขาย</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งขาย #{order.id}?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'กำลังลบ...' : 'ลบคำสั่งขาย'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesOrderDetail;
