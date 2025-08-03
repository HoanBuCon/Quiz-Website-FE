import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Quiz, Question } from '../types';

interface QuizResult {
  quizId: string;
  quizTitle: string;
  userAnswers: Record<string, string[]>;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: Date;
}

const ResultsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExplanations, setShowExplanations] = useState(false);

  useEffect(() => {
    if (!quizId) {
      navigate('/');
      return;
    }

    // Lấy kết quả quiz từ sessionStorage
    const resultData = sessionStorage.getItem(`quiz-result-${quizId}`);
    if (!resultData) {
      navigate('/');
      return;
    }

    const parsedResult: QuizResult = JSON.parse(resultData);
    setResult(parsedResult);

    // Tìm quiz từ mock data hoặc localStorage
    findQuiz(quizId);
  }, [quizId, navigate]);

  const findQuiz = (id: string) => {
    // Tìm trong mock data trước
    const mockQuizzes = [
      // Quiz OOP
      {
        id: 'quiz-oop-1',
        title: 'Kiểm tra OOP cơ bản',
        description: 'Bài kiểm tra về các khái niệm cơ bản của lập trình hướng đối tượng',
        questions: [
          {
            id: 'q1',
            question: 'OOP là viết tắt của gì?',
            type: 'single' as const,
            options: ['Object Oriented Programming', 'Object Order Programming', 'Only Object Programming', 'Open Object Programming'],
            correctAnswers: ['Object Oriented Programming'],
            explanation: 'OOP là Object Oriented Programming - Lập trình hướng đối tượng'
          },
          {
            id: 'q2',
            question: 'Encapsulation trong OOP có nghĩa là gì?',
            type: 'single' as const,
            options: ['Đóng gói dữ liệu và phương thức', 'Kế thừa từ lớp cha', 'Đa hình của đối tượng', 'Trừu tượng hóa dữ liệu'],
            correctAnswers: ['Đóng gói dữ liệu và phương thức'],
            explanation: 'Encapsulation là việc đóng gói dữ liệu và các phương thức thao tác trên dữ liệu đó trong một đơn vị'
          },
          {
            id: 'q3',
            question: 'Inheritance cho phép làm gì?',
            type: 'single' as const,
            options: ['Tạo lớp mới từ lớp đã có', 'Ẩn thông tin của đối tượng', 'Tạo nhiều đối tượng', 'Xóa đối tượng khỏi bộ nhớ'],
            correctAnswers: ['Tạo lớp mới từ lớp đã có'],
            explanation: 'Inheritance (kế thừa) cho phép tạo lớp mới dựa trên lớp đã có, kế thừa các thuộc tính và phương thức'
          },
          {
            id: 'q4',
            question: 'Polymorphism là gì?',
            type: 'single' as const,
            options: ['Khả năng đa hình của đối tượng', 'Ẩn dữ liệu private', 'Tạo constructor', 'Quản lý bộ nhớ'],
            correctAnswers: ['Khả năng đa hình của đối tượng'],
            explanation: 'Polymorphism cho phép cùng một interface có thể được sử dụng cho các kiểu dữ liệu khác nhau'
          },
          {
            id: 'q5',
            question: 'Constructor trong OOP có chức năng gì?',
            type: 'single' as const,
            options: ['Khởi tạo đối tượng', 'Hủy đối tượng', 'So sánh đối tượng', 'Copy đối tượng'],
            correctAnswers: ['Khởi tạo đối tượng'],
            explanation: 'Constructor là phương thức đặc biệt được gọi khi tạo đối tượng mới'
          },
          {
            id: 'q6',
            question: 'Access modifier nào cho phép truy cập từ bên ngoài class?',
            type: 'single' as const,
            options: ['public', 'private', 'protected', 'internal'],
            correctAnswers: ['public'],
            explanation: 'public cho phép truy cập từ bất kỳ đâu, kể cả bên ngoài class'
          },
          {
            id: 'q7',
            question: 'Method overriding là gì?',
            type: 'single' as const,
            options: ['Ghi đè phương thức của lớp cha', 'Tạo phương thức mới', 'Xóa phương thức', 'Copy phương thức'],
            correctAnswers: ['Ghi đè phương thức của lớp cha'],
            explanation: 'Method overriding cho phép lớp con định nghĩa lại phương thức đã có trong lớp cha'
          },
          {
            id: 'q8',
            question: 'Abstract class khác gì với interface?',
            type: 'single' as const,
            options: ['Abstract class có thể có implementation', 'Interface có thể có constructor', 'Abstract class không có method', 'Không có sự khác biệt'],
            correctAnswers: ['Abstract class có thể có implementation'],
            explanation: 'Abstract class có thể chứa cả phương thức đã implement và chưa implement, interface chỉ định nghĩa signature'
          },
          {
            id: 'q9',
            question: 'Static method có đặc điểm gì?',
            type: 'single' as const,
            options: ['Thuộc về class, không thuộc về instance', 'Thuộc về instance cụ thể', 'Không thể gọi được', 'Chỉ dùng trong constructor'],
            correctAnswers: ['Thuộc về class, không thuộc về instance'],
            explanation: 'Static method thuộc về class và có thể gọi mà không cần tạo instance'
          },
          {
            id: 'q10',
            question: 'Garbage Collection trong OOP có tác dụng gì?',
            type: 'single' as const,
            options: ['Tự động giải phóng bộ nhớ', 'Tạo đối tượng mới', 'Sắp xếp đối tượng', 'Bảo mật đối tượng'],
            correctAnswers: ['Tự động giải phóng bộ nhớ'],
            explanation: 'Garbage Collection tự động thu hồi bộ nhớ của các đối tượng không còn được sử dụng'
          }
        ],
        createdAt: new Date('2025-08-2'),
        updatedAt: new Date('2025-08-2')
      },
      // Quiz DSA
      {
        id: 'quiz-dsa-1',
        title: 'Kiểm tra DSA cơ bản',
        description: 'Bài kiểm tra về cấu trúc dữ liệu và giải thuật cơ bản',
        questions: [
          {
            id: 'q1',
            question: 'Time complexity của thuật toán Linear Search là gì?',
            type: 'single' as const,
            options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
            correctAnswers: ['O(n)'],
            explanation: 'Linear Search có time complexity O(n) vì phải duyệt qua tất cả phần tử trong trường hợp xấu nhất'
          },
          {
            id: 'q2',
            question: 'Stack hoạt động theo nguyên tắc nào?',
            type: 'single' as const,
            options: ['LIFO (Last In First Out)', 'FIFO (First In First Out)', 'Random Access', 'Priority Based'],
            correctAnswers: ['LIFO (Last In First Out)'],
            explanation: 'Stack hoạt động theo nguyên tắc LIFO - phần tử vào cuối sẽ ra đầu tiên'
          },
          {
            id: 'q3',
            question: 'Queue hoạt động theo nguyên tắc nào?',
            type: 'single' as const,
            options: ['FIFO (First In First Out)', 'LIFO (Last In First Out)', 'Random Access', 'Priority Based'],
            correctAnswers: ['FIFO (First In First Out)'],
            explanation: 'Queue hoạt động theo nguyên tắc FIFO - phần tử vào trước sẽ ra trước'
          },
          {
            id: 'q4',
            question: 'Binary Search chỉ hoạt động trên mảng có tính chất gì?',
            type: 'single' as const,
            options: ['Đã được sắp xếp', 'Chưa được sắp xếp', 'Có độ dài chẵn', 'Có độ dài lẻ'],
            correctAnswers: ['Đã được sắp xếp'],
            explanation: 'Binary Search chỉ hoạt động trên mảng đã được sắp xếp để có thể chia đôi không gian tìm kiếm'
          },
          {
            id: 'q5',
            question: 'Time complexity của Binary Search là gì?',
            type: 'single' as const,
            options: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'],
            correctAnswers: ['O(log n)'],
            explanation: 'Binary Search có time complexity O(log n) vì chia đôi không gian tìm kiếm ở mỗi bước'
          },
          {
            id: 'q6',
            question: 'Linked List có ưu điểm gì so với Array?',
            type: 'single' as const,
            options: ['Thêm/xóa phần tử linh hoạt', 'Truy cập ngẫu nhiên nhanh', 'Sử dụng ít bộ nhớ', 'Tìm kiếm nhanh hơn'],
            correctAnswers: ['Thêm/xóa phần tử linh hoạt'],
            explanation: 'Linked List cho phép thêm/xóa phần tử ở bất kỳ vị trí nào mà không cần dịch chuyển các phần tử khác'
          },
          {
            id: 'q7',
            question: 'Bubble Sort có time complexity là gì?',
            type: 'single' as const,
            options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'],
            correctAnswers: ['O(n²)'],
            explanation: 'Bubble Sort có time complexity O(n²) do sử dụng 2 vòng lặp lồng nhau'
          },
          {
            id: 'q8',
            question: 'Hash Table sử dụng gì để tìm vị trí lưu trữ?',
            type: 'single' as const,
            options: ['Hash function', 'Linear search', 'Binary search', 'Random function'],
            correctAnswers: ['Hash function'],
            explanation: 'Hash Table sử dụng hash function để tính toán vị trí lưu trữ dựa trên key'
          },
          {
            id: 'q9',
            question: 'Tree có node gốc được gọi là gì?',
            type: 'single' as const,
            options: ['Root', 'Leaf', 'Branch', 'Parent'],
            correctAnswers: ['Root'],
            explanation: 'Node gốc của cây được gọi là Root node - không có parent node'
          },
          {
            id: 'q10',
            question: 'DFS (Depth First Search) sử dụng cấu trúc dữ liệu nào?',
            type: 'single' as const,
            options: ['Stack', 'Queue', 'Heap', 'Hash Table'],
            correctAnswers: ['Stack'],
            explanation: 'DFS sử dụng Stack để lưu trữ các node cần thăm, có thể implement bằng recursion hoặc explicit stack'
          }
        ],
        createdAt: new Date('2025-08-2'),
        updatedAt: new Date('2025-08-2')
      },
      // Quiz Blender
      {
        id: 'quiz-blender-1',
        title: 'Kiểm tra Blender Shading',
        description: 'Bài kiểm tra về kỹ thuật shading và material trong Blender',
        questions: [
          {
            id: 'q1',
            question: 'Shader Editor trong Blender được dùng để làm gì?',
            type: 'single' as const,
            options: ['Tạo và chỉnh sửa material', 'Modeling 3D', 'Animation', 'Render setup'],
            correctAnswers: ['Tạo và chỉnh sửa material'],
            explanation: 'Shader Editor là workspace chuyên dụng để tạo và chỉnh sửa material bằng node system'
          },
          {
            id: 'q2',
            question: 'Principled BSDF là gì trong Blender?',
            type: 'single' as const,
            options: ['Shader node chính cho PBR material', 'Công cụ modeling', 'Kiểu animation', 'Render engine'],
            correctAnswers: ['Shader node chính cho PBR material'],
            explanation: 'Principled BSDF là shader node chính để tạo PBR (Physically Based Rendering) material'
          },
          {
            id: 'q3',
            question: 'Metallic property trong Principled BSDF có giá trị từ bao nhiêu?',
            type: 'single' as const,
            options: ['0 đến 1', '0 đến 100', '-1 đến 1', '0 đến 255'],
            correctAnswers: ['0 đến 1'],
            explanation: 'Metallic property có giá trị từ 0 (non-metal) đến 1 (full metal)'
          },
          {
            id: 'q4',
            question: 'Roughness trong material ảnh hưởng đến gì?',
            type: 'single' as const,
            options: ['Độ nhám của bề mặt', 'Màu sắc material', 'Độ trong suốt', 'Kích thước object'],
            correctAnswers: ['Độ nhám của bề mặt'],
            explanation: 'Roughness điều khiển độ nhám của bề mặt, ảnh hưởng đến cách phản xạ ánh sáng'
          },
          {
            id: 'q5',
            question: 'Normal Map được dùng để làm gì?',
            type: 'single' as const,
            options: ['Tạo chi tiết bề mặt fake', 'Thay đổi hình dạng mesh', 'Tạo animation', 'Thay đổi màu sắc'],
            correctAnswers: ['Tạo chi tiết bề mặt fake'],
            explanation: 'Normal Map tạo ảo giác về chi tiết bề mặt mà không thay đổi geometry thực tế'
          },
          {
            id: 'q6',
            question: 'UV Mapping trong Blender là gì?',
            type: 'single' as const,
            options: ['Ánh xạ texture 2D lên mesh 3D', 'Tạo animation', 'Render lighting', 'Modeling tool'],
            correctAnswers: ['Ánh xạ texture 2D lên mesh 3D'],
            explanation: 'UV Mapping là quá trình ánh xạ texture 2D lên bề mặt mesh 3D'
          },
          {
            id: 'q7',
            question: 'ColorRamp node được dùng để làm gì?',
            type: 'single' as const,
            options: ['Điều khiển gradient màu', 'Tạo hình học', 'Render image', 'Tạo animation key'],
            correctAnswers: ['Điều khiển gradient màu'],
            explanation: 'ColorRamp node cho phép tạo và điều khiển gradient màu từ giá trị input'
          },
          {
            id: 'q8',
            question: 'Subsurface Scattering mô phỏng hiệu ứng gì?',
            type: 'single' as const,
            options: ['Ánh sáng xuyên qua bề mặt', 'Phản xạ gương', 'Độ trong suốt', 'Phát sáng'],
            correctAnswers: ['Ánh sáng xuyên qua bề mặt'],
            explanation: 'Subsurface Scattering mô phỏng ánh sáng xuyên vào bề mặt và tán xạ bên trong vật liệu'
          },
          {
            id: 'q9',
            question: 'Emission shader tạo ra hiệu ứng gì?',
            type: 'single' as const,
            options: ['Vật liệu phát sáng', 'Vật liệu trong suốt', 'Vật liệu kim loại', 'Vật liệu thô ráp'],
            correctAnswers: ['Vật liệu phát sáng'],
            explanation: 'Emission shader tạo ra vật liệu có thể phát sáng như đèn LED, neon'
          },
          {
            id: 'q10',
            question: 'Mix node trong Shader Editor có chức năng gì?',
            type: 'single' as const,
            options: ['Kết hợp nhiều shader hoặc màu', 'Tạo texture mới', 'Render final image', 'Export material'],
            correctAnswers: ['Kết hợp nhiều shader hoặc màu'],
            explanation: 'Mix node cho phép kết hợp nhiều shader, màu sắc hoặc giá trị với các blend mode khác nhau'
          }
        ],
        createdAt: new Date('2025-08-3'),
        updatedAt: new Date('2025-08-3')
      }
      // Thêm các quiz khác nếu cần
    ];

    let foundQuiz = mockQuizzes.find(q => q.id === id);

    if (!foundQuiz) {
      // Tìm trong localStorage
      const savedQuizzes = localStorage.getItem('quizzes');
      if (savedQuizzes) {
        const quizzes = JSON.parse(savedQuizzes);
        foundQuiz = quizzes.find((q: Quiz) => q.id === id);
      }
    }

    if (foundQuiz) {
      setQuiz(foundQuiz);
    }
    setLoading(false);
  };

  const getAnswerStatus = (question: Question, userAnswer: string[]) => {
    const correctAnswers = question.correctAnswers;
    const isCorrect = userAnswer.length === correctAnswers.length && 
                     userAnswer.every(answer => correctAnswers.includes(answer));
    
    return {
      isCorrect,
      userAnswer,
      correctAnswers
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || !result) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Không tìm thấy kết quả quiz
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Kết quả quiz không còn khả dụng hoặc đã hết hạn.
          </p>
          <Link to="/" className="btn-primary">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const percentage = Math.round((result.score / result.totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header với kết quả tổng quan */}
      <div className="card p-8 mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Kết quả làm bài
          </h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-400">
            {result.quizTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(result.score, result.totalQuestions)} mb-2`}>
              {result.score}/{result.totalQuestions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Điểm số</div>
          </div>
          
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(result.score, result.totalQuestions)} mb-2`}>
              {percentage}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tỷ lệ đúng</div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {formatTime(result.timeSpent)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Thời gian</div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 dark:text-gray-400 mb-2">
              {result.totalQuestions - result.score}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Câu sai</div>
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${
              percentage >= 80 ? 'bg-green-500' : 
              percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* Thông báo kết quả */}
        <div className="text-center">
          {percentage >= 80 && (
            <p className="text-green-600 font-semibold">🎉 Xuất sắc! Bạn đã làm bài rất tốt!</p>
          )}
          {percentage >= 60 && percentage < 80 && (
            <p className="text-yellow-600 font-semibold">👍 Khá tốt! Bạn có thể làm tốt hơn nữa!</p>
          )}
          {percentage < 60 && (
            <p className="text-red-600 font-semibold">💪 Hãy cố gắng hơn! Xem lại lý thuyết và thử lại!</p>
          )}
        </div>
      </div>

      {/* Nút điều khiển */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setShowExplanations(!showExplanations)}
          className="btn-secondary"
        >
          {showExplanations ? 'Ẩn giải thích' : 'Hiện giải thích'}
        </button>
        <button
          onClick={() => navigate(`/quiz/${quizId}`)}
          className="btn-primary"
        >
          Làm lại
        </button>
        <Link to="/" className="btn-secondary">
          Về trang chủ
        </Link>
      </div>

      {/* Chi tiết từng câu hỏi */}
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Chi tiết câu trả lời
        </h3>
        
        {quiz.questions.map((question, index) => {
          const userAnswer = result.userAnswers[question.id] || [];
          const { isCorrect, correctAnswers } = getAnswerStatus(question, userAnswer);
          
          return (
            <div key={question.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <span className="mr-3">Câu {index + 1}:</span>
                  {isCorrect ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </h4>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isCorrect 
                    ? 'bg-green-200 text-green-900 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-200 text-red-900 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {isCorrect ? 'Đúng' : 'Sai'}
                </span>
              </div>

              <p className="text-gray-900 dark:text-white mb-4 text-lg">
                {question.question}
              </p>

              <div className="space-y-3">
                {question.options?.map((option, optionIndex) => {
                  const isUserChoice = userAnswer.includes(option);
                  const isCorrectOption = correctAnswers.includes(option);
                  
                  let optionClass = 'p-3 rounded-lg border transition-colors ';
                  
                  if (isCorrectOption) {
                    optionClass += 'bg-green-200 border-green-400 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
                  } else if (isUserChoice && !isCorrectOption) {
                    optionClass += 'bg-red-200 border-red-400 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
                  } else {
                    optionClass += 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300';
                  }

                  return (
                    <div key={optionIndex} className={optionClass}>
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        <div className="flex items-center gap-2">
                          {isUserChoice && (
                            <span className={`text-sm font-semibold ${
                              isCorrectOption 
                                ? 'text-green-800 dark:text-green-400' 
                                : 'text-red-800 dark:text-red-400'
                            }`}>
                              {isCorrectOption ? '✓ Bạn chọn (Đúng)' : '✗ Bạn chọn (Sai)'}
                            </span>
                          )}
                          {isCorrectOption && !isUserChoice && (
                            <span className="text-sm font-semibold text-green-800 dark:text-green-400">
                              ✓ Đáp án đúng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Giải thích */}
              {showExplanations && question.explanation && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    💡 Giải thích:
                  </h5>
                  <p className="text-blue-800 dark:text-blue-200">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="mt-8 text-center">
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate(`/quiz/${quizId}`)}
            className="btn-primary"
          >
            Làm lại bài quiz
          </button>
          <Link to="/classes" className="btn-secondary">
            Xem lớp học khác
          </Link>
          <Link to="/" className="btn-secondary">
            Về trang chủ
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Hoàn thành lúc: {new Date(result.completedAt).toLocaleString('vi-VN')}
        </p>
      </div>
    </div>
  );
};

export default ResultsPage;
