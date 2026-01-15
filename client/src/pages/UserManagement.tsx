import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useApiError } from '../hooks/useApiError';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const { showSuccess } = useToast();
  const { handleError } = useApiError();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'STAFF',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Delete confirmation state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<User[]>('/users');
      setUsers(response.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'ไม่สามารถดึงข้อมูลผู้ใช้งานได้';
      setError(errorMsg);
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
      setError(null);
      await apiClient.post('/users', formData);
      showSuccess('สร้างผู้ใช้งานสำเร็จ');
      setShowCreateForm(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'ไม่สามารถสร้างผู้ใช้งานได้';
      setError(errorMsg);
      handleError(err, 'ไม่สามารถสร้างผู้ใช้งานได้');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser || !validateForm()) {
      return;
    }

    try {
      setError(null);
      const updateData: any = {
        username: formData.username,
        role: formData.role,
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await apiClient.put(`/users/${editingUser.id}`, updateData);
      showSuccess('อัปเดตผู้ใช้งานสำเร็จ');
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'ไม่สามารถอัปเดตผู้ใช้งานได้';
      setError(errorMsg);
      handleError(err, 'ไม่สามารถอัปเดตผู้ใช้งานได้');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setError(null);
      await apiClient.delete(`/users/${userToDelete.id}`);
      showSuccess('ลบผู้ใช้งานสำเร็จ');
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'ไม่สามารถลบผู้ใช้งานได้';
      setError(errorMsg);
      handleError(err, 'ไม่สามารถลบผู้ใช้งานได้');
      setUserToDelete(null);
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
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'STAFF',
    });
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  if (isLoading) {
    return <LoadingSpinner fullScreen message="กำลังโหลดผู้ใช้งาน..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
              <p className="mt-2 text-gray-600">
                จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingUser(null);
                resetForm();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {showCreateForm ? 'ยกเลิก' : 'เพิ่มผู้ใช้งาน'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Create User Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">สร้างผู้ใช้งานใหม่</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label htmlFor="create-username" className="block text-sm font-medium text-gray-700">
                    ชื่อผู้ใช้
                  </label>
                  <input
                    type="text"
                    id="create-username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      formErrors.username ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="create-password" className="block text-sm font-medium text-gray-700">
                    รหัสผ่าน
                  </label>
                  <input
                    type="password"
                    id="create-password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      formErrors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="create-role" className="block text-sm font-medium text-gray-700">
                    บทบาท
                  </label>
                  <select
                    id="create-role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="STAFF">พนักงาน</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    สร้างผู้ใช้งาน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit User Form */}
          {editingUser && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                แก้ไขผู้ใช้งาน: {editingUser.username}
              </h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700">
                    ชื่อผู้ใช้
                  </label>
                  <input
                    type="text"
                    id="edit-username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      formErrors.username ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700">
                    รหัสผ่าน (เว้นว่างไว้เพื่อเก็บรหัสผ่านเดิม)
                  </label>
                  <input
                    type="password"
                    id="edit-password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      formErrors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">
                    บทบาท
                  </label>
                  <select
                    id="edit-role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="STAFF">พนักงาน</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    อัปเดตผู้ใช้งาน
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัส
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อผู้ใช้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      ไม่พบผู้ใช้งาน
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-blue-600">(คุณ)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => startEdit(user)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          disabled={user.id === currentUser?.id}
                          className={`${
                            user.id === currentUser?.id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ยืนยันการลบ
            </h3>
            <p className="text-gray-600 mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน <strong>{userToDelete.username}</strong>?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
