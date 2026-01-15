import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Alert, AlertDescription } from '@/components/common/Alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { Select } from '@/components/common/Select';
import { Label } from '@/components/common/Label';
import { 
  TrendingUp, 
  AlertCircle, 
  Calendar,
  DollarSign,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ProfitShare {
  id: number;
  month: number;
  year: number;
  totalProfit: number;
  amountPerOwner: number;
  executionDate: string;
}

const ProfitShareHistory: React.FC = () => {
  const [profitShares, setProfitShares] = useState<ProfitShare[]>([]);
  const [filteredProfitShares, setFilteredProfitShares] = useState<ProfitShare[]>([]);
  const [selectedProfitShare, setSelectedProfitShare] = useState<ProfitShare | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  useEffect(() => {
    fetchProfitShares();
  }, []);

  useEffect(() => {
    // Filter profit shares by selected year
    if (selectedYear === 'all') {
      setFilteredProfitShares(profitShares);
    } else {
      setFilteredProfitShares(
        profitShares.filter((ps) => ps.year === parseInt(selectedYear))
      );
    }
  }, [selectedYear, profitShares]);

  const fetchProfitShares = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get<ProfitShare[]>('/profit-shares');
      setProfitShares(response.data);
      setFilteredProfitShares(response.data);
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

  // Get unique years for filtering
  const availableYears = Array.from(
    new Set(profitShares.map((ps) => ps.year))
  ).sort((a, b) => b - a);

  // Define table columns
  const columns: ColumnDef<ProfitShare>[] = [
    {
      key: 'executionDate',
      header: 'วันที่ดำเนินการ',
      sortable: true,
      render: (item) => formatDate(item.executionDate),
    },
    {
      key: 'month',
      header: 'เดือน / ปี',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{monthNames[item.month - 1]} {item.year}</span>
        </div>
      ),
    },
    {
      key: 'totalProfit',
      header: 'กำไรรวม',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-600">
            {formatCurrency(item.totalProfit)}
          </span>
        </div>
      ),
    },
    {
      key: 'amountPerOwner',
      header: 'ส่วนแบ่งต่อคน',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-600">
            {formatCurrency(item.amountPerOwner)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: () => (
        <Badge variant="secondary">
          เสร็จสิ้น
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'การทำงาน',
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedProfitShare(item)}
        >
          <Eye className="h-4 w-4 mr-2" />
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">ประวัติการแบ่งกำไร</h1>
        <p className="text-muted-foreground mt-2">
          แสดงประวัติการแบ่งกำไรรายเดือนระหว่างเจ้าของ
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Year Filter */}
      {!loading && profitShares.length > 0 && (
        <div className="flex items-center gap-4">
          <Label htmlFor="year-filter">กรองตามปี:</Label>
          <Select 
            id="year-filter" 
            className="w-[180px]"
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            {availableYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={filteredProfitShares}
        columns={columns}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
            title="ยังไม่มีการแบ่งกำไร"
            description="ข้อมูลจะแสดงหลังจากระบบทำการแบ่งกำไรรายเดือน"
          />
        }
      />

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedProfitShare}
        onOpenChange={(open: boolean) => !open && setSelectedProfitShare(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>รายละเอียดการแบ่งกำไร</DialogTitle>
            <DialogDescription>
              {selectedProfitShare && (
                <>
                  เดือน {monthNames[selectedProfitShare.month - 1]}{' '}
                  {selectedProfitShare.year}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedProfitShare && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    วันที่ดำเนินการ:
                  </span>
                  <span className="font-medium">
                    {formatDate(selectedProfitShare.executionDate)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    เดือน / ปี:
                  </span>
                  <span className="font-medium">
                    {monthNames[selectedProfitShare.month - 1]}{' '}
                    {selectedProfitShare.year}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    กำไรรวม:
                  </span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedProfitShare.totalProfit)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    ส่วนแบ่งต่อเจ้าของ (50%):
                  </span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatCurrency(selectedProfitShare.amountPerOwner)}
                  </span>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  หมายเหตุ: การแบ่งกำไรนี้ไม่สามารถแก้ไขหรือลบได้
                  และออเดอร์ทั้งหมดของเดือนนี้ถูกล็อกแล้ว
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfitShareHistory;
