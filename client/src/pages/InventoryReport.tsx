import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

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

type SortField = 'productName' | 'batchIdentifier';
type SortOrder = 'asc' | 'desc';

const InventoryReport: React.FC = () => {
  const [reportData, setReportData] = useState<InventoryReportResponse | null>(null);
  const [filteredBatches, setFilteredBatches] = useState<InventoryBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productNameFilter, setProductNameFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('productName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    fetchInventoryReport();
  }, []);

  useEffect(() => {
    if (!reportData) return;

    let filtered = [...reportData.items];

    if (productNameFilter.trim() !== '') {
      filtered = filtered.filter(batch =>
        batch.productName.toLowerCase().includes(productNameFilter.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'productName') {
        comparison = a.productName.localeCompare(b.productName);
        if (comparison === 0) {
          comparison = a.batchIdentifier.localeCompare(b.batchIdentifier);
        }
      } else {
        comparison = a.batchIdentifier.localeCompare(b.batchIdentifier);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBatches(filtered);
  }, [reportData, productNameFilter, sortField, sortOrder]);

  const fetchInventoryReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<InventoryReportResponse>('/reports/inventory');
      setReportData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'ไม่สามารถดึงรายงานสต็อกสินค้าได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (amount: number): string => {
    return `฿${amount.toFixed(2)}`;
  };

  const calculateFilteredInventoryValue = (): number => {
    return filteredBatches.reduce((sum, batch) => {
      return sum + batch.currentQuantity * batch.purchasePricePerUnit;
    }, 0);
  };

  const getSortIcon = (field: SortField): string => {
    if (sortField !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดรายงานสต็อกสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">รายงานสต็อกสินค้า</h1>
            <p className="mt-2 text-gray-600">
              แสดงสถานะสต็อกปัจจุบันและมูลค่ารวมของสินค้า
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {reportData && (
            <>
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-800 uppercase tracking-wide">
                      มูลค่าสต็อกรวมทั้งหมด
                    </p>
                    <p className="mt-2 text-4xl font-bold text-blue-900">
                      {formatCurrency(reportData.totalInventoryValue)}
                    </p>
                    {productNameFilter && (
                      <p className="mt-2 text-sm text-blue-700">
                        มูลค่าตามตัวกรอง: {formatCurrency(calculateFilteredInventoryValue())}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">จำนวนล็อตทั้งหมด</p>
                    <p className="text-2xl font-semibold text-blue-900">
                      {reportData.items.length}
                    </p>
                    {productNameFilter && (
                      <p className="mt-1 text-sm text-blue-700">
                        แสดงอยู่: {filteredBatches.length}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค้นหาตามชื่อสินค้า
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productNameFilter}
                    onChange={(e) => setProductNameFilter(e.target.value)}
                    className="block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="พิมพ์ชื่อสินค้า..."
                  />
                  {productNameFilter && (
                    <button
                      onClick={() => setProductNameFilter('')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      ล้างค่า
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th onClick={() => handleSort('productName')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                        ชื่อสินค้า {getSortIcon('productName')}
                      </th>
                      <th onClick={() => handleSort('batchIdentifier')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                        รหัสล็อต {getSortIcon('batchIdentifier')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จำนวนคงเหลือ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ราคาทุนต่อหน่วย
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        มูลค่าสต็อก
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBatches.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          ไม่พบข้อมูลสต็อก
                        </td>
                      </tr>
                    ) : (
                      filteredBatches.map(batch => (
                        <tr key={batch.id} className={batch.isDepleted ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{batch.productName}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{batch.batchIdentifier}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{batch.currentQuantity}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(batch.purchasePricePerUnit)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {formatCurrency(batch.currentQuantity * batch.purchasePricePerUnit)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {batch.isDepleted ? 'หมดสต็อก' : 'มีสินค้า'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
