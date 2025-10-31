import React, { useState } from 'react';
import { AuthAPI } from '../utils/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AuthAPI.forgot(email.trim());
      setResetLink(res.resetLink);
      setResetToken(res.resetToken);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-6 card p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Quên mật khẩu</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="your@email.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại' }
          </button>
        </form>

        {resetLink && (
          <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-200">
            <p className="mb-1">Link đặt lại (demo):</p>
            <p className="break-all">{resetLink}</p>
            <p className="mt-2 mb-1">Token (demo):</p>
            <p className="break-all text-xs">{resetToken}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
