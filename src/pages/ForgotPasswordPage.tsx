import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '../utils/api';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpStage, setOtpStage] = useState<'request'|'verify'>('request');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [done, setDone] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await AuthAPI.forgotOtp(email.trim());
      setInfo('Đã gửi mã OTP vào Email, vui lòng kiểm tra hộp thư. Nếu không thấy, hãy kiểm tra trong mục Spam!');
      setOtpStage('verify');
    } catch (e: any) {
      setError(e?.message || 'Không thể gửi OTP. Vui lòng thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await AuthAPI.resetWithOtp(email.trim(), otp.trim(), password);
      setInfo('Đổi mật khẩu thành công. Hãy đăng nhập với mật khẩu mới!');
      setDone(true);
      setOtp('');
      setPassword('');
      setPassword2('');
    } catch (e: any) {
      setError(e?.message || 'OTP không hợp lệ hoặc đã hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-6 card p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Quên mật khẩu</h1>

        {error && (
          <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-sm text-red-800 dark:text-red-200">{error}</div>
        )}
        {info && (
          <div className="p-3 rounded bg-green-50 dark:bg-green-900/20 text-sm text-green-800 dark:text-green-200">{info}</div>
        )}

        {otpStage === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="your_email@email.com"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}

        {otpStage === 'verify' && (
          !done ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Mã OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="6 chữ số"
                  required
                />
              </div>
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
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setOtpStage('request')} className="text-sm text-gray-600 dark:text-gray-300 underline">
                  Nhập email khác
                </button>
                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </div>
              <div className="text-center mt-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <button type="button" onClick={() => navigate('/login')} className="w-full btn-primary">
                Đăng nhập
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
