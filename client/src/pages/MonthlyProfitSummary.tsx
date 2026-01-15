import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Select } from '@/components/common/Select';
import { Label } from '@/components/common/Label';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MonthlyProfitSummary {
  month: number;
  year: number;
  totalProfit: number;
  numberOfOrders: number;
  startDate: string;
  endDate: string;
}

const MonthlyProfitSummary: React.FC = () => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">สรุปกำไรรายเดือน</h1>
        <p className="text-muted-foreground mt-2">
          ดูสรุปผลกำไรและยอดขายรายเดือน
        </p>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            เลือกช่วงเวลา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePreviousMonth}
              aria-label="เดือนก่อนหน้า"
              className="w-10 h-10 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1 space-y-2">
                <Label htmlFor="month-select">เดือน</Label>
                <Select
                  id="month-select"
                  value={selectedMonth.toString()}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {monthNames.map((name, index) => (
                    <option key={index + 1} value={(index + 1).toString()}>
                      {name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label htmlFor="year-select">ปี</Label>
                <Select
                  id="year-select"
                  value={selectedYear.toString()}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextMonth}
              aria-label="เดือนถัดไป"
              className="w-10 h-10 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
      )}

      {/* Summary Content */}
      {!loading && summary && (
        <div className="space-y-6">
          {/* Period Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {monthNames[summary.month - 1]} {summary.year}
              </CardTitle>
              <CardDescription>
                ช่วงเวลา: {formatDate(summary.startDate)} – {formatDate(summary.endDate)}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Empty State */}
          {summary.numberOfOrders === 0 && (
            <EmptyState
              icon={<ShoppingCart className="h-10 w-10 text-muted-foreground" />}
              title="ไม่พบรายการขาย"
              description="ไม่มีรายการขายในเดือนนี้ กำไรรวม: ฿0.00"
            />
          )}

          {/* Metrics Cards */}
          {summary.numberOfOrders > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Profit Card */}
              <Card hover>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    กำไรรวม
                  </CardTitle>
                  {summary.totalProfit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(summary.totalProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.totalProfit >= 0 ? 'กำไร' : 'ขาดทุน'}ในเดือนนี้
                  </p>
                </CardContent>
              </Card>

              {/* Number of Orders Card */}
              <Card hover>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    จำนวนออเดอร์
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.numberOfOrders}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    คำสั่งซื้อทั้งหมด
                  </p>
                </CardContent>
              </Card>

              {/* Average Profit per Order Card */}
              <Card hover>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    กำไรเฉลี่ยต่อออเดอร์
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(summary.totalProfit / summary.numberOfOrders)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    กำไรเฉลี่ยต่อคำสั่งซื้อ
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthlyProfitSummary;
