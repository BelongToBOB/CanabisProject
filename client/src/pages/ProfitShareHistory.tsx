import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

interface ProfitShare {
  id: number;
  month: number;
  year: number;
  totalProfit: number;
  amountPerOwner: number;
  executionDate: string;
}

const ProfitShareHistory: React.FC = () => {
  const navigate = useNavigate();
  const [profitShares, setProfitShares] = useState<ProfitShare[]>([]);
  const [selectedProfitShare, setSelectedProfitShare] = useState<ProfitShare | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  useEffect(() => {
    fetchProfitShares();
  }, []);

  const fetchProfitShares = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get<ProfitShare[]>('/profit-shares');
      setProfitShares(response.data);
    } catch (err: any) {
      console.error('Error fetching profit shares:', err);
      setError(
        err.response?.data?.message ||
        'ไม่สามารถโหลดประวัติการแบ่งกำไรได้ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `฿${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewDetail = (profitShare: ProfitShare) => {
    setSelectedProfitShare(profitShare);
  };

  const handleCloseDetail = () => {
    setSelectedProfitShare(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ประวัติการแบ่งกำไร
              </h1>
              <p className="mt-2 text-gray-600">
                แสดงประวัติการแบ่งกำไรรายเดือนระหว่างเจ้าของ
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              กลับไปหน้าแดชบอร์ด
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลการแบ่งกำไร...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && profitShares.length === 0 && !error && (
            <div className="text-center py-12">
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                ยังไม่มีการแบ่งกำไร
              </h3>
              <p className="mt-2 text-gray-600">
                ข้อมูลจะแสดงหลังจากระบบทำการแบ่งกำไรรายเดือน
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && profitShares.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่ดำเนินการ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เดือน / ปี
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      กำไรรวม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ส่วนแบ่งต่อคน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การทำงาน
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profitShares.map((ps) => (
                    <tr key={ps.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(ps.executionDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {monthNames[ps.month - 1]} {ps.year}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        {formatCurrency(ps.totalProfit)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        {formatCurrency(ps.amountPerOwner)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleViewDetail(ps)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedProfitShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">
                รายละเอียดการแบ่งกำไร
              </h2>
              <button onClick={handleCloseDetail} className="text-gray-500">
                ✕
              </button>
            </div>

            <p className="text-gray-700 mb-2">
              เดือน {monthNames[selectedProfitShare.month - 1]} {selectedProfitShare.year}
            </p>

            <p className="text-lg font-semibold">
              กำไรรวม: {formatCurrency(selectedProfitShare.totalProfit)}
            </p>

            <p className="text-lg font-semibold mt-2">
              ส่วนแบ่งต่อเจ้าของ (50%): {formatCurrency(selectedProfitShare.amountPerOwner)}
            </p>

            <p className="mt-4 text-sm text-gray-600">
              หมายเหตุ: การแบ่งกำไรนี้ไม่สามารถแก้ไขหรือลบได้ และออเดอร์ทั้งหมดของเดือนนี้ถูกล็อกแล้ว
            </p>

            <div className="mt-6 text-right">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitShareHistory;
