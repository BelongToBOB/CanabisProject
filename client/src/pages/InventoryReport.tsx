import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { Package, DollarSign, AlertCircle, PackageX } from 'lucide-react';
import { toast } from '../contexts/CustomToastContext';

interface InventoryBatch {
  id: number;
  batchIdentifier: string;
  productName: string;
  currentQuantity: number;
  purchasePricePerUnit: number;
  isDepleted: boolean;
}

interface InventoryReportResponse {
  items: InventoryBatch[];
  totalInventoryValue: number;
}

const InventoryReport: React.FC = () => {
  const [reportData, setReportData] = useState<InventoryReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryReport();
  }, []);

  const fetchInventoryReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<InventoryReportResponse>('/reports/inventory');
      setReportData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'ไม่สามารถดึงรายงานสต็อกสินค้าได้';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `฿${amount.toFixed(2)}`;
  };

  const columns: ColumnDef<InventoryBatch>[] = [
    {
      key: 'productName',
      header: 'ชื่อสินค้า',
      sortable: true,
      render: (item) => (
        <div className="font-medium">{item.productName}</div>
      ),
    },
    {
      key: 'batchIdentifier',
      header: 'รหัสล็อต',
      sortable: true,
      render: (item) => (
        <div className="text-muted-foreground">{item.batchIdentifier}</div>
      ),
    },
    {
      key: 'currentQuantity',
      header: 'จำนวนคงเหลือ',
      sortable: true,
      render: (item) => (
        <div className={item.currentQuantity <= 10 ? 'text-destructive font-medium' : ''}>
          {item.currentQuantity}
        </div>
      ),
    },
    {
      key: 'purchasePricePerUnit',
      header: 'ราคาทุนต่อหน่วย',
      sortable: true,
      render: (item) => formatCurrency(item.purchasePricePerUnit),
    },
    {
      key: 'stockValue',
      header: 'มูลค่าสต็อก',
      sortable: false,
      render: (item) => (
        <div className="font-medium">
          {formatCurrency(item.currentQuantity * item.purchasePricePerUnit)}
        </div>
      ),
    },
    {
      key: 'isDepleted',
      header: 'สถานะ',
      sortable: false,
      render: (item) => (
        <Badge variant={item.isDepleted ? 'destructive' : 'default'}>
          {item.isDepleted ? 'หมดสต็อก' : 'มีสินค้า'}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <LoadingState type="skeleton" count={2} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingState type="skeleton" count={1} />
          <LoadingState type="skeleton" count={1} />
          <LoadingState type="skeleton" count={1} />
        </div>
        <LoadingState type="skeleton" count={5} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">รายงานสต็อกสินค้า</h1>
        <p className="text-muted-foreground mt-2">
          แสดงสถานะสต็อกปัจจุบันและมูลค่ารวมของสินค้า
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card hover>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  มูลค่าสต็อกรวม
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.totalInventoryValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  มูลค่ารวมของสินค้าคงคลัง
                </p>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  จำนวนล็อตทั้งหมด
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.items.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ล็อตสินค้าทั้งหมดในระบบ
                </p>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  สินค้าใกล้หมด
                </CardTitle>
                <PackageX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.items.filter(item => item.currentQuantity <= 10 && !item.isDepleted).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ล็อตที่มีจำนวนคงเหลือ ≤ 10
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดสต็อกสินค้า</CardTitle>
              <CardDescription>
                รายการล็อตสินค้าทั้งหมดพร้อมข้อมูลสต็อกและมูลค่า
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={reportData.items}
                columns={columns}
                searchKey="productName"
                searchPlaceholder="ค้นหาตามชื่อสินค้า..."
                loading={false}
                emptyState={
                  <EmptyState
                    icon={<Package className="h-10 w-10 text-muted-foreground" />}
                    title="ไม่มีข้อมูลสต็อก"
                    description="ยังไม่มีล็อตสินค้าในระบบ กรุณาเพิ่มล็อตสินค้าใหม่"
                  />
                }
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default InventoryReport;
