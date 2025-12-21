import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get<SalesOrder[]>(
        `/sales-orders?${params.toString()}`
      );
      setOrders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'ไม่สามารถดึงรายการคำสั่งขายได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (orderId: number, isLocked: boolean) => {
    if (isLocked) {
      setError('ไม่สามารถลบคำสั่งขายที่ถูกล็อกได้');
      return;
    }

    if (
      !window.confirm(
        'คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งขายนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้'
      )
    ) {
      return;
    }

    try {
      setError(null);
      await apiClient.delete(`/sales-orders/${orderId}`);
      setSuccessMessage('ลบคำสั่งขายเรียบร้อยแล้ว');
      fetchOrders();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'ไม่สามารถลบคำสั่งขายได้');
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `฿${amount.toFixed(2)}`;
  };

  const filteredOrders = orders.filter((order) => {
    if (showLockedOnly && !order.isLocked) return false;
    if (showUnlockedOnly && order.isLocked) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดรายการคำสั่งขาย...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">รายการคำสั่งขาย</h1>
              <p className="mt-2 text-gray-600">
                ดูและจัดการธุรกรรมการขายทั้งหมด
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              กลับไปหน้าแดชบอร์ด
            </button>
          </div>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ตัวกรองข้อมูล
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLockedOnly}
                    onChange={(e) => {
                      setShowLockedOnly(e.target.checked);
                      if (e.target.checked) setShowUnlockedOnly(false);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    เฉพาะที่ล็อกแล้ว
                  </span>
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showUnlockedOnly}
                    onChange={(e) => {
                      setShowUnlockedOnly(e.target.checked);
                      if (e.target.checked) setShowLockedOnly(false);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    เฉพาะที่ยังไม่ล็อก
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                ใช้ตัวกรอง
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">ไม่พบคำสั่งขาย</p>
              <p className="text-gray-400 mt-2">
                ลองปรับตัวกรองหรือสร้างคำสั่งขายใหม่
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เลขที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      กำไรรวม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การทำงาน
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.customerName || (
                          <span className="text-gray-400 italic">ไม่ระบุ</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-semibold ${
                            order.totalProfit >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(order.totalProfit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.isLocked ? 'ล็อกแล้ว' : 'ยังไม่ล็อก'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            navigate(`/sales-orders/${order.id}`)
                          }
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          ดูรายละเอียด
                        </button>
                        {!order.isLocked && (
                          <button
                            onClick={() =>
                              handleDelete(order.id, order.isLocked)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            ลบ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">
                จำนวนคำสั่งขายทั้งหมด: {filteredOrders.length}
              </span>
              <span className="text-sm font-medium text-blue-900">
                กำไรรวม:{' '}
                <span className="text-lg font-bold">
                  {formatCurrency(
                    filteredOrders.reduce(
                      (sum, order) => sum + order.totalProfit,
                      0
                    )
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderList;
