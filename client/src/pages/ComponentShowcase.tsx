import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Label } from '@/components/common/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/common/Table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/common/Dialog'
import { Badge } from '@/components/common/Badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/common/Alert'
import { Skeleton } from '@/components/common/Skeleton'
import { Select } from '@/components/common/Select'
import { toast } from '../contexts/CustomToastContext'
import { AlertCircle, Package } from 'lucide-react'
import { DataTable, type ColumnDef } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'

interface SampleProduct {
  id: string
  name: string
  status: string
  price: number
  category: string
}

export default function ComponentShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dataTableLoading, setDataTableLoading] = useState(false)
  const [showEmptyData, setShowEmptyData] = useState(false)

  const sampleData: SampleProduct[] = [
    { id: '001', name: 'สินค้า A', status: 'พร้อมขาย', price: 1000, category: 'หมวด 1' },
    { id: '002', name: 'สินค้า B', status: 'หมด', price: 2500, category: 'หมวด 2' },
    { id: '003', name: 'สินค้า C', status: 'พร้อมขาย', price: 750, category: 'หมวด 1' },
    { id: '004', name: 'สินค้า D', status: 'พร้อมขาย', price: 1500, category: 'หมวด 3' },
    { id: '005', name: 'สินค้า E', status: 'หมด', price: 3000, category: 'หมวด 2' },
    { id: '006', name: 'สินค้า F', status: 'พร้อมขาย', price: 500, category: 'หมวด 1' },
    { id: '007', name: 'สินค้า G', status: 'พร้อมขาย', price: 2000, category: 'หมวด 3' },
    { id: '008', name: 'สินค้า H', status: 'หมด', price: 1800, category: 'หมวด 2' },
    { id: '009', name: 'สินค้า I', status: 'พร้อมขาย', price: 900, category: 'หมวด 1' },
    { id: '010', name: 'สินค้า J', status: 'พร้อมขาย', price: 1200, category: 'หมวด 3' },
    { id: '011', name: 'สินค้า K', status: 'หมด', price: 2200, category: 'หมวด 2' },
    { id: '012', name: 'สินค้า L', status: 'พร้อมขาย', price: 1600, category: 'หมวด 1' },
  ]

  const columns: ColumnDef<SampleProduct>[] = [
    {
      key: 'id',
      header: 'รหัส',
      sortable: true,
    },
    {
      key: 'name',
      header: 'ชื่อสินค้า',
      sortable: true,
    },
    {
      key: 'category',
      header: 'หมวดหมู่',
      sortable: true,
    },
    {
      key: 'status',
      header: 'สถานะ',
      render: (item) => (
        <Badge variant={item.status === 'พร้อมขาย' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'price',
      header: 'ราคา',
      sortable: true,
      className: 'text-right',
      render: (item) => `฿${item.price.toLocaleString()}`,
    },
  ]

  const toggleDataTableLoading = () => {
    setDataTableLoading(true)
    setTimeout(() => setDataTableLoading(false), 2000)
  }

  const showSuccessToast = () => {
    toast.success('การดำเนินการเสร็จสมบูรณ์');
  }

  const showErrorToast = () => {
    toast.error('ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง');
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold mb-2">Component Showcase</h1>
        <p className="text-muted-foreground">
          ทดสอบ UI Components ทั้งหมดในโหมด Light และ Dark
        </p>
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>ปุ่มต่างๆ ในรูปแบบและขนาดที่แตกต่างกัน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>ช่องกรอกข้อมูลต่างๆ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" placeholder="example@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disabled">Disabled Input</Label>
            <Input id="disabled" disabled placeholder="Disabled" />
          </div>
        </CardContent>
      </Card>

      {/* Select */}
      <Card>
        <CardHeader>
          <CardTitle>Select</CardTitle>
          <CardDescription>เลือกตัวเลือกจากรายการ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>เลือกผลไม้</Label>
            <Select>
              <option value="">เลือกผลไม้</option>
              <option value="apple">แอปเปิ้ล</option>
              <option value="banana">กล้วย</option>
              <option value="orange">ส้ม</option>
              <option value="mango">มะม่วง</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>ป้ายสถานะต่างๆ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>การแจ้งเตือนต่างๆ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ข้อมูล</AlertTitle>
            <AlertDescription>
              นี่คือข้อความแจ้งเตือนทั่วไป
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ข้อผิดพลาด</AlertTitle>
            <AlertDescription>
              เกิดข้อผิดพลาดในการดำเนินการ
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Table</CardTitle>
          <CardDescription>ตารางแสดงข้อมูล</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">ราคา</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>001</TableCell>
                <TableCell>สินค้า A</TableCell>
                <TableCell>
                  <Badge>พร้อมขาย</Badge>
                </TableCell>
                <TableCell className="text-right">฿1,000</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>002</TableCell>
                <TableCell>สินค้า B</TableCell>
                <TableCell>
                  <Badge variant="secondary">หมด</Badge>
                </TableCell>
                <TableCell className="text-right">฿2,500</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>003</TableCell>
                <TableCell>สินค้า C</TableCell>
                <TableCell>
                  <Badge>พร้อมขาย</Badge>
                </TableCell>
                <TableCell className="text-right">฿750</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton Loaders</CardTitle>
          <CardDescription>ตัวโหลดข้อมูล</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog & Dropdown & Toast */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Components</CardTitle>
          <CardDescription>Dialog, Dropdown Menu และ Toast</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger onClick={() => setDialogOpen(true)}>
                <Button variant="secondary">เปิด Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ยืนยันการดำเนินการ</DialogTitle>
                  <DialogDescription>
                    คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>ยืนยัน</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={showSuccessToast}>แสดง Success Toast</Button>
            <Button variant="destructive" onClick={showErrorToast}>
              แสดง Error Toast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DataTable Component */}
      <Card>
        <CardHeader>
          <CardTitle>DataTable Component</CardTitle>
          <CardDescription>
            ตารางข้อมูลพร้อมการค้นหา เรียงลำดับ และแบ่งหน้า
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEmptyData(!showEmptyData)}
            >
              {showEmptyData ? 'แสดงข้อมูล' : 'แสดงข้อมูลว่าง'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleDataTableLoading}
              disabled={dataTableLoading}
            >
              {dataTableLoading ? 'กำลังโหลด...' : 'ทดสอบ Loading'}
            </Button>
          </div>
          <DataTable
            data={showEmptyData ? [] : sampleData}
            columns={columns}
            searchKey="name"
            searchPlaceholder="ค้นหาชื่อสินค้า..."
            loading={dataTableLoading}
            pageSize={5}
            emptyState={
              <EmptyState
                icon={<Package className="h-10 w-10 text-muted-foreground" />}
                title="ไม่มีสินค้า"
                description="เริ่มต้นโดยการเพิ่มสินค้าใหม่เข้าสู่ระบบ"
                action={{
                  label: 'เพิ่มสินค้า',
                  onClick: () => toast.info('คลิกเพิ่มสินค้า!'),
                }}
              />
            }
          />
        </CardContent>
      </Card>

      {/* EmptyState Component */}
      <Card>
        <CardHeader>
          <CardTitle>EmptyState Component</CardTitle>
          <CardDescription>แสดงสถานะเมื่อไม่มีข้อมูล</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmptyState
            icon={<Package className="h-10 w-10 text-muted-foreground" />}
            title="ไม่มีรายการ"
            description="คุณยังไม่มีรายการใดๆ ในระบบ เริ่มต้นโดยการเพิ่มรายการใหม่"
            action={{
              label: 'เพิ่มรายการ',
              onClick: () => toast.info('คลิกเพิ่มรายการ!'),
            }}
          />
        </CardContent>
      </Card>

      {/* LoadingState Component */}
      <Card>
        <CardHeader>
          <CardTitle>LoadingState Component</CardTitle>
          <CardDescription>สถานะการโหลดในรูปแบบต่างๆ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Spinner</h3>
            <LoadingState type="spinner" />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Skeleton (3 rows)</h3>
            <LoadingState type="skeleton" count={3} />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Page Loading</h3>
            <div className="border rounded-lg">
              <LoadingState type="page" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
