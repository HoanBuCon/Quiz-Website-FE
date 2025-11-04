import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthAPI } from '../utils/api';

const ResetPasswordPage: React.FC = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = sp.get('token') || '';
    setToken(t);
  }, [sp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError('Thiếu token'); return; }
    if (password !== password2) { setError('Mật khẩu xác nhận không khớp'); return; }
    setLoading(true);
    setError('');
    try {
      await AuthAPI.reset(token, password);
      setDone(true);
    } catch (e) {
      setError('Token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-6 card p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Đặt lại mật khẩu</h1>

        {error && (
          <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-sm text-red-800 dark:text-red-200">{error}</div>
        )}
        {done && (
          <div className="p-3 rounded bg-green-50 dark:bg-green-900/20 text-sm text-green-800 dark:text-green-200 flex items-center justify-between">
            <span>Đổi mật khẩu thành công.</span>
            <button onClick={() => navigate('/login')} className="btn-primary">Đăng nhập</button>
          </div>
        )}

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Mật khẩu mới</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="your_password"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="your_password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded bg-green-50 dark:bg-green-900/20 text-sm text-green-800 dark:text-green-200">
              Đổi mật khẩu thành công.
            </div>
            <button onClick={() => navigate('/login')} className="w-full btn-primary">Đăng nhập</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
