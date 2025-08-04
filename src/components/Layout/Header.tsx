import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useMusic } from '../../context/MusicContext';
import { FaMusic } from 'react-icons/fa';

// Component Header chính của website
const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { showMusicPlayer, toggleMusicPlayer, isPlaying } = useMusic();
  const location = useLocation();

  // Danh sách các trang navigation
  const navItems = [
    { path: '/', label: 'Trang chủ' },
    { path: '/classes', label: 'Lớp học' },
    { path: '/create', label: 'Tạo lớp' },
    { path: '/documents', label: 'Tài liệu' },
  ];

  // Kiểm tra xem link có active không
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 shadow-xl border-b border-slate-200/80 dark:border-slate-700/80 header-texture premium-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group hover:scale-105 transition-transform duration-200 ease-out">
              {/* Logo với Trollface không có nền */}
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="/Trollface.png" 
                  alt="Trollface Logo" 
                  className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-200 ease-out"
                />
              </div>
              <span className="text-xl logo-text">
                liemdai
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium relative group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-primary-300/90 to-primary-200/90 dark:from-primary-900/50 dark:to-primary-800/50 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-300/40 shadow-primary-300/30 dark:border-primary-700/30 dark:shadow-primary-700/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.label}
                {/* Thanh loading hover effect cho tất cả items */}
                <div className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 ease-out ${
                  isActive(item.path) 
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500' 
                    : 'bg-gradient-to-r from-primary-500 to-primary-400'
                }`}></div>
              </Link>
            ))}
          </nav>

          {/* Theme Toggle Button and Music Player Button */}
          <div className="flex items-center space-x-4">
            {/* Music Player Toggle Button */}
            <button
              onClick={toggleMusicPlayer}
              className={`p-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md ${
                showMusicPlayer
                  ? 'bg-gradient-to-br from-primary-200 to-primary-300 dark:from-primary-800 dark:to-primary-700 text-primary-700 dark:text-primary-300'
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600'
              }`}
              aria-label="Toggle Music Player"
              title={showMusicPlayer ? 'Ẩn Music Player' : 'Hiện Music Player'}
            >
              {React.createElement(FaMusic as any, { 
                className: `w-5 h-5 transition-transform duration-200 ${
                  isPlaying ? 'music-spinning' : ''
                } ${showMusicPlayer ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}` 
              })}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 shadow-sm hover:shadow-md"
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 