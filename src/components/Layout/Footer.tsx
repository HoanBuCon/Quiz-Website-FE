import React from 'react';

// Component Footer của website
const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-700/80 mt-auto shadow-xl footer-texture premium-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              © {new Date().getFullYear()} 
              <span className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent font-bold mx-2">
                LiemDai
              </span>
              Bản quyền thuộc về @hoanbucon
            </p>
          </div>
          <div className="flex space-x-8">
            <a
              href="http://hoanbucon.id.vn/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {}}
              className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 font-medium hover:scale-105 transform"
            >
              Về chúng tôi
            </a>
            <a
              href="http://hoanbucon.id.vn/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {}}
              className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 font-medium hover:scale-105 transform"
            >
              Hỗ trợ
            </a>
            <a
              href="http://hoanbucon.id.vn/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {}}
              className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 font-medium hover:scale-105 transform"
            >
              Liên hệ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 