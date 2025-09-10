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

  // Mock data cho các lớp học public
  useEffect(() => {
    // Giả lập loading
    setTimeout(() => {
      const mockClasses: ClassRoom[] = [
        {
          id: '1',
          name: 'Lập trình hướng đối tượng',
          description: 'Bài tập trắc nghiệm OOP',
          quizIds: ['quiz-oop-1'],
          quizzes: [
            {
              id: 'quiz-oop-1',
              title: 'Kiểm tra OOP cơ bản',
              description: 'Bài kiểm tra về các khái niệm cơ bản của lập trình hướng đối tượng',
              questions: [
                {
                  id: 'q1',
                  question: 'OOP là viết tắt của gì?',
                  type: 'single',
                  options: ['Object Oriented Programming', 'Object Order Programming', 'Only Object Programming', 'Open Object Programming'],
                  correctAnswers: ['Object Oriented Programming'],
                  explanation: 'OOP là Object Oriented Programming - Lập trình hướng đối tượng'
                },
                {
                  id: 'q2',
                  question: 'Encapsulation trong OOP có nghĩa là gì?',
                  type: 'single',
                  options: ['Đóng gói dữ liệu và phương thức', 'Kế thừa từ lớp cha', 'Đa hình của đối tượng', 'Trừu tượng hóa dữ liệu'],
                  correctAnswers: ['Đóng gói dữ liệu và phương thức'],
                  explanation: 'Encapsulation là việc đóng gói dữ liệu và các phương thức thao tác trên dữ liệu đó trong một đơn vị'
                },
                {
                  id: 'q3',
                  question: 'Inheritance cho phép làm gì?',
                  type: 'single',
                  options: ['Tạo lớp mới từ lớp đã có', 'Ẩn thông tin của đối tượng', 'Tạo nhiều đối tượng', 'Xóa đối tượng khỏi bộ nhớ'],
                  correctAnswers: ['Tạo lớp mới từ lớp đã có'],
                  explanation: 'Inheritance (kế thừa) cho phép tạo lớp mới dựa trên lớp đã có, kế thừa các thuộc tính và phương thức'
                },
                {
                  id: 'q4',
                  question: 'Polymorphism là gì?',
                  type: 'single',
                  options: ['Khả năng đa hình của đối tượng', 'Ẩn dữ liệu private', 'Tạo constructor', 'Quản lý bộ nhớ'],
                  correctAnswers: ['Khả năng đa hình của đối tượng'],
                  explanation: 'Polymorphism cho phép cùng một interface có thể được sử dụng cho các kiểu dữ liệu khác nhau'
                },
                {
                  id: 'q5',
                  question: 'Constructor trong OOP có chức năng gì?',
                  type: 'single',
                  options: ['Khởi tạo đối tượng', 'Hủy đối tượng', 'So sánh đối tượng', 'Copy đối tượng'],
                  correctAnswers: ['Khởi tạo đối tượng'],
                  explanation: 'Constructor là phương thức đặc biệt được gọi khi tạo đối tượng mới'
                },
                {
                  id: 'q6',
                  question: 'Access modifier nào cho phép truy cập từ bên ngoài class?',
                  type: 'single',
                  options: ['public', 'private', 'protected', 'internal'],
                  correctAnswers: ['public'],
                  explanation: 'public cho phép truy cập từ bất kỳ đâu, kể cả bên ngoài class'
                },
                {
                  id: 'q7',
                  question: 'Method overriding là gì?',
                  type: 'single',
                  options: ['Ghi đè phương thức của lớp cha', 'Tạo phương thức mới', 'Xóa phương thức', 'Copy phương thức'],
                  correctAnswers: ['Ghi đè phương thức của lớp cha'],
                  explanation: 'Method overriding cho phép lớp con định nghĩa lại phương thức đã có trong lớp cha'
                },
                {
                  id: 'q8',
                  question: 'Abstract class khác gì với interface?',
                  type: 'single',
                  options: ['Abstract class có thể có implementation', 'Interface có thể có constructor', 'Abstract class không có method', 'Không có sự khác biệt'],
                  correctAnswers: ['Abstract class có thể có implementation'],
                  explanation: 'Abstract class có thể chứa cả phương thức đã implement và chưa implement, interface chỉ định nghĩa signature'
                },
                {
                  id: 'q9',
                  question: 'Static method có đặc điểm gì?',
                  type: 'single',
                  options: ['Thuộc về class, không thuộc về instance', 'Thuộc về instance cụ thể', 'Không thể gọi được', 'Chỉ dùng trong constructor'],
                  correctAnswers: ['Thuộc về class, không thuộc về instance'],
                  explanation: 'Static method thuộc về class và có thể gọi mà không cần tạo instance'
                },
                {
                  id: 'q10',
                  question: 'Garbage Collection trong OOP có tác dụng gì?',
                  type: 'single',
                  options: ['Tự động giải phóng bộ nhớ', 'Tạo đối tượng mới', 'Sắp xếp đối tượng', 'Bảo mật đối tượng'],
                  correctAnswers: ['Tự động giải phóng bộ nhớ'],
                  explanation: 'Garbage Collection tự động thu hồi bộ nhớ của các đối tượng không còn được sử dụng'
                }
              ],
              createdAt: new Date('2025-08-2'),
              updatedAt: new Date('2025-08-2')
            }
          ],
          isPublic: true,
          createdAt: new Date('2025-08-2'),
        },
        {
          id: '2',
          name: 'Cấu trúc dữ liệu và giải thuật',
          description: 'Ôn tập lý thuyết DSA',
          quizIds: ['quiz-dsa-1'],
          quizzes: [
            {
              id: 'quiz-dsa-1',
              title: 'Kiểm tra DSA cơ bản',
              description: 'Bài kiểm tra về cấu trúc dữ liệu và giải thuật cơ bản',
              questions: [
                {
                  id: 'q1',
                  question: 'Time complexity của thuật toán Linear Search là gì?',
                  type: 'single',
                  options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
                  correctAnswers: ['O(n)'],
                  explanation: 'Linear Search có time complexity O(n) vì phải duyệt qua tất cả phần tử trong trường hợp xấu nhất'
                },
                {
                  id: 'q2',
                  question: 'Stack hoạt động theo nguyên tắc nào?',
                  type: 'single',
                  options: ['LIFO (Last In First Out)', 'FIFO (First In First Out)', 'Random Access', 'Priority Based'],
                  correctAnswers: ['LIFO (Last In First Out)'],
                  explanation: 'Stack hoạt động theo nguyên tắc LIFO - phần tử vào cuối sẽ ra đầu tiên'
                },
                {
                  id: 'q3',
                  question: 'Queue hoạt động theo nguyên tắc nào?',
                  type: 'single',
                  options: ['FIFO (First In First Out)', 'LIFO (Last In First Out)', 'Random Access', 'Priority Based'],
                  correctAnswers: ['FIFO (First In First Out)'],
                  explanation: 'Queue hoạt động theo nguyên tắc FIFO - phần tử vào trước sẽ ra trước'
                },
                {
                  id: 'q4',
                  question: 'Binary Search chỉ hoạt động trên mảng có tính chất gì?',
                  type: 'single',
                  options: ['Đã được sắp xếp', 'Chưa được sắp xếp', 'Có độ dài chẵn', 'Có độ dài lẻ'],
                  correctAnswers: ['Đã được sắp xếp'],
                  explanation: 'Binary Search chỉ hoạt động trên mảng đã được sắp xếp để có thể chia đôi không gian tìm kiếm'
                },
                {
                  id: 'q5',
                  question: 'Time complexity của Binary Search là gì?',
                  type: 'single',
                  options: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'],
                  correctAnswers: ['O(log n)'],
                  explanation: 'Binary Search có time complexity O(log n) vì chia đôi không gian tìm kiếm ở mỗi bước'
                },
                {
                  id: 'q6',
                  question: 'Linked List có ưu điểm gì so với Array?',
                  type: 'single',
                  options: ['Thêm/xóa phần tử linh hoạt', 'Truy cập ngẫu nhiên nhanh', 'Sử dụng ít bộ nhớ', 'Tìm kiếm nhanh hơn'],
                  correctAnswers: ['Thêm/xóa phần tử linh hoạt'],
                  explanation: 'Linked List cho phép thêm/xóa phần tử ở bất kỳ vị trí nào mà không cần dịch chuyển các phần tử khác'
                },
                {
                  id: 'q7',
                  question: 'Bubble Sort có time complexity là gì?',
                  type: 'single',
                  options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'],
                  correctAnswers: ['O(n²)'],
                  explanation: 'Bubble Sort có time complexity O(n²) do sử dụng 2 vòng lặp lồng nhau'
                },
                {
                  id: 'q8',
                  question: 'Hash Table sử dụng gì để tìm vị trí lưu trữ?',
                  type: 'single',
                  options: ['Hash function', 'Linear search', 'Binary search', 'Random function'],
                  correctAnswers: ['Hash function'],
                  explanation: 'Hash Table sử dụng hash function để tính toán vị trí lưu trữ dựa trên key'
                },
                {
                  id: 'q9',
                  question: 'Tree có node gốc được gọi là gì?',
                  type: 'single',
                  options: ['Root', 'Leaf', 'Branch', 'Parent'],
                  correctAnswers: ['Root'],
                  explanation: 'Node gốc của cây được gọi là Root node - không có parent node'
                },
                {
                  id: 'q10',
                  question: 'DFS (Depth First Search) sử dụng cấu trúc dữ liệu nào?',
                  type: 'single',
                  options: ['Stack', 'Queue', 'Heap', 'Hash Table'],
                  correctAnswers: ['Stack'],
                  explanation: 'DFS sử dụng Stack để lưu trữ các node cần thăm, có thể implement bằng recursion hoặc explicit stack'
                }
              ],
              createdAt: new Date('2025-08-2'),
              updatedAt: new Date('2025-08-2')
            }
          ],
          isPublic: true,
          createdAt: new Date('2025-08-2'),
        },
        {
          id: '3',
          name: 'Kỹ thuật shading trong Blender',
          description: 'Bộ câu hỏi trắc nghiệm về kỹ thuật shading',
          quizIds: ['quiz-blender-1'],
          quizzes: [
            {
              id: 'quiz-blender-1',
              title: 'Kiểm tra Blender Shading',
              description: 'Bài kiểm tra về kỹ thuật shading và material trong Blender',
              questions: [
                {
                  id: 'q1',
                  question: 'Shader Editor trong Blender được dùng để làm gì?',
                  type: 'single',
                  options: ['Tạo và chỉnh sửa material', 'Modeling 3D', 'Animation', 'Render setup'],
                  correctAnswers: ['Tạo và chỉnh sửa material'],
                  explanation: 'Shader Editor là workspace chuyên dụng để tạo và chỉnh sửa material bằng node system'
                },
                {
                  id: 'q2',
                  question: 'Principled BSDF là gì trong Blender?',
                  type: 'single',
                  options: ['Shader node chính cho PBR material', 'Công cụ modeling', 'Kiểu animation', 'Render engine'],
                  correctAnswers: ['Shader node chính cho PBR material'],
                  explanation: 'Principled BSDF là shader node chính để tạo PBR (Physically Based Rendering) material'
                },
                {
                  id: 'q3',
                  question: 'Metallic property trong Principled BSDF có giá trị từ bao nhiêu?',
                  type: 'single',
                  options: ['0 đến 1', '0 đến 100', '-1 đến 1', '0 đến 255'],
                  correctAnswers: ['0 đến 1'],
                  explanation: 'Metallic property có giá trị từ 0 (non-metal) đến 1 (full metal)'
                },
                {
                  id: 'q4',
                  question: 'Roughness trong material ảnh hưởng đến gì?',
                  type: 'single',
                  options: ['Độ nhám của bề mặt', 'Màu sắc material', 'Độ trong suốt', 'Kích thước object'],
                  correctAnswers: ['Độ nhám của bề mặt'],
                  explanation: 'Roughness điều khiển độ nhám của bề mặt, ảnh hưởng đến cách phản xạ ánh sáng'
                },
                {
                  id: 'q5',
                  question: 'Normal Map được dùng để làm gì?',
                  type: 'single',
                  options: ['Tạo chi tiết bề mặt fake', 'Thay đổi hình dạng mesh', 'Tạo animation', 'Thay đổi màu sắc'],
                  correctAnswers: ['Tạo chi tiết bề mặt fake'],
                  explanation: 'Normal Map tạo ảo giác về chi tiết bề mặt mà không thay đổi geometry thực tế'
                },
                {
                  id: 'q6',
                  question: 'UV Mapping trong Blender là gì?',
                  type: 'single',
                  options: ['Ánh xạ texture 2D lên mesh 3D', 'Tạo animation', 'Render lighting', 'Modeling tool'],
                  correctAnswers: ['Ánh xạ texture 2D lên mesh 3D'],
                  explanation: 'UV Mapping là quá trình ánh xạ texture 2D lên bề mặt mesh 3D'
                },
                {
                  id: 'q7',
                  question: 'ColorRamp node được dùng để làm gì?',
                  type: 'single',
                  options: ['Điều khiển gradient màu', 'Tạo hình học', 'Render image', 'Tạo animation key'],
                  correctAnswers: ['Điều khiển gradient màu'],
                  explanation: 'ColorRamp node cho phép tạo và điều khiển gradient màu từ giá trị input'
                },
                {
                  id: 'q8',
                  question: 'Subsurface Scattering mô phỏng hiệu ứng gì?',
                  type: 'single',
                  options: ['Ánh sáng xuyên qua bề mặt', 'Phản xạ gương', 'Độ trong suốt', 'Phát sáng'],
                  correctAnswers: ['Ánh sáng xuyên qua bề mặt'],
                  explanation: 'Subsurface Scattering mô phỏng ánh sáng xuyên vào bề mặt và tán xạ bên trong vật liệu'
                },
                {
                  id: 'q9',
                  question: 'Emission shader tạo ra hiệu ứng gì?',
                  type: 'single',
                  options: ['Vật liệu phát sáng', 'Vật liệu trong suốt', 'Vật liệu kim loại', 'Vật liệu thô ráp'],
                  correctAnswers: ['Vật liệu phát sáng'],
                  explanation: 'Emission shader tạo ra vật liệu có thể phát sáng như đèn LED, neon'
                },
                {
                  id: 'q10',
                  question: 'Mix node trong Shader Editor có chức năng gì?',
                  type: 'single',
                  options: ['Kết hợp nhiều shader hoặc màu', 'Tạo texture mới', 'Render final image', 'Export material'],
                  correctAnswers: ['Kết hợp nhiều shader hoặc màu'],
                  explanation: 'Mix node cho phép kết hợp nhiều shader, màu sắc hoặc giá trị với các blend mode khác nhau'
                }
              ],
              createdAt: new Date('2025-08-3'),
              updatedAt: new Date('2025-08-3')
            }
          ],
          isPublic: true,
          createdAt: new Date('2025-08-3'),
        },
      ];
      setPublicClasses(mockClasses);
      
      // Lưu các quiz từ trang chủ vào localStorage để có thể truy cập được
      const savedQuizzes = localStorage.getItem('quizzes') || '[]';
      const existingQuizzes = JSON.parse(savedQuizzes);
      
      // Thêm các quiz từ mockClasses vào localStorage nếu chưa có
      mockClasses.forEach(classRoom => {
        if (classRoom.quizzes) {
          (classRoom.quizzes as Quiz[]).forEach(quiz => {
            const existingQuiz = existingQuizzes.find((q: any) => q.id === quiz.id);
            if (!existingQuiz) {
              existingQuizzes.push(quiz);
            }
          });
        }
      });
      
      localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));
      
      // Cập nhật thống kê chỉ từ lớp công khai (không bao gồm localStorage)
      const publicQuizCount = mockClasses.reduce((sum, classroom) => {
        return sum + (classroom.quizzes ? classroom.quizzes.length : 0);
      }, 0);
      
      // Chỉ tính từ lớp công khai
      setTotalClasses(mockClasses.length);
      setTotalQuizzes(publicQuizCount);
      setLoading(false);
    }, 0); // Không đặt timeout để tránh delay không cần thiết
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