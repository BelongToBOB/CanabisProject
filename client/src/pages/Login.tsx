import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from '../contexts/CustomToastContext';
import { useAuth, type LoginCredentials } from '../contexts/AuthContext';
import { getErrorMessage } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Label } from '../components/common/Label';

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setIsSubmitting(true);

    try {
      const credentials: LoginCredentials = {
        username: data.username,
        password: data.password,
      };

      await login(credentials);
      toast.success('เข้าสู่ระบบสำเร็จ!');
      navigate('/');
    } catch (err: any) {
      // Handle different error types
      const errorMessage = err.response?.status === 401
        ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        : getErrorMessage(err);
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            ระบบจัดการร้าน Era Chic
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">เข้าสู่ระบบบัญชีของคุณ</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username Field */}
          <div>
            <Label htmlFor="username" required>
              ชื่อผู้ใช้
            </Label>
            <div className="mt-1.5">
              <Input
                id="username"
                type="text"
                {...register('username', {
                  required: 'กรุณากรอกชื่อผู้ใช้',
                  minLength: {
                    value: 3,
                    message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร',
                  },
                })}
                error={errors.username?.message}
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <Label htmlFor="password" required>
              รหัสผ่าน
            </Label>
            <div className="mt-1.5">
              <Input
                id="password"
                type="password"
                {...register('password', {
                  required: 'กรุณากรอกรหัสผ่าน',
                  minLength: {
                    value: 6,
                    message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
                  },
                })}
                error={errors.password?.message}
                placeholder="กรอกรหัสผ่าน"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
