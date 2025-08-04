import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question, UserAnswer, Quiz } from '../types';

// Component trang làm bài trắc nghiệm
const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [markedQuestions, setMarkedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 phút
  const [quizTitle, setQuizTitle] = useState('');
  const [startTime] = useState(Date.now()); // Thời gian bắt đầu làm bài

  // Load quiz data from localStorage
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        console.error('Quiz ID not provided');
        navigate('/classes');
        return;
      }

      try {
        // Tìm trong localStorage trước
        const savedQuizzes = localStorage.getItem('quizzes') || '[]';
        const quizzes: Quiz[] = JSON.parse(savedQuizzes);
        let quiz = quizzes.find(q => q.id === quizId);

        // Nếu không tìm thấy trong localStorage, tìm trong mock data
        if (!quiz) {
          const mockQuizzes = [
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
            {
              id: 'dsa-basic',
              title: 'Cấu trúc dữ liệu và giải thuật',
              description: 'Kiểm tra kiến thức cơ bản về cấu trúc dữ liệu và giải thuật',
              questions: [
                {
                  id: 'q1',
                  question: 'Array có đặc điểm gì?',
                  type: 'single' as const,
                  options: ['Lưu trữ tuần tự trong bộ nhớ', 'Lưu trữ ngẫu nhiên', 'Không có thứ tự', 'Chỉ lưu số'],
                  correctAnswers: ['Lưu trữ tuần tự trong bộ nhớ'],
                  explanation: 'Array lưu trữ các phần tử liên tiếp trong bộ nhớ'
                },
                {
                  id: 'q2',
                  question: 'Stack hoạt động theo nguyên tắc nào?',
                  type: 'single' as const,
                  options: ['LIFO (Last In First Out)', 'FIFO (First In First Out)', 'Random access', 'Priority based'],
                  correctAnswers: ['LIFO (Last In First Out)'],
                  explanation: 'Stack hoạt động theo nguyên tắc LIFO - phần tử cuối vào sẽ ra đầu tiên'
                },
                {
                  id: 'q3',
                  question: 'Queue hoạt động theo nguyên tắc nào?',
                  type: 'single' as const,
                  options: ['FIFO (First In First Out)', 'LIFO (Last In First Out)', 'Random access', 'Priority based'],
                  correctAnswers: ['FIFO (First In First Out)'],
                  explanation: 'Queue hoạt động theo nguyên tắc FIFO - phần tử đầu vào sẽ ra đầu tiên'
                }
              ],
              createdAt: new Date('2025-08-2'),
              updatedAt: new Date('2025-08-2')
            },
            {
              id: 'blender-shading',
              title: 'Kỹ thuật shading trong Blender',
              description: 'Kiểm tra kiến thức về shading và material trong Blender',
              questions: [
                {
                  id: 'q1',
                  question: 'Shader Editor được dùng để làm gì?',
                  type: 'single' as const,
                  options: ['Tạo và chỉnh sửa material', 'Modeling 3D', 'Animation', 'Rendering'],
                  correctAnswers: ['Tạo và chỉnh sửa material'],
                  explanation: 'Shader Editor là nơi tạo và chỉnh sửa các material cho object'
                },
                {
                  id: 'q2',
                  question: 'Principled BSDF là gì?',
                  type: 'single' as const,
                  options: ['Shader node chính cho material', 'Tool modeling', 'Modifier', 'Camera setting'],
                  correctAnswers: ['Shader node chính cho material'],
                  explanation: 'Principled BSDF là shader node cơ bản và quan trọng nhất cho material'
                },
                {
                  id: 'q3',
                  question: 'Roughness parameter điều khiển gì?',
                  type: 'single' as const,
                  options: ['Độ nhám của bề mặt', 'Màu sắc', 'Độ trong suốt', 'Kích thước'],
                  correctAnswers: ['Độ nhám của bề mặt'],
                  explanation: 'Roughness điều khiển độ nhám/mịn của bề mặt material'
                }
              ],
              createdAt: new Date('2025-08-2'),
              updatedAt: new Date('2025-08-2')
            }
            // Có thể thêm các quiz khác từ mock data
          ];
          
          quiz = mockQuizzes.find(q => q.id === quizId);
        }

        if (quiz && quiz.questions) {
          setQuizTitle(quiz.title);
          setQuestions(quiz.questions);
        } else {
          console.error('Quiz not found:', quizId);
          setQuestions([{
            id: 'error',
            question: 'Không tìm thấy bài kiểm tra này',
            type: 'single',
            options: ['Quay lại'],
            correctAnswers: ['Quay lại']
          }]);
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        setQuestions([{
          id: 'error',
          question: 'Có lỗi khi tải bài kiểm tra',
          type: 'single',
          options: ['Quay lại'],
          correctAnswers: ['Quay lại']
        }]);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, navigate]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(prev => prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Xử lý khi người dùng chọn đáp án
  const handleAnswerSelect = (questionId: string, answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    setUserAnswers(prev => {
      const existingAnswer = prev.find(a => a.questionId === questionId);
      
      if (!existingAnswer) {
        return [...prev, { questionId, answers: [answer] }];
      }

      if (currentQuestion.type === 'multiple') {
        // Toggle answer for multiple choice questions
        const updatedAnswers = existingAnswer.answers.includes(answer)
          ? existingAnswer.answers.filter(a => a !== answer)
          : [...existingAnswer.answers, answer];
        
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, answers: updatedAnswers }
            : a
        );
      } else {
        // Replace answer for single choice questions
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, answers: [answer] }
            : a
        );
      }
    });
  };

  const getCurrentAnswer = (questionId: string) => {
    return userAnswers.find(a => a.questionId === questionId)?.answers || [];
  };

  // Navigate to next/previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Submit answers
  const handleSubmit = () => {
    if (window.confirm('Bạn có chắc chắn muốn nộp bài?')) {
      const score = userAnswers.reduce((total, userAnswer) => {
        const question = questions.find(q => q.id === userAnswer.questionId);
        if (!question) return total;
        
        let isCorrect = false;
        
        if (question.type === 'text') {
          // Đối với câu hỏi text, so sánh linh hoạt với tất cả đáp án đúng có thể
          const userAnswer_normalized = userAnswer.answers[0]?.trim().toLowerCase() || '';
          
          // Kiểm tra xem câu trả lời của user có khớp với bất kỳ đáp án đúng nào không
          isCorrect = question.correctAnswers.some(correctAnswer => {
            const correctAnswer_normalized = correctAnswer?.trim().toLowerCase() || '';
            return userAnswer_normalized === correctAnswer_normalized;
          });
          
          console.log('Text question check:', {
            question: question.question.substring(0, 50) + '...',
            userAnswer: userAnswer.answers[0],
            correctAnswers: question.correctAnswers,
            userAnswer_normalized,
            isCorrect,
            availableAnswers: question.correctAnswers.map(ans => ans?.trim().toLowerCase())
          });
        } else {
          // Đối với câu hỏi trắc nghiệm, sử dụng logic cũ
          isCorrect = question.correctAnswers.length === userAnswer.answers.length &&
            question.correctAnswers.every(answer => userAnswer.answers.includes(answer));
        }
        
        return total + (isCorrect ? 1 : 0);
      }, 0);

      // Tính thời gian làm bài (giây)
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      // Tạo object kết quả
      const result = {
        quizId: quizId!,
        quizTitle: quizTitle,
        userAnswers: userAnswers.reduce((acc, answer) => {
          acc[answer.questionId] = answer.answers;
          return acc;
        }, {} as Record<string, string[]>),
        score: score,
        totalQuestions: questions.length,
        timeSpent: timeSpent,
        completedAt: new Date()
      };

      // Lưu kết quả vào sessionStorage
      sessionStorage.setItem(`quiz-result-${quizId}`, JSON.stringify(result));

      // Chuyển hướng đến trang kết quả
      navigate(`/results/${quizId}`);
    }
  };

  // Render error state
  if (questions[0]?.id === 'error') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {questions[0].question}
          </h2>
          <button
            onClick={() => navigate('/classes')}
            className="btn-primary"
          >
            Quay lại danh sách lớp học
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header with title and submit button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {quizTitle}
        </h1>
        <button
          onClick={handleSubmit}
          className="btn-primary w-full sm:w-auto text-sm sm:text-base"
        >
          Nộp bài
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Left Section - Main Content */}
        <div className="flex-1 order-2 lg:order-1">
          {/* Timer */}
          <div className="card p-3 sm:p-4 mb-4 lg:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Thời gian còn lại:</span>
            <span className="font-semibold text-lg sm:text-xl text-gray-900 dark:text-gray-100">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Question */}
          <div className="card p-4 sm:p-6">
            {/* Question number */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Câu {currentQuestionIndex + 1}/{questions.length} (ID: {currentQuestion.id})
                </span>
                <button
                  onClick={() => {
                    setMarkedQuestions(prev => 
                      prev.includes(currentQuestion.id)
                        ? prev.filter(id => id !== currentQuestion.id)
                        : [...prev, currentQuestion.id]
                    );
                  }}
                  className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full transition-colors w-fit ${
                    markedQuestions.includes(currentQuestion.id)
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {markedQuestions.includes(currentQuestion.id) ? 'Đã đánh dấu' : 'Xem lại câu này'}
                </button>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {currentQuestion.type === 'single' ? 'Chọn một đáp án' : 
                 currentQuestion.type === 'multiple' ? 'Chọn nhiều đáp án' : 
                 'Điền đáp án'}
              </span>
            </div>

            {/* Question text */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
              {currentQuestion.question}
            </h2>

            {/* Answer options */}
            <div className="space-y-2 sm:space-y-3">
              {currentQuestion.type === 'text' ? (
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 text-sm sm:text-base"
                  placeholder="Nhập câu trả lời của bạn"
                  value={getCurrentAnswer(currentQuestion.id)[0] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                />
              ) : (
                currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                    className={`w-full p-3 sm:p-4 text-left rounded-lg transition-all duration-200 border text-sm sm:text-base ${
                      getCurrentAnswer(currentQuestion.id).includes(option)
                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-900 dark:text-primary-100 border-primary-500 dark:border-primary-400 shadow-md shadow-primary-500/20 dark:shadow-lg dark:shadow-primary-500/25'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-stone-200 dark:border-gray-700 hover:border-stone-300 dark:hover:border-gray-600 hover:bg-stone-100 dark:hover:bg-gray-700/50 hover:shadow-md hover:shadow-gray-400/15 dark:hover:shadow-md dark:hover:shadow-gray-400/20'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 gap-3 sm:gap-0">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Câu trước
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
            >
              Câu sau
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Section - Sidebar */}
        <div className="w-full lg:w-1/3 order-1 lg:order-2">
          <div className="card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
              Danh sách câu hỏi
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1 sm:gap-2">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`p-1 sm:p-2 text-center rounded-lg transition-all duration-200 border-2 text-xs sm:text-sm
                    ${index === currentQuestionIndex
                      ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20 dark:text-primary-400 dark:bg-primary-900/20 dark:shadow-lg dark:shadow-primary-500/25'
                      : markedQuestions.includes(question.id)
                        ? 'bg-yellow-500 text-white font-medium border-yellow-500 shadow-md shadow-yellow-500/20 dark:text-yellow-400 dark:bg-yellow-900/20 dark:shadow-md dark:shadow-yellow-500/20'
                        : getCurrentAnswer(question.id).length > 0
                          ? 'bg-green-500 text-white font-medium border-green-500 shadow-md shadow-green-500/20 dark:text-green-400 dark:bg-green-900/20 dark:shadow-md dark:shadow-green-500/20'
                          : 'bg-gray-100 text-gray-800 border-gray-100 hover:bg-gray-200 hover:border-gray-200 hover:shadow-md hover:shadow-gray-400/15 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:shadow-md dark:hover:shadow-gray-400/20'
                    }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6 sm:mt-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Tiến độ làm bài: {userAnswers.length}/{questions.length} câu
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round((userAnswers.length / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(userAnswers.length / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
