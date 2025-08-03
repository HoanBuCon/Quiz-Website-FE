import React from 'react';

// Component Footer của website
const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} LiemDai. Bản quyền thuộc về @hoanbucon
            </p>
          </div>
          <div className="flex space-x-6">
            <a
              href="http://hoanbucon.id.vn/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {}}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              Về chúng tôi
            </a>
            <a
              href="http://hoanbucon.id.vn/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {}}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              Hỗ trợ
            </a>
            <a
              href="http://hoanbucon.id.vn/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {}}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
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