import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthAPI } from '../utils/api';

const ResetPasswordPage: React.FC = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = sp.get('token') || '';
    setToken(t);
  }, [sp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { alert('Thiếu token'); return; }
    setLoading(true);
    try {
      await AuthAPI.reset(token, password);
      alert('Đặt lại mật khẩu thành công. Hãy đăng nhập.');
      navigate('/login');
    } catch (e) {
      alert('Token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-6 card p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Đặt lại mật khẩu</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Mật khẩu mới</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
