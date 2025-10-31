import React, { useState, useEffect } from 'react';
import { ClassRoom, Quiz } from '../types';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Component trang chủ
const HomePage: React.FC = () => {
  const [publicClasses, setPublicClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Hàm xử lý di chuyển chuột để tính toán góc xoay
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    setMousePosition({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  // Tải lớp học công khai từ backend
  useEffect(() => {
    (async () => {
      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) {
          setPublicClasses([]);
          setTotalClasses(0);
          setTotalQuizzes(0);
          setLoading(false);
          return;
        }
        const { ClassesAPI, QuizzesAPI } = await import('../utils/api');
        const pubs: any[] = await ClassesAPI.listPublic(token);
        // Attach quizzes for each public class
        const classesWithQuizzes: ClassRoom[] = [] as any;
        let quizCount = 0;
        for (const cls of pubs) {
          const qzs = await QuizzesAPI.byClass(cls.id, token);
          const published = (qzs || []).filter((q: any) => q && q.published);
          quizCount += published.length;
          classesWithQuizzes.push({
            id: cls.id,
            name: cls.name,
            description: cls.description,
            quizzes: published,
            createdAt: new Date(cls.createdAt),
            updatedAt: cls.updatedAt ? new Date(cls.updatedAt) : undefined,
          } as unknown as ClassRoom);
        }
        setPublicClasses(classesWithQuizzes);
        setTotalClasses(classesWithQuizzes.length);
        setTotalQuizzes(quizCount);
      } catch (e) {
        console.error('Failed to load public classes:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Left Section - Main Content */}
        <div className="flex-1 order-2 lg:order-1">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">
              LiemDai (Đại Liêm) Website🐧
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              Khám phá các lớp học trắc nghiệm công khai và bắt đầu học tập ngay hôm nay!
            </p>
          </div>

          {/* Danh sách lớp học public */}
          <div className="space-y-4 lg:space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6 text-center">
              Lớp học công khai
            </h2>

            {loading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              // Danh sách lớp học
              <div className="space-y-3 lg:space-y-4">
                {publicClasses.map((classRoom) => (
                  <div key={classRoom.id} className="card p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3 sm:gap-0">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {classRoom.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                          {classRoom.description}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 gap-1 sm:gap-0">
                          <span>Tạo ngày: {classRoom.createdAt.toLocaleDateString('vi-VN')}</span>
                          <span className="hidden sm:inline mx-2">•</span>
                          <span>{classRoom.quizzes?.length || 0} bài kiểm tra</span>
                        </div>
                      </div>
                      <div className="relative dropdown-container">
                        <button 
                          className="btn-primary flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm w-full sm:w-auto justify-center"
                          onClick={() => {
                            if (classRoom.quizzes && classRoom.quizzes.length === 1) {
                              // Nếu chỉ có 1 quiz, vào luôn
                              const firstQuiz = (classRoom.quizzes as Quiz[])[0];
                              navigate(`/quiz/${firstQuiz.id}`);
                            } else {
                              // Nếu có nhiều quiz, mở dropdown
                              setOpenDropdown(openDropdown === classRoom.id ? null : classRoom.id);
                            }
                          }}
                        >
                          Tham gia
                          {classRoom.quizzes && classRoom.quizzes.length > 1 && (
                            <svg 
                              className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                                openDropdown === classRoom.id ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdown === classRoom.id && classRoom.quizzes && classRoom.quizzes.length > 1 && (
                          <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-1 w-full sm:w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-10">
                            <div className="p-2">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                Chọn bài kiểm tra:
                              </div>
                              {(classRoom.quizzes as Quiz[]).map((quiz) => (
                                <button
                                  key={quiz.id}
                                  onClick={() => {
                                    navigate(`/quiz/${quiz.id}`);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {quiz.title}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {quiz.questions.length} câu hỏi
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Danh sách quiz trong lớp */}
                    {classRoom.quizzes && classRoom.quizzes.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Bài kiểm tra trong lớp:
                        </h4>
                        <div className="space-y-2">
                          {(classRoom.quizzes as Quiz[]).map((quiz) => (
                            <div key={quiz.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg relative">
                              {/* Desktop layout: horizontal */}
                              <div className="hidden sm:flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {quiz.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {quiz.description}
                                  </p>
                                </div>
                                <button
                                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                                  className="btn-secondary text-sm"
                                >
                                  Làm bài
                                </button>
                              </div>
                              {/* Mobile layout: vertical */}
                              <div className="sm:hidden pr-0">
                                <p className="font-medium text-gray-900 dark:text-white mb-1">
                                  {quiz.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {quiz.description}
                                </p>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                                    className="btn-secondary text-sm text-center w-full"
                                  >
                                    Làm bài
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Sidebar */}
        <div className="w-full lg:w-1/3 order-1 lg:order-2">
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Kho tài liệu học tập
            </h3>
            <h4 className="text-lg font-mono text-gray-900 dark:text-white mb-4 text-center">
              <a href="https://lms.liemsdai.is-best.net/" target="_blank" rel="noopener noreferrer">
                https://lms.liemsdai.is-best.net/
              </a>
            </h4>
            <div className="flex items-center justify-center">
                <div className="perspective-1000" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                  <a
                    href="https://lms.liemsdai.is-best.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                    style={{ display: 'inline-block' }}
                  >
                    <img
                      src={isDarkMode ? require('../assets/liemdai_dark.png') : require('../assets/liemdai_light.png')}
                      alt={isDarkMode ? 'liemdai_dark' : 'liemdai_light'}
                      className="max-w-full h-auto rounded-xl shadow-lg transition-all duration-300 ease-out cursor-pointer"
                      style={{
                        maxHeight: 280,
                        transform: `perspective(1000px) rotateY(${mousePosition.x * 0.1}deg) rotateX(${-mousePosition.y * 0.1}deg) translateZ(${Math.abs(mousePosition.x) + Math.abs(mousePosition.y) > 0 ? '20px' : '0px'})`,
                        border: '2px solid transparent',
                        backgroundImage: isDarkMode
                          ? 'linear-gradient(45deg, #0ea5e9, #06b6d4, #10b981, #84cc16)'
                          : 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
                        backgroundSize: '400% 400%',
                        animation: 'neonBorder 3s ease-in-out infinite',
                        backgroundClip: 'border-box',
                        borderRadius: '12px',
                      }}
                    />
                    {/* Tooltip */}
                    <div
                      className={`opacity-0 group-hover:opacity-100 pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 text-xs rounded px-3 py-2 shadow-lg transition-opacity duration-200 z-20 whitespace-nowrap ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-300'}`}
                      style={{ minWidth: 160 }}
                    >
                      Click để chuyển đến trang
                    </div>
                  </a>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 