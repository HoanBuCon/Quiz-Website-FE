import React, { useState, useEffect } from 'react';
import { ClassRoom } from '../types';

// Component trang chủ
const HomePage: React.FC = () => {
  const [publicClasses, setPublicClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data cho các lớp học public
  useEffect(() => {
    // Giả lập loading
    setTimeout(() => {
      const mockClasses: ClassRoom[] = [
        {
          id: '1',
          name: 'Toán học cơ bản',
          description: 'Bài tập trắc nghiệm môn Toán lớp 10',
          quizzes: [],
          isPublic: true,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: 'Vật lý đại cương',
          description: 'Trắc nghiệm Vật lý cơ bản',
          quizzes: [],
          isPublic: true,
          createdAt: new Date('2024-01-20'),
        },
        {
          id: '3',
          name: 'Hóa học phổ thông',
          description: 'Bài tập Hóa học trung học phổ thông',
          quizzes: [],
          isPublic: true,
          createdAt: new Date('2024-01-25'),
        },
      ];
      setPublicClasses(mockClasses);
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
              Chào mừng đến với Quiz Website
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Khám phá các lớp học trắc nghiệm công khai và bắt đầu học tập ngay hôm nay!
            </p>
          </div>

          {/* Danh sách lớp học public */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
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
              <div className="space-y-4">
                {publicClasses.map((classRoom) => (
                  <div key={classRoom.id} className="card p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {classRoom.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {classRoom.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>Tạo ngày: {classRoom.createdAt.toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <button className="btn-primary">
                        Tham gia
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - 30% */}
        <div className="w-1/3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Thống kê nhanh
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tổng lớp học:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {publicClasses.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Người dùng online:</span>
                <span className="font-semibold text-green-600">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Bài quiz đã tạo:</span>
                <span className="font-semibold text-gray-900 dark:text-white">156</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 