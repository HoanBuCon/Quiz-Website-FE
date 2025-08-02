import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClassRoom, Quiz } from '../types';

// Component trang lớp học
const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data cho các lớp học
  useEffect(() => {
    setTimeout(() => {
      const mockClasses: ClassRoom[] = [
        {
          id: '1',
          name: 'Toán học cơ bản',
          description: 'Bài tập trắc nghiệm môn Toán lớp 10',
          quizzes: [
            {
              id: 'quiz-1',
              title: 'Bài kiểm tra 1',
              description: 'Kiểm tra kiến thức cơ bản',
              questions: [],
              createdAt: new Date('2024-01-15'),
              updatedAt: new Date('2024-01-15'),
            },
            {
              id: 'quiz-2',
              title: 'Bài kiểm tra 2',
              description: 'Kiểm tra nâng cao',
              questions: [],
              createdAt: new Date('2024-01-20'),
              updatedAt: new Date('2024-01-20'),
            },
          ],
          isPublic: true,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: 'Vật lý đại cương',
          description: 'Trắc nghiệm Vật lý cơ bản',
          quizzes: [
            {
              id: 'quiz-3',
              title: 'Cơ học',
              description: 'Bài tập về cơ học',
              questions: [],
              createdAt: new Date('2024-01-20'),
              updatedAt: new Date('2024-01-20'),
            },
          ],
          isPublic: true,
          createdAt: new Date('2024-01-20'),
        },
        {
          id: '3',
          name: 'Hóa học phổ thông',
          description: 'Bài tập Hóa học trung học phổ thông',
          quizzes: [
            {
              id: 'quiz-4',
              title: 'Hóa vô cơ',
              description: 'Kiểm tra kiến thức hóa vô cơ',
              questions: [],
              createdAt: new Date('2024-01-25'),
              updatedAt: new Date('2024-01-25'),
            },
          ],
          isPublic: true,
          createdAt: new Date('2024-01-25'),
        },
      ];
      setClasses(mockClasses);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Left Section - 70% */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Lớp học của tôi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
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
          ) : (
            // Danh sách lớp học
            <div className="space-y-6">
              {classes.map((classRoom) => (
                <div key={classRoom.id} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
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
                        <span>{classRoom.quizzes.length} bài kiểm tra</span>
                      </div>
                    </div>
                    <Link
                      to={`/classes/${classRoom.id}`}
                      className="btn-primary"
                    >
                      Vào lớp
                    </Link>
                  </div>

                  {/* Danh sách bài kiểm tra */}
                  {classRoom.quizzes.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Bài kiểm tra trong lớp:
                      </h4>
                      <div className="space-y-2">
                        {classRoom.quizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {quiz.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {quiz.description}
                              </p>
                            </div>
                            <Link
                              to={`/quiz/${quiz.id}`}
                              className="btn-secondary text-sm"
                            >
                              Làm bài
                            </Link>
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

        {/* Right Section - 30% */}
        <div className="w-1/3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Thống kê học tập
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tổng lớp học:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {classes.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tổng bài kiểm tra:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {classes.reduce((total, cls) => total + cls.quizzes.length, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Đã hoàn thành:</span>
                <span className="font-semibold text-green-600">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Điểm trung bình:</span>
                <span className="font-semibold text-blue-600">8.5</span>
              </div>
            </div>
          </div>

          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Hướng dẫn
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>• Chọn lớp học để xem danh sách bài kiểm tra</p>
              <p>• Click "Làm bài" để bắt đầu làm trắc nghiệm</p>
              <p>• Theo dõi tiến độ học tập của bạn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassesPage; 