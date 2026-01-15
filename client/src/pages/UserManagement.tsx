import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { toast } from '../contexts/CustomToastContext';
import { useApiError } from '../hooks/useApiError';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select } from '@/components/common/Select';
import { Users, UserPlus, Pencil, Trash2 } from 'lucide-react';
import type { Role } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  username: string;
  password: string;
  role: Role;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { handleError } = useApiError();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'STAFF',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<User[]>('/users');
      setUsers(response.data);
    } catch (err: any) {
      handleError(err, 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'กรุณากรอกชื่อผู้ใช้';
    } else if (formData.username.length < 3) {
      errors.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
    }
    
    if (!editingUser && !formData.password) {
      errors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (!editingUser && formData.password.length < 6) {
      errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/users', formData);
      toast.success('สร้างผู้ใช้งานสำเร็จ');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      handleError(err, 'ไม่สามารถสร้างผู้ใช้งานได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser || !validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData: any = {
        username: formData.username,
        role: formData.role,
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await apiClient.put(`/users/${editingUser.id}`, updateData);
      toast.success('อัปเดตผู้ใช้งานสำเร็จ');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      handleError(err, 'ไม่สามารถอัปเดตผู้ใช้งานได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsSubmitting(true);
      await apiClient.delete(`/users/${userToDelete.id}`);
      toast.success('ลบผู้ใช้งานสำเร็จ');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      handleError(err, 'ไม่สามารถลบผู้ใช้งานได้');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const startDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'STAFF',
    });
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Define table columns
  const columns: ColumnDef<User>[] = [
    {
      key: 'id',
      header: 'รหัส',
      sortable: true,
    },
    {
      key: 'username',
      header: 'ชื่อผู้ใช้',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2">
          <span>{user.username}</span>
          {user.id === currentUser?.id && (
            <Badge variant="secondary">คุณ</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'บทบาท',
      sortable: true,
      render: (user) => (
        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
          {user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'วันที่สร้าง',
      sortable: true,
      render: (user) => new Date(user.createdAt).toLocaleDateString('th-TH'),
    },
    {
      key: 'actions',
      header: 'การดำเนินการ',
      render: (user) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startEdit(user)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            แก้ไข
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startDelete(user)}
            disabled={user.id === currentUser?.id}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            ลบ
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground mt-1">
            จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="h-4 w-4 mr-2" />
          เพิ่มผู้ใช้งาน
        </Button>
      </div>

      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        searchKey="username"
        searchPlaceholder="ค้นหาชื่อผู้ใช้..."
        loading={isLoading}
        emptyState={
          <EmptyState
            icon={<Users className="h-10 w-10 text-muted-foreground" />}
            title="ไม่มีผู้ใช้งาน"
            description="เริ่มต้นโดยการเพิ่มผู้ใช้งานคนแรก"
            action={{
              label: 'เพิ่มผู้ใช้งาน',
              onClick: openCreateDialog,
            }}
          />
        }
      />

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างผู้ใช้งานใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-username">ชื่อผู้ใช้</Label>
                <Input
                  id="create-username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="กรอกชื่อผู้ใช้"
                  error={formErrors.username}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">รหัสผ่าน</Label>
                <Input
                  id="create-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="กรอกรหัสผ่าน"
                  error={formErrors.password}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role">บทบาท</Label>
                <Select 
                  id="create-role"
                  value={formData.role} 
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
                >
                  <option value="STAFF">พนักงาน</option>
                  <option value="ADMIN">ผู้ดูแลระบบ</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังสร้าง...' : 'สร้างผู้ใช้งาน'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขผู้ใช้งาน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลผู้ใช้งาน {editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">ชื่อผู้ใช้</Label>
                <Input
                  id="edit-username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="กรอกชื่อผู้ใช้"
                  error={formErrors.username}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">รหัสผ่าน (เว้นว่างไว้เพื่อเก็บรหัสผ่านเดิม)</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="กรอกรหัสผ่านใหม่"
                  error={formErrors.password}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">บทบาท</Label>
                <Select 
                  id="edit-role"
                  value={formData.role} 
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
                >
                  <option value="STAFF">พนักงาน</option>
                  <option value="ADMIN">ผู้ดูแลระบบ</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังอัปเดต...' : 'อัปเดตผู้ใช้งาน'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน <strong>{userToDelete?.username}</strong>?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
