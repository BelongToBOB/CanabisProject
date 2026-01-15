import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { toast } from '../contexts/CustomToastContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Eye, Trash2, Lock, Unlock, Filter, X } from 'lucide-react';

interface SalesOrder {
  id: number;
  orderDate: string;
  customerName: string | null;
  totalProfit: number;
  isLocked: boolean;
}

const SalesOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get<SalesOrder[]>(
        `/sales-orders?${params.toString()}`
      );
      setOrders(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ไม่สามารถดึงรายการคำสั่งขายได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (order: SalesOrder) => {
    if (order.isLocked) {
      toast.error('ไม่สามารถลบคำสั่งขายที่ถูกล็อกได้');
      return;
    }
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/sales-orders/${orderToDelete.id}`);
      toast.success('ลบคำสั่งขายเรียบร้อยแล้ว');
      fetchOrders();
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ไม่สามารถลบคำสั่งขายได้');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilter = () => {
    fetchOrders();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setShowLockedOnly(false);
    setShowUnlockedOnly(false);
    setTimeout(() => fetchOrders(), 0);
  };

  const hasActiveFilters = startDate || endDate || showLockedOnly || showUnlockedOnly;

  // Apply client-side filters
  const filteredOrders = orders.filter((order) => {
    if (showLockedOnly && !order.isLocked) return false;
    if (showUnlockedOnly && order.isLocked) return false;
    return true;
  });

  // Define table columns
  const columns: ColumnDef<SalesOrder>[] = [
    {
      key: 'id',
      header: 'เลขที่',
      sortable: true,
      render: (order) => (
        <span className="font-medium">#{order.id}</span>
      ),
    },
    {
      key: 'orderDate',
      header: 'วันที่',
      sortable: true,
      render: (order) => (
        <span className="text-sm">{formatDateTime(order.orderDate)}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'ลูกค้า',
      sortable: true,
      render: (order) => (
        order.customerName ? (
          <span>{order.customerName}</span>
        ) : (
          <span className="text-muted-foreground italic">ไม่ระบุ</span>
        )
      ),
    },
    {
      key: 'totalProfit',
      header: 'กำไรรวม',
      sortable: true,
      render: (order) => (
        <span className={order.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
          {formatCurrency(order.totalProfit)}
        </span>
      ),
    },
    {
      key: 'isLocked',
      header: 'สถานะ',
      sortable: true,
      render: (order) => (
        order.isLocked ? (
          <Badge variant="default" className="gap-1">
            <Lock className="h-3 w-3" />
            ล็อกแล้ว
          </Badge>
        ) : (
          <Badge variant="success" className="gap-1">
            <Unlock className="h-3 w-3" />
            ยังไม่ล็อก
          </Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: 'การทำงาน',
      className: 'text-right',
      render: (order) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/sales-orders/${order.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            ดูรายละเอียด
          </Button>
          {!order.isLocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(order)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              ลบ
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingState type="page" />;
  }

  // Calculate summary
  const totalProfit = filteredOrders.reduce((sum, order) => sum + order.totalProfit, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">รายการคำสั่งขาย</h1>
          <p className="text-muted-foreground mt-1">
            ดูและจัดการธุรกรรมการขายทั้งหมด
          </p>
        </div>
        <Button onClick={() => navigate('/')} variant="secondary">
          กลับไปหน้าแดชบอร์ด
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรองข้อมูล
          </CardTitle>
          <CardDescription>
            กรองคำสั่งขายตามวันที่และสถานะ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLockedOnly}
                  onChange={(e) => {
                    setShowLockedOnly(e.target.checked);
                    if (e.target.checked) setShowUnlockedOnly(false);
                  }}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">เฉพาะที่ล็อกแล้ว</span>
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnlockedOnly}
                  onChange={(e) => {
                    setShowUnlockedOnly(e.target.checked);
                    if (e.target.checked) setShowLockedOnly(false);
                  }}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">เฉพาะที่ยังไม่ล็อก</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFilter}>
              <Filter className="h-4 w-4 mr-2" />
              ใช้ตัวกรอง
            </Button>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="secondary">
                <X className="h-4 w-4 mr-2" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={filteredOrders}
            columns={columns}
            searchKey="customerName"
            searchPlaceholder="ค้นหาชื่อลูกค้า..."
            emptyState={
              <EmptyState
                icon={<ShoppingCart className="h-12 w-12 text-muted-foreground" />}
                title="ไม่พบคำสั่งขาย"
                description="ลองปรับตัวกรองหรือสร้างคำสั่งขายใหม่"
                action={{
                  label: 'สร้างคำสั่งขายใหม่',
                  onClick: () => navigate('/sales-orders/create'),
                }}
              />
            }
          />
        </CardContent>
      </Card>

      {/* Summary Card */}
      {filteredOrders.length > 0 && (
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  จำนวนคำสั่งขายทั้งหมด:
                </span>
                <Badge variant="secondary" className="text-base">
                  {filteredOrders.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">กำไรรวม:</span>
                <span className={`text-xl font-bold ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(totalProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบคำสั่งขาย</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งขาย #{orderToDelete?.id}?
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

export default SalesOrderList;
