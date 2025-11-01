import { FaRegDotCircle, FaRegEdit } from "react-icons/fa";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question, UserAnswer, Quiz } from '../types';
import { buildShortId } from '../utils/share';

// Component trang làm bài trắc nghiệm
const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [markedQuestions, setMarkedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0); // Sẽ set sau khi load quiz
  const [quizTitle, setQuizTitle] = useState('');
  const [startTime] = useState(Date.now()); // Thời gian bắt đầu làm bài
  const [effectiveQuizId, setEffectiveQuizId] = useState<string | null>(null);

  // Load quiz data from backend
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        console.error('Quiz ID not provided');
        navigate('/classes');
        return;
      }

      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) {
          navigate('/');
          return;
        }
        const { QuizzesAPI } = await import('../utils/api');
        
        // Use direct API call which handles public/share/owner logic in backend
        const found = await QuizzesAPI.getById(quizId, token);
        
        if (found) {
          setQuizTitle(found.title);
          setQuestions(found.questions || []);
          setEffectiveQuizId(found.id);
        } else {
          throw new Error('Quiz không tìm thấy');
        }
      } catch (error: any) {
        console.error('Error loading quiz:', error);
        setQuestions([{
          id: 'error',
          question: error?.message?.includes('Forbidden') || error?.message?.includes('Quiz chưa xuất bản')
            ? 'Quiz không khả dụng hoặc chưa được chia sẻ'
            : 'Quiz không tìm thấy',
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

  // Set timeout = 5 phút * số lượng câu hỏi sau khi load quiz
  useEffect(() => {
    if (questions.length > 0) {
      setTimeLeft(questions.length * 5 * 60); // 5 phút mỗi câu hỏi
    }
  }, [questions]);

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
  const handleSubmit = async () => {
    if (window.confirm('Bạn có chắc chắn muốn nộp bài?')) {
      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) {
          alert('Vui lòng đăng nhập để nộp bài.');
          return;
        }
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const answersMap = userAnswers.reduce((acc, answer) => {
          acc[answer.questionId] = answer.answers;
          return acc;
        }, {} as Record<string, string[]>);
        const { SessionsAPI } = await import('../utils/api');
        const qid = effectiveQuizId || quizId!;
        await SessionsAPI.submit({ quizId: qid, answers: answersMap, timeSpent }, token);
        navigate(`/results/${qid}`);
      } catch (e) {
        console.error('Submit failed:', e);
        alert('Có lỗi xảy ra khi nộp bài.');
      }
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
            <div className="flex flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Câu {currentQuestionIndex + 1}/{questions.length} (ID: {currentQuestion.id})
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {currentQuestion.type === 'single' ? 'Chọn một đáp án' : 
                   currentQuestion.type === 'multiple' ? 'Chọn nhiều đáp án' : 
                   'Điền đáp án'}
                </span>
              </div>
              <button
                onClick={() => {
                  setMarkedQuestions(prev => 
                    prev.includes(currentQuestion.id)
                      ? prev.filter(id => id !== currentQuestion.id)
                      : [...prev, currentQuestion.id]
                  );
                }}
                className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full transition-colors w-fit mt-0 sm:mt-0 ${
                  markedQuestions.includes(currentQuestion.id)
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {markedQuestions.includes(currentQuestion.id) ? 'Đã đánh dấu' : 'Xem lại câu này'}
              </button>
            </div>


            {/* Question text */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
              {currentQuestion.question}
            </h2>
            {/* Question image nếu có */}
            {currentQuestion.questionImage && (
              <div className="mb-4 sm:mb-6">
                <img
                  src={currentQuestion.questionImage}
                  alt="Question"
                  className="w-full h-auto rounded-lg shadow border border-gray-200 dark:border-gray-600 object-contain"
                  style={{ display: 'block', width: '100%', objectFit: 'contain', margin: '0 auto' }}
                />
              </div>
            )}

            {/* Divider */}
            <div className="w-full flex items-center my-4 sm:my-6">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-3 flex items-center justify-center">
                {currentQuestion.type === 'single' || currentQuestion.type === 'multiple' ? (
                  <FaRegDotCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                ) : (
                  <FaRegEdit className="w-5 h-5 text-green-500 dark:text-green-400" />
                )}
              </span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

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
                currentQuestion.options?.map((option, index) => {
                  const optionImage = currentQuestion.optionImages && currentQuestion.optionImages[option];
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      className={`w-full p-3 sm:p-4 text-left rounded-lg transition-all duration-200 border text-sm sm:text-base ${
                        getCurrentAnswer(currentQuestion.id).includes(option)
                          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-900 dark:text-primary-100 border-primary-500 dark:border-primary-400 shadow-md shadow-primary-500/20 dark:shadow-lg dark:shadow-primary-500/25'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-stone-200 dark:border-gray-700 hover:border-stone-300 dark:hover:border-gray-600 hover:bg-stone-100 dark:hover:bg-gray-700/50 hover:shadow-md hover:shadow-gray-400/15 dark:hover:shadow-md dark:hover:shadow-gray-400/20'
                      }`}
                    >
                      <div className="flex flex-col items-start gap-2 w-full">
                        <span>{String.fromCharCode(65 + index)}. {option}</span>
                        {optionImage && (
                          <img
                            src={optionImage}
                            alt={`Option ${String.fromCharCode(65 + index)}`}
                            className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600 object-contain"
                            style={{ display: 'block', width: '100%', objectFit: 'contain', margin: '0.25rem 0 0 0' }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-row justify-between mt-4 sm:mt-6 gap-3 w-full">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-base sm:text-lg px-4 py-2 sm:px-5 sm:py-2 min-w-[110px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Câu trước
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-base sm:text-lg px-4 py-2 sm:px-5 sm:py-2 min-w-[110px]"
            >
              Câu sau
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
