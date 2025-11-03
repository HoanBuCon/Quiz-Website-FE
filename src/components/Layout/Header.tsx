import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useMusic } from '../../context/MusicContext';
import { FaMusic, FaBars, FaTimes, FaSignOutAlt, FaUser, FaHome, FaBook, FaPlus, FaGraduationCap } from 'react-icons/fa';
import { getToken, clearToken } from '../../utils/auth';
import { toast } from 'react-hot-toast';

// Component Header chính của website
const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { showMusicPlayer, toggleMusicPlayer, isPlaying } = useMusic();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  const [userName, setUserName] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Load user info when logged in
  useEffect(() => {
    const loadUserInfo = async () => {
      const token = getToken();
      if (token) {
        try {
          const { AuthAPI } = await import('../../utils/api');
          const response = await AuthAPI.me(token);
          setUserName(response.user.name || response.user.email.split('@')[0]);
        } catch (error) {
          console.error('Failed to load user info:', error);
          // Fallback to email prefix if name not available
          setUserName(null);
        }
      } else {
        setUserName(null);
      }
    };
    
    if (isLoggedIn) {
      loadUserInfo();
    }
  }, [isLoggedIn]);

  // Update auth state when token changes
  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!getToken());
    
    const handleAuthChange = () => checkAuth();
    
    // Listen to custom auth change events and storage changes
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Hàm đăng xuất
  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setUserName(null);
    toast.success('Đã đăng xuất thành công!');
    // Trigger Header update
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  // Danh sách các trang navigation
  const navItems = [
    { path: '/', label: 'Trang chủ', icon: FaHome },
    { path: '/classes', label: 'Lớp học', icon: FaGraduationCap },
    { path: '/create', label: 'Tạo lớp', icon: FaPlus },
    { path: '/documents', label: 'Tài liệu', icon: FaBook },
  ];

  // Kiểm tra xem link có active không
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isUserMenuOpen && !target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <>
  <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-blue-600 dark:bg-gradient-to-r dark:from-[#1a1e3a] dark:to-[#181824] shadow-xl border-b border-slate-200/80 dark:border-slate-700/80">
        <div className="max-w-screen-2xl mx-auto relative z-10">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <div className="flex items-center min-w-0">
              <Link to="/" className="flex items-center space-x-2 group hover:scale-105 transition-transform duration-200 ease-out">
                {/* Logo với Trollface không có nền */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <img 
                    src="/Trollface.png" 
                    alt="Trollface Logo" 
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain group-hover:scale-110 transition-transform duration-200 ease-out"
                  />
                </div>
                <span className="text-lg sm:text-xl logo-text text-white dark:text-primary-300">
                  liemdai
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden nav:flex space-x-8">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium relative overflow-hidden group flex items-center gap-2 ${
                      isActive(item.path)
                        ? `${isDarkMode
                            ? 'bg-gradient-to-r from-primary-900/50 to-primary-800/50 text-primary-300 shadow-sm border border-primary-700/30 shadow-primary-700/20'
                            : 'header-nav-active border-0'} `
                        : 'text-white dark:text-slate-300 hover:text-primary-200 dark:hover:text-primary-400 hover:bg-blue-800/50 dark:hover:bg-slate-800/50 border-0'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.label}</span>
                    {/* Thanh loading shimmer effect cho tất cả items */}
                    <div className="nav-shimmer absolute left-0 right-0 bottom-0 w-full h-0.5 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Theme Toggle and Music Player Buttons */}
            <div className="hidden nav:flex items-center space-x-4">
              {/* Music Player Toggle Button */}
              <button
                onClick={toggleMusicPlayer}
                className={`p-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md aspect-square w-10 h-10 flex items-center justify-center ${
                  showMusicPlayer
                    ? 'bg-gradient-to-br from-primary-200 to-primary-300 dark:from-primary-800 dark:to-primary-700 text-primary-700 dark:text-primary-300'
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600'
                }`}
                aria-label="Toggle Music Player"
                title={showMusicPlayer ? 'Ẩn Music Player' : 'Hiện Music Player'}
              >
                {React.createElement(FaMusic as React.ComponentType<any>, { 
                  className: `w-5 h-5 ${
                    isPlaying ? 'animate-spin' : ''
                  } ${showMusicPlayer ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`, style: isPlaying ? { animationDuration: '2s' } : undefined
                })}
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 shadow-sm hover:shadow-md aspect-square w-10 h-10 flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  // Sun icon cho light mode
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  // Moon icon cho dark mode
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Auth Buttons */}
              {isLoggedIn ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 shadow-sm hover:shadow-md text-slate-700 dark:text-slate-300"
                  >
                    <FaUser className="w-4 h-4" />
                    <span>{userName || 'Tài khoản'}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                      <div className="py-1">
                        <Link
                          to="/classes"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <FaGraduationCap className="w-4 h-4 mr-3" />
                          <span>Lớp học của tôi</span>
                        </Link>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                        
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                        >
                          <FaSignOutAlt className="w-4 h-4 mr-3" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 shadow-sm hover:shadow-md text-slate-700 dark:text-slate-300"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button and controls */}
            <div className="flex nav:hidden items-center space-x-2">
              {/* Mobile Music Player Button */}
              <button
                onClick={toggleMusicPlayer}
                className={`p-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md aspect-square w-10 h-10 flex items-center justify-center ${
                  showMusicPlayer
                    ? 'bg-gradient-to-br from-primary-200 to-primary-300 dark:from-primary-800 dark:to-primary-700 text-primary-700 dark:text-primary-300'
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600'
                }`}
                aria-label="Toggle Music Player"
                title={showMusicPlayer ? 'Ẩn Music Player' : 'Hiện Music Player'}
              >
                {React.createElement(FaMusic as React.ComponentType<any>, {
                  className: `w-5 h-5 ${isPlaying ? 'animate-spin' : ''} ${showMusicPlayer ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`,
                  style: isPlaying ? { animationDuration: '2s' } : undefined
                })}
              </button>

              {/* Mobile Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 shadow-sm hover:shadow-md aspect-square w-10 h-10 flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 text-slate-600 dark:text-slate-400 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center aspect-square w-10 h-10"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? 
                  React.createElement(FaTimes as React.ComponentType<any>, { className: "w-5 h-5" }) : 
                  React.createElement(FaBars as React.ComponentType<any>, { className: "w-5 h-5" })
                }
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div className={`nav:hidden fixed top-16 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border-l-4 border-primary-600'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Mobile Auth Links */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-4">
              {isLoggedIn ? (
                <div className="space-y-2">
                  <Link
                    to="/classes"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <FaUser className="w-4 h-4 mr-2" />
                    <span>{userName || 'Tài khoản'}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center"
                  >
                    <FaSignOutAlt className="w-4 h-4 mr-2" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-base font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all duration-200 text-center"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="nav:hidden fixed inset-0 z-30 bg-black/20 dark:bg-black/40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Header;