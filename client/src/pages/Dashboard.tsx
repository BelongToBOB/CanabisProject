import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { LoadingState } from '@/components/shared/LoadingState';
import { 
  Package, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Users,
  FileText,
  PlusCircle,
  BarChart3,
  Wallet
} from 'lucide-react';

interface DashboardStats {
  totalBatches: number;
  totalInventoryValue: number;
  lowStockBatches: number;
  recentSalesCount: number;
  todaysSales: number;
  monthlyProfit: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.role !== 'ADMIN') {
        setLoading(false);
        return;
      }

      try {
        // Fetch inventory report for stats
        const inventoryResponse = await apiClient.get('/reports/inventory');
        
        // Extract the items array from the inventory report response
        // The API returns: { items: InventoryBatch[], totalInventoryValue: number }
        const reportData = inventoryResponse.data;
        const batches = (reportData && reportData.items && Array.isArray(reportData.items)) 
          ? reportData.items 
          : [];

        const totalBatches = batches.length;
        const totalInventoryValue = batches.reduce(
          (sum: number, batch: any) => sum + batch.currentQuantity * batch.purchasePricePerUnit,
          0
        );
        const lowStockBatches = batches.filter((batch: any) => batch.currentQuantity <= 10).length;

        // Fetch current month's profit
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        let monthlyProfit = 0;
        try {
          const profitResponse = await apiClient.get('/reports/monthly-profit', {
            params: { month: currentMonth, year: currentYear },
          });
          monthlyProfit = profitResponse.data.totalProfit || 0;
        } catch (error) {
          // If no data for current month, default to 0
          monthlyProfit = 0;
        }

        // Fetch recent sales orders
        const salesResponse = await apiClient.get('/sales-orders');
        
        // Normalize the response to always be an array
        let allOrders = salesResponse.data;
        if (!Array.isArray(allOrders)) {
          // If the response is an object with a data property, use that
          if (allOrders && typeof allOrders === 'object' && Array.isArray(allOrders.data)) {
            allOrders = allOrders.data;
          } else {
            // Otherwise, default to empty array
            allOrders = [];
          }
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysOrders = allOrders.filter((order: any) => {
          const orderDate = new Date(order.orderDate);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });

        const todaysSales = todaysOrders.length;
        const recentSalesCount = allOrders.slice(0, 10).length;

        setStats({
          totalBatches,
          totalInventoryValue,
          lowStockBatches,
          recentSalesCount,
          todaysSales,
          monthlyProfit,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground mt-2">
          ยินดีต้อนรับคุณ, {user?.username}!
        </p>
      </div>

      {/* Quick Stats - Admin Only */}
      {user?.role === 'ADMIN' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            สถิติด่วน
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <LoadingState type="skeleton" count={1} />
                  </CardHeader>
                  <CardContent>
                    <LoadingState type="skeleton" count={1} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    จำนวนสินค้าทั้งหมด
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBatches}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ล็อตสินค้าในระบบ
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    มูลค่าสินค้าคงคลัง
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ฿{stats.totalInventoryValue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    มูลค่ารวมทั้งหมด
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    ยอดขายวันนี้
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todaysSales}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    คำสั่งซื้อวันนี้
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    กำไรรายเดือน
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ฿{stats.monthlyProfit.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    กำไรเดือนนี้
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          การดำเนินการด่วน
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {user?.role === 'ADMIN' && (
            <>
              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer" onClick={() => navigate('/users')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">จัดการผู้ใช้งาน</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    สร้างและจัดการบัญชีผู้ใช้
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer" onClick={() => navigate('/batches')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">จัดการสินค้าคงคลัง</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    เพิ่มและจัดการล็อตกัญชา
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer" onClick={() => navigate('/sales-orders')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">ดูคำสั่งขาย</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ดูและจัดการธุรกรรมการขายทั้งหมด
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer" onClick={() => navigate('/reports/inventory')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">รายงานสต็อกสินค้า</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    รายงานสินค้าคงคลัง
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer" onClick={() => navigate('/reports/monthly-profit')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">กำไรรายเดือน</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ดูสรุปผลกำไรรายเดือน
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer" onClick={() => navigate('/profit-shares')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">การแบ่งปันผลกำไร</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ดูประวัติการกระจายผลกำไร
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          
          <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer" onClick={() => navigate('/sales-orders/create')}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">สร้างการขาย</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                บันทึกคำสั่งขายใหม่
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
