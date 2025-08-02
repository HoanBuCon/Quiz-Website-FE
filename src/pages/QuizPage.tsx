import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Question, UserAnswer } from '../types';

// Component trang làm bài trắc nghiệm
const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 phút

  // Mock data cho câu hỏi
  useEffect(() => {
    setTimeout(() => {
      const mockQuestions: Question[] = [
        {
          id: '1',
          question: 'Câu 1: Thủ đô của Việt Nam là gì?',
          type: 'single',
          options: ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Huế'],
          correctAnswers: ['Hà Nội'],
        },
        {
          id: '2',
          question: 'Câu 2: Chọn các môn học thuộc khối A:',
          type: 'multiple',
          options: ['Toán', 'Văn', 'Lý', 'Hóa', 'Sinh'],
          correctAnswers: ['Toán', 'Lý', 'Hóa'],
        },
        {
          id: '3',
          question: 'Câu 3: Điền từ còn thiếu: "Việt Nam là một nước thuộc khu vực ..."',
          type: 'text',
          correctAnswers: ['Đông Nam Á'],
        },
        {
          id: '4',
          question: 'Câu 4: 2 + 2 = ?',
          type: 'single',
          options: ['3', '4', '5', '6'],
          correctAnswers: ['4'],
        },
        {
          id: '5',
          question: 'Câu 5: Chọn các số chẵn:',
          type: 'multiple',
          options: ['1', '2', '3', '4', '5'],
          correctAnswers: ['2', '4'],
        },
      ];
      setQuestions(mockQuestions);
      setLoading(false);
    }, 1000);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Xử lý khi người dùng chọn đáp án
  const handleAnswerChange = (questionId: string, answer: string, isMultiple: boolean = false) => {
    setUserAnswers(prev => {
      const existingAnswer = prev.find(a => a.questionId === questionId);
      
      if (existingAnswer) {
        if (isMultiple) {
          // Cho câu hỏi chọn nhiều
          const newAnswers = existingAnswer.answers.includes(answer)
            ? existingAnswer.answers.filter(a => a !== answer)
            : [...existingAnswer.answers, answer];
          return prev.map(a => a.questionId === questionId ? { ...a, answers: newAnswers } : a);
        } else {
          // Cho câu hỏi chọn một
          return prev.map(a => a.questionId === questionId ? { ...a, answers: [answer] } : a);
        }
      } else {
        // Tạo câu trả lời mới
        return [...prev, { questionId, answers: [answer] }];
      }
    });
  };

  // Xử lý khi người dùng nhập đáp án text
  const handleTextAnswer = (questionId: string, answer: string) => {
    setUserAnswers(prev => {
      const existingAnswer = prev.find(a => a.questionId === questionId);
      if (existingAnswer) {
        return prev.map(a => a.questionId === questionId ? { ...a, answers: [answer] } : a);
      } else {
        return [...prev, { questionId, answers: [answer] }];
      }
    });
  };

  // Chuyển đến câu hỏi
  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Nộp bài
  const submitQuiz = () => {
    // Xử lý nộp bài
    console.log('Nộp bài:', userAnswers);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="card p-8 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          <div className="w-1/3">
            <div className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentUserAnswer = userAnswers.find(a => a.questionId === currentQuestion.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header với timer */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bài kiểm tra - Câu {currentQuestionIndex + 1}/{questions.length}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-lg font-semibold text-red-600">
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={submitQuiz}
              className="btn-primary"
            >
              Nộp bài
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Left Section - 70% - Câu hỏi */}
        <div className="flex-1">
          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Hiển thị câu hỏi theo loại */}
            {currentQuestion.type === 'single' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={currentUserAnswer?.answers.includes(option) || false}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-gray-900 dark:text-gray-100">
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'multiple' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      value={option}
                      checked={currentUserAnswer?.answers.includes(option) || false}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, true)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-gray-900 dark:text-gray-100">
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div>
                <input
                  type="text"
                  value={currentUserAnswer?.answers[0] || ''}
                  onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Nhập đáp án của bạn..."
                  className="input-field"
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Câu trước
              </button>
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Câu tiếp
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - 30% - Minimap */}
        <div className="w-1/3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Bản đồ câu hỏi
            </h3>
            
            {/* Minimap grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((question, index) => {
                const hasAnswer = userAnswers.find(a => a.questionId === question.id);
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <button
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isCurrent
                        ? 'bg-primary-600 text-white'
                        : hasAnswer
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-primary-600 rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">Câu hiện tại</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">Đã trả lời</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <span className="text-gray-600 dark:text-gray-300">Chưa trả lời</span>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-300">Tiến độ</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {userAnswers.length}/{questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(userAnswers.length / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage; 