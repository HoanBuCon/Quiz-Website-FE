import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '../utils/api';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [otpStage, setOtpStage] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [done, setDone] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await AuthAPI.forgotOtp(email.trim());
      setInfo('Đã gửi mã OTP vào email của bạn. Vui lòng kiểm tra hộp thư (kể cả mục Spam).');
      setOtpStage('verify');
    } catch (e: any) {
      setError(e?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (password !== password2) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    setLoading(true);
    try {
      await AuthAPI.resetWithOtp(email.trim(), otp.trim(), password);
      setDone(true);
      setInfo('Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới!');
    } catch (e: any) {
      setError(e?.message || 'OTP không hợp lệ hoặc đã hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/Trollface.png" alt="Logo" className="h-12 w-12 mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quên mật khẩu</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
            Hãy nhập email để nhận mã xác thực (OTP)
          </p>
        </div>

        {(error || (info && !done)) && (
          <div
            className={`p-3 rounded-xl text-sm mb-4 ${
              error
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}
          >
            {error || info}
          </div>
        )}

        {/* Giai đoạn 1: Nhập email */}
        {otpStage === 'request' && (
          <form onSubmit={handleRequest} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your_email@email.com"
                required
                className="mt-2 w-full rounded-xl border px-3 py-2.5 bg-transparent shadow-sm
                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                           dark:text-white dark:border-gray-600 border-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-white font-medium bg-primary-600 hover:bg-primary-700 
                         focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition-all duration-200 
                         disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>

            <div className="text-center mt-4">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}

        {/* Giai đoạn 2: Nhập OTP & mật khẩu mới */}
        {otpStage === 'verify' && (
          <form onSubmit={handleReset} className="space-y-6">
            {!done ? (
              <>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mã OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6 chữ số"
                    required
                    className="mt-2 w-full rounded-xl border px-3 py-2.5 bg-transparent shadow-sm 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                               dark:text-white dark:border-gray-600 border-gray-300"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mật khẩu mới
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="your_password"
                    required
                    className="mt-2 w-full rounded-xl border px-3 py-2.5 bg-transparent shadow-sm 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                               dark:text-white dark:border-gray-600 border-gray-300"
                  />
                </div>

                <div>
                  <label htmlFor="password2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="password2"
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="your_password"
                    required
                    className="mt-2 w-full rounded-xl border px-3 py-2.5 bg-transparent shadow-sm 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                               dark:text-white dark:border-gray-600 border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOtpStage('request')}
                    className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 underline"
                  >
                    Nhập email khác
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-4 rounded-xl text-white font-medium bg-primary-600 hover:bg-primary-700 
                               focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition-all duration-200 
                               disabled:opacity-50"
                  >
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>

                <div className="text-center mt-4">
                  <Link
                    to="/login"
                    className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    ← Quay lại đăng nhập
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-6 text-center">
                <p className="text-green-600 dark:text-green-400 font-medium">{info}</p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 rounded-xl text-white font-medium bg-primary-600 hover:bg-primary-700 
                             focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition-all duration-200"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
