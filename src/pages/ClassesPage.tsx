import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClassRoom, Quiz } from '../types';

const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Hàm xóa lớp học
  const handleDeleteClass = (classId: string, className: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa lớp học "${className}"?\n\nLưu ý: Tất cả bài kiểm tra trong lớp học này cũng sẽ bị xóa.`)) {
      try {
        // Lấy danh sách lớp học hiện tại
        const savedClasses = localStorage.getItem('classrooms') || '[]';
        const classRooms = JSON.parse(savedClasses);
        
        // Tìm lớp học cần xóa để lấy danh sách quiz IDs
        const classToDelete = classRooms.find((cls: ClassRoom) => cls.id === classId);
        
        // Xóa lớp học khỏi localStorage
        const updatedClasses = classRooms.filter((cls: ClassRoom) => cls.id !== classId);
        localStorage.setItem('classrooms', JSON.stringify(updatedClasses));
        
        // Xóa các quiz liên quan
        if (classToDelete && classToDelete.quizIds) {
          const savedQuizzes = localStorage.getItem('quizzes') || '[]';
          const quizzes = JSON.parse(savedQuizzes);
          const updatedQuizzes = quizzes.filter((quiz: Quiz) => !classToDelete.quizIds.includes(quiz.id));
          localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
          
          // NOTE: Documents are kept independent and not deleted when classes are removed
          // Users can manually delete documents from the Documents page if needed
        }
        
        // Cập nhật state
        setClasses(prev => prev.filter(cls => cls.id !== classId));
        
        alert(`Đã xóa lớp học "${className}" thành công!`);
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Có lỗi xảy ra khi xóa lớp học. Vui lòng thử lại.');
      }
    }
  };

  // Hàm xóa quiz khỏi lớp học
  const handleDeleteQuiz = (classId: string, quizId: string, quizTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài kiểm tra "${quizTitle}"?`)) {
      try {
        // Cập nhật lớp học - xóa quiz ID khỏi danh sách
        const savedClasses = localStorage.getItem('classrooms') || '[]';
        const classRooms = JSON.parse(savedClasses);
        const updatedClasses = classRooms.map((cls: ClassRoom) => {
          if (cls.id === classId) {
            return {
              ...cls,
              quizIds: cls.quizIds?.filter(id => id !== quizId) || []
            };
          }
          return cls;
        });
        localStorage.setItem('classrooms', JSON.stringify(updatedClasses));
        
        // Xóa quiz khỏi danh sách quiz
        const savedQuizzes = localStorage.getItem('quizzes') || '[]';
        const quizzes = JSON.parse(savedQuizzes);
        const updatedQuizzes = quizzes.filter((quiz: Quiz) => quiz.id !== quizId);
        localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
        
        // NOTE: Documents are kept independent and not deleted when individual quizzes are removed
        // Users can manually delete documents from the Documents page if needed
        
        // Cập nhật state
        setClasses(prev => prev.map(cls => {
          if (cls.id === classId) {
            return {
              ...cls,
              quizzes: (cls.quizzes as Quiz[])?.filter(quiz => quiz.id !== quizId) || []
            };
          }
          return cls;
        }));
        
        alert(`Đã xóa bài kiểm tra "${quizTitle}" thành công!`);
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Có lỗi xảy ra khi xóa bài kiểm tra. Vui lòng thử lại.');
      }
    }
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (classId: string) => {    
    if (openDropdown === classId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(classId);
    }
  };
  // Helper function để lấy danh sách quiz hợp lệ
  const getValidQuizzes = (classRoom: ClassRoom): Quiz[] => {
    if (!classRoom.quizzes) return [];
    const quizzes = classRoom.quizzes as Quiz[];
    const validQuizzes = quizzes.filter(quiz => quiz && quiz.id && quiz.title);
    console.log(`Class "${classRoom.name}" - Valid quizzes:`, validQuizzes.length, validQuizzes);
    return validQuizzes;
  };

  // Lấy dữ liệu từ localStorage
  useEffect(() => {
    try {
      const savedClasses = localStorage.getItem('classrooms') || '[]';
      const savedQuizzes = localStorage.getItem('quizzes') || '[]';
      
      const classRooms = JSON.parse(savedClasses);
      const quizzes = JSON.parse(savedQuizzes);

      console.log('Raw classRooms data:', classRooms);
      console.log('Available quizzes:', quizzes);

      if (classRooms.length > 0) {
        // Map quiz IDs to actual quiz objects for each classroom
        const mappedClasses = classRooms.map((classRoom: ClassRoom) => {
          console.log('Processing classroom:', classRoom);
          
          // Handle both old format (quizIds) and new format (quizzes)
          let quizIdList: string[] = [];
          
          if (classRoom.quizIds) {
            // Old format - using quizIds
            quizIdList = classRoom.quizIds;
            console.log('Using quizIds:', quizIdList);
          } else if (classRoom.quizzes && Array.isArray(classRoom.quizzes)) {
            // New format - check if quizzes contains IDs or objects
            if (classRoom.quizzes.length > 0 && typeof classRoom.quizzes[0] === 'string') {
              // Array of IDs
              quizIdList = classRoom.quizzes as unknown as string[];
              console.log('Using quizzes as IDs:', quizIdList);
            } else {
              // Array of quiz objects - extract IDs
              quizIdList = (classRoom.quizzes as Quiz[]).map(q => q.id);
              console.log('Extracted IDs from quiz objects:', quizIdList);
            }
          }

          const classQuizzes = quizIdList.map(quizId => {
            const quiz = quizzes.find((q: Quiz) => q.id === quizId);
            if (quiz) {
              return {
                ...quiz,
                createdAt: new Date(quiz.createdAt),
                updatedAt: new Date(quiz.updatedAt || quiz.createdAt)
              };
            }
            console.warn('Quiz not found for ID:', quizId);
            return null;
          }).filter((q): q is Quiz => q !== null);

          console.log('Mapped quizzes for classroom:', classQuizzes);

          return {
            ...classRoom,
            quizzes: classQuizzes,
            createdAt: new Date(classRoom.createdAt)
          };
        });
        
        console.log('Final mapped classes:', mappedClasses);
        setClasses(mappedClasses);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Mobile: Statistics Box First */}
      <div className="lg:hidden mb-6">
        <div className="card p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Thống kê học tập
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Số lượng lớp học:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{classes.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Số lượng bài kiểm tra:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {classes.reduce((total, cls) => total + getValidQuizzes(cls).length, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Đã hoàn thành:</span>
              <span className="font-semibold text-green-600">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Điểm trung bình:</span>
              <span className="font-semibold text-blue-600">0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Left Section - Main Content */}
        <div className="flex-1 order-1">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">
              Lớp học của tôi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              Chọn lớp học để bắt đầu làm bài trắc nghiệm
            </p>
          </div>

          {loading ? (
            // Loading skeleton
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : classes.length > 0 ? (
            // Danh sách lớp học
            <div className="space-y-6">
              {classes.map((classRoom: ClassRoom) => {
                const validQuizzes = getValidQuizzes(classRoom);
                const quizCount = validQuizzes.length;
                
                return (
                  <div 
                    key={classRoom.id} 
                    className={`card p-6 relative ${openDropdown === classRoom.id ? 'z-50' : 'z-0'}`}
                  >
                    {/* Desktop Layout - flex ngang */}
                    <div className="hidden sm:flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {classRoom.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {classRoom.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>Tạo ngày: {classRoom.createdAt.toLocaleDateString('vi-VN')}</span>
                          <span className="mx-2">•</span>
                          <span>{quizCount} bài kiểm tra</span>
                        </div>
                      </div>
                      
                      {/* Desktop buttons - bên phải */}
                      <div className="flex items-center gap-2">
                        {(() => {
                          if (quizCount > 3) {
                            // Nếu có hơn 3 quiz, hiện dropdown để xem tất cả
                            return (
                              <div className="relative dropdown-container">
                                <button 
                                  className="btn-primary flex items-center"
                                  onClick={() => handleDropdownToggle(classRoom.id)}
                                >
                                  Tham gia ({quizCount})
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
                                </button>
                                {/* Dropdown Menu - Hiện tất cả quiz */}
                                {openDropdown === classRoom.id && (
                                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                    <div className="p-2">
                                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                        Tất cả bài kiểm tra:
                                      </div>
                                      {validQuizzes.map((quiz) => (
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
                            );
                          } else if (quizCount >= 1) {
                            // Có từ 1-3 quiz
                            if (quizCount === 1) {
                              return (
                                <button 
                                  className="btn-primary"
                                  onClick={() => {
                                    const firstQuiz = validQuizzes[0];
                                    navigate(`/quiz/${firstQuiz.id}`);
                                  }}
                                >
                                  Tham gia
                                </button>
                              );
                            } else {
                              return (
                                <div className="relative dropdown-container">
                                  <button 
                                    className="btn-primary flex items-center"
                                    onClick={() => handleDropdownToggle(classRoom.id)}
                                  >
                                    Tham gia ({quizCount})
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
                                  </button>
                                  {/* Dropdown Menu */}
                                  {openDropdown === classRoom.id && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                      <div className="p-2">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                          Tất cả bài kiểm tra:
                                        </div>
                                        {validQuizzes.map((quiz) => (
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
                              );
                            }
                          } else {
                            // Không có quiz nào
                            return (
                              <button className="btn-primary" disabled>
                                Chưa có bài tập
                              </button>
                            );
                          }
                        })()}
                        
                        <button
                          onClick={() => handleDeleteClass(classRoom.id, classRoom.name)}
                          className="btn-secondary !bg-red-100 !text-red-700 hover:!bg-red-200 dark:!bg-red-900/20 dark:!text-red-400 dark:hover:!bg-red-900/40"
                          title="Xóa lớp học"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mobile Layout - flex dọc, nút xóa cùng hàng với Vào lớp */}
                    <div className="sm:hidden mb-4">
                      <div className="pr-8">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {classRoom.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {classRoom.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <span>Tạo ngày: {classRoom.createdAt.toLocaleDateString('vi-VN')}</span>
                          <span className="mx-2">•</span>
                          <span>{quizCount} bài kiểm tra</span>
                        </div>
                      </div>
                      {/* Mobile buttons - Vào lớp và Xóa lớp cùng hàng */}
                      <div className="flex flex-row gap-2 mt-2">
                        {(() => {
                          if (quizCount > 3) {
                            return (
                              <div className="relative dropdown-container flex-1">
                                <button
                                  className="btn-primary flex items-center justify-center w-full"
                                  onClick={() => handleDropdownToggle(classRoom.id)}
                                >
                                  Tham gia ({quizCount})
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
                                </button>
                                {/* Dropdown Menu - Hiện tất cả quiz (mobile) */}
                                {openDropdown === classRoom.id && (
                                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                    <div className="p-2">
                                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                        Tất cả bài kiểm tra:
                                      </div>
                                      {validQuizzes.map((quiz) => (
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
                            );
                          } else if (quizCount >= 1) {
                            if (quizCount === 1) {
                              return (
                                <button
                                  className="btn-primary flex-1"
                                  onClick={() => {
                                    const firstQuiz = validQuizzes[0];
                                    navigate(`/quiz/${firstQuiz.id}`);
                                  }}
                                >
                                  Tham gia
                                </button>
                              );
                            } else {
                              // 2-3 quiz
                              return (
                                <div className="relative dropdown-container flex-1">
                                  <button
                                    className="btn-primary flex items-center justify-center w-full"
                                    onClick={() => handleDropdownToggle(classRoom.id)}
                                  >
                                    Tham gia ({quizCount})
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
                                  </button>
                                  {openDropdown === classRoom.id && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                      <div className="p-2">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                          Tất cả bài kiểm tra:
                                        </div>
                                        {validQuizzes.map((quiz) => (
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
                              );
                            }
                          } else {
                            return (
                              <button className="btn-primary flex-1" disabled>
                                Chưa có bài tập
                              </button>
                            );
                          }
                        })()}
                        {/* Nút xóa lớp học - chỉ icon, cùng hàng */}
                        <button
                          onClick={() => handleDeleteClass(classRoom.id, classRoom.name)}
                          className="w-9 h-9 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden"
                          title="Xóa lớp học"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Danh sách bài kiểm tra - chỉ hiển thị tối đa 3 bài đầu tiên */}
                    {quizCount > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Bài kiểm tra trong lớp:
                          {quizCount > 3 && (
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                              (Hiển thị 3/{quizCount} bài - xem tất cả tại nút "Vào lớp")
                            </span>
                          )}
                        </h4>
                        <div className="space-y-2">
                          {validQuizzes.slice(0, 3).map((quiz) => (
                            <div
                              key={quiz.id}
                              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg relative"
                            >
                              {/* Desktop Layout cho quiz items */}
                              <div className="hidden sm:flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {quiz.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {quiz.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/quiz/${quiz.id}`}
                                    className="btn-secondary text-sm"
                                  >
                                    Làm bài
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteQuiz(classRoom.id, quiz.id, quiz.title)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                    title="Xóa bài kiểm tra"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Mobile Layout cho quiz items - nút Làm bài và xóa cùng hàng */}
                              <div className="sm:hidden">
                                <p className="font-medium text-gray-900 dark:text-white mb-1">
                                  {quiz.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {quiz.description}
                                </p>
                                <div className="flex flex-row gap-2">
                                  <Link
                                    to={`/quiz/${quiz.id}`}
                                    className="btn-secondary text-sm text-center w-full"
                                  >
                                    Làm bài
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteQuiz(classRoom.id, quiz.id, quiz.title)}
                                    className="w-9 h-9 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden"
                                    title="Xóa bài kiểm tra"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty state
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Chưa có lớp học nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Tạo lớp học đầu tiên để bắt đầu
              </p>
              <Link to="/create" className="btn-primary">
                Tạo lớp học mới
              </Link>
            </div>
          )}
        </div>

        {/* Right Section - Desktop Only (Statistics + Guidance) */}
        <div className="hidden lg:block lg:w-1/3 order-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Thống kê học tập
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Số lượng lớp học:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {classes.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Số lượng bài kiểm tra:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {classes.reduce((total, cls) => total + getValidQuizzes(cls).length, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Đã hoàn thành:</span>
                <span className="font-semibold text-green-600">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Điểm trung bình:</span>
                <span className="font-semibold text-blue-600">0</span>
              </div>
            </div>
          </div>

          {/* Guidance Box - Desktop Only */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Hướng dẫn
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>• Chọn lớp học để xem danh sách bài kiểm tra</p>
              <p>• Click "Làm bài" để bắt đầu làm  bài tập trắc nghiệm</p>
              <p>• Theo dõi tiến độ học tập của bạn</p>
              <p>• Xóa lớp học hoặc bài kiểm tra nếu không cần thiết</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassesPage;