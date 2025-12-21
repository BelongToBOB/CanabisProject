import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';

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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          ยินดีต้อนรับคุณ, {user?.username}!
        </p>
      </div>

      {/* Quick Stats - Admin Only */}
      {user?.role === 'ADMIN' && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">จำนวนสินค้าทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalBatches}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">มูลค่าสินค้าคงคลัง</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ฿{stats.totalInventoryValue.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ยอดขายวันนี้</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.todaysSales}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">กำไรรายเดือน</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ${stats.monthlyProfit.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user?.role === 'ADMIN' && (
            <>
              <button
                onClick={() => navigate('/users')}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900">จัดการผู้ใช้งาน</h3>
                </div>
                <p className="text-sm text-gray-600">
                  สร้างและจัดการบัญชีผู้ใช้
                </p>
              </button>
              <button
                onClick={() => navigate('/batches')}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900">จัดการสินค้าคงคลัง</h3>
                </div>
                <p className="text-sm text-gray-600">
                  เพิ่มและจัดการล็อตกัญชา
                </p>
              </button>
              <button
                onClick={() => navigate('/sales-orders')}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900">ดูคำสั่งขาย</h3>
                </div>
                <p className="text-sm text-gray-600">
                  ดูและจัดการธุรกรรมการขายทั้งหมด
                </p>
              </button>
              <button
                onClick={() => navigate('/reports/inventory')}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900">Inventory Report</h3>
                </div>
                <p className="text-sm text-gray-600">
                  รายงานสินค้าคงคลัง
                </p>
              </button>
              <button
                onClick={() => navigate('/reports/monthly-profit')}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900">กำไรรายเดือน</h3>
                </div>
                <p className="text-sm text-gray-600">
                  ดูสรุปผลกำไรรายเดือน
                </p>
              </button>
              <button
                onClick={() => navigate('/profit-shares')}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="font-medium text-gray-900">การแบ่งปันผลกำไร</h3>
                </div>
                <p className="text-sm text-gray-600">
                  ดูประวัติการกระจายผลกำไร
                </p>
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/sales-orders/create')}
            className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center mb-2">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <h3 className="font-medium text-gray-900">สร้างการขาย</h3>
            </div>
            <p className="text-sm text-gray-600">
              บันทึกคำสั่งขายใหม่
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
