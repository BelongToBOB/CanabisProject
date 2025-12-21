import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../services/api';

interface LineItem {
  id: number;
  batchId: number;
  batchIdentifier: string;
  productName: string;
  quantitySold: number;
  sellingPricePerUnit: number;
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
      setError(err.response?.data?.message || 'ไม่สามารถดึงรายละเอียดคำสั่งขายได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    if (order.isLocked) {
      setError('ไม่สามารถลบคำสั่งขายที่ถูกล็อกได้');
      return;
    }

    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งขายนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await apiClient.delete(`/sales-orders/${id}`);
      navigate('/sales-orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'ไม่สามารถลบคำสั่งขายได้');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `฿${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดรายละเอียดคำสั่งขาย...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={() => navigate('/sales-orders')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              กลับไปยังรายการคำสั่งขาย
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  คำสั่งขายเลขที่ #{order.id}
                </h1>
                {order.isLocked ? (
                  <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                    ล็อกแล้ว
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    ยังไม่ล็อก
                  </span>
                )}
              </div>
              <p className="mt-2 text-gray-600">
                ดูรายละเอียดข้อมูลของรายการขายนี้
              </p>
            </div>
            <button
              onClick={() => navigate('/sales-orders')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              กลับไปยังรายการ
            </button>
          </div>

          {/* Order Info */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg ">
              <h2 className="text-sm font-medium text-gray-500 mb-3">
                ข้อมูลคำสั่งขาย
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>วันที่ขาย:</span>
                  <span>{formatDate(order.orderDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ชื่อลูกค้า:</span>
                  <span>{order.customerName || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนรายการ:</span>
                  <span>{order.lineItems.length}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg ">
              <h2 className="text-sm font-medium text-blue-700 mb-3">
                สรุปผลทางการเงิน
              </h2>
              <div className="flex justify-between items-center">
                <span>กำไรรวม:</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(order.totalProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <h2 className="text-xl font-semibold mb-4">รายการสินค้า</h2>
          <table className="w-full ">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">สินค้า</th>
                <th className="p-2 text-left">ล็อต</th>
                <th className="p-2 text-right">จำนวน</th>
                <th className="p-2 text-right">ต้นทุน/หน่วย</th>
                <th className="p-2 text-right">ราคาขาย/หน่วย</th>
                <th className="p-2 text-right">กำไร</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems.map(item => (
                <tr key={item.id} >
                  <td className="p-2">{item.productName || 'ไม่ระบุ'}</td>
                  <td className="p-2">{item.batchIdentifier || 'ไม่ระบุ'}</td>
                  <td className="p-2 text-right">{item.quantitySold}</td>
                  <td className="p-2 text-right">
                    {formatCurrency(item.sellingPricePerUnit / (1 + (item.lineProfit / (item.sellingPricePerUnit * item.quantitySold))))}
                  </td>
                  <td className="p-2 text-right">
                    {formatCurrency(item.sellingPricePerUnit)}
                  </td>
                  <td className="p-2 text-right">
                    {formatCurrency(item.lineProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => navigate('/sales-orders')}
              className="px-6 py-3 bg-gray-300 rounded-md"
            >
              กลับไปยังรายการ
            </button>
            {!order.isLocked && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-red-600 text-white rounded-md"
              >
                {isDeleting ? 'กำลังลบ...' : 'ลบคำสั่งขาย'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetail;
