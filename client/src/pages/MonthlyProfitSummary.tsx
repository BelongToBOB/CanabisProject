import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

interface MonthlyProfitSummary {
  month: number;
  year: number;
  totalProfit: number;
  numberOfOrders: number;
  startDate: string;
  endDate: string;
}

const MonthlyProfitSummary: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [summary, setSummary] = useState<MonthlyProfitSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i);

  useEffect(() => {
    fetchMonthlyProfitSummary();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyProfitSummary = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get<MonthlyProfitSummary>(
        `/reports/monthly-profit?month=${selectedMonth}&year=${selectedYear}`
      );
      setSummary(response.data);
    } catch (err: any) {
      console.error('Error fetching monthly profit summary:', err);
      setError(
        err.response?.data?.message ||
        'ไม่สามารถโหลดสรุปกำไรรายเดือนได้ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              สรุปกำไรรายเดือน
            </h1>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              กลับไปหน้าแดชบอร์ด
            </button>
          </div>

          {/* Month / Year Selector */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousMonth}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                ← เดือนก่อนหน้า
              </button>

              <div className="flex gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เดือน
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {monthNames.map((name, index) => (
                      <option key={index + 1} value={index + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ปี
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleNextMonth}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                เดือนถัดไป →
              </button>
            </div>
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
              <p className="text-gray-600">กำลังโหลดข้อมูลสรุปกำไร...</p>
            </div>
          )}

          {/* Summary */}
          {!loading && summary && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {monthNames[summary.month - 1]} {summary.year}
                </h2>
                <p className="text-gray-600">
                  ช่วงเวลา: {formatDate(summary.startDate)} – {formatDate(summary.endDate)}
                </p>
              </div>

              {summary.numberOfOrders === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    ไม่พบรายการขาย
                  </h3>
                  <p className="text-yellow-800">
                    ไม่มีรายการขายในเดือนนี้
                  </p>
                  <p className="text-yellow-800 mt-2">
                    กำไรรวม: {formatCurrency(0)}
                  </p>
                </div>
              )}

              {summary.numberOfOrders > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-green-900 mb-2">
                      กำไรรวม
                    </h3>
                    <p className={`text-3xl font-bold ${
                      summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(summary.totalProfit)}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">
                      จำนวนออเดอร์
                    </h3>
                    <p className="text-3xl font-bold text-blue-700">
                      {summary.numberOfOrders}
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-purple-900 mb-2">
                      กำไรเฉลี่ยต่อออเดอร์
                    </h3>
                    <p className="text-3xl font-bold text-purple-700">
                      {formatCurrency(summary.totalProfit / summary.numberOfOrders)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyProfitSummary;
