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
    (async () => {
      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) {
          navigate('/');
          return;
        }
        const { SessionsAPI, ClassesAPI, QuizzesAPI } = await import('../utils/api');
        const sessions = await SessionsAPI.byQuiz(quizId, token);
        if (!sessions || sessions.length === 0) {
          navigate('/');
          return;
        }
        const latest = sessions[0];
        setResult({
          quizId: latest.quizId,
          quizTitle: '',
          userAnswers: latest.answers || {},
          score: latest.score,
          totalQuestions: latest.totalQuestions,
          timeSpent: latest.timeSpent,
          completedAt: new Date(latest.completedAt),
        });
        // Load quiz details by scanning classes (mine + public)
        const mine = await ClassesAPI.listMine(token);
        const pub = await ClassesAPI.listPublic(token);
        let found: any = null;
        for (const cls of [...mine, ...pub]) {
          const qzs = await QuizzesAPI.byClass(cls.id, token);
          const q = qzs.find((qq: any) => qq.id === quizId);
          if (q) { found = q; break; }
        }
        if (found) setQuiz(found);
      } catch (e) {
        console.error('Failed to load results:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, navigate]);

  const findQuiz = (_id: string) => {
    // Deprecated: logic thay thế bằng gọi backend
  };

  const getAnswerStatus = (question: Question, userAnswer: string[]) => {
    const correctAnswers = question.correctAnswers;
    
    let isCorrect = false;
    
    if (question.type === 'text') {
      // Đối với câu hỏi tự luận, so sánh text (không phân biệt hoa thường và khoảng trắng)
      const userText = (userAnswer[0] || '').trim().toLowerCase();
      
      // Kiểm tra xem có đáp án đúng được thiết lập không
      const validCorrectAnswers = correctAnswers.filter(ans => ans?.trim());
      
      if (validCorrectAnswers.length === 0) {
        // Nếu không có đáp án đúng nào được thiết lập, coi như sai
        isCorrect = false;
      } else {
        // So sánh với các đáp án đúng có sẵn
        isCorrect = validCorrectAnswers.some(correct => 
          correct.trim().toLowerCase() === userText
        );
      }
    } else {
      // Đối với câu hỏi trắc nghiệm
      isCorrect = userAnswer.length === correctAnswers.length && 
                 userAnswer.every(answer => correctAnswers.includes(answer));
    }
    
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
                {question.type === 'text' ? (
                  // Hiển thị cho câu hỏi tự luận
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border ${
                      isCorrect 
                        ? 'bg-green-200 border-green-400 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                        : 'bg-red-300 border-red-500 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Câu trả lời của bạn: {userAnswer[0] || '(Không trả lời)'}
                        </span>
                        <span className={`text-sm font-semibold ${
                          isCorrect 
                            ? 'text-green-800 dark:text-green-400' 
                            : 'text-red-800 dark:text-red-400'
                        }`}>
                          {isCorrect ? '✓ Đúng' : '✗ Sai'}
                        </span>
                      </div>
                    </div>
                    
                    {!isCorrect && (
                      <div className="p-3 rounded-lg border bg-green-200 border-green-400 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Đáp án đúng: {correctAnswers.filter(ans => ans?.trim()).length > 0 
                              ? correctAnswers.filter(ans => ans?.trim()).join(', ')
                              : 'Chưa có đáp án được thiết lập'}
                          </span>
                          <span className="text-sm font-semibold text-green-800 dark:text-green-400">
                            ✓ Đáp án đúng
                          </span>
                        </div>
                        {correctAnswers.filter(ans => ans?.trim()).length === 0 && (
                          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                            ⚠️ Câu hỏi này chưa được thiết lập đáp án đúng
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Hiển thị cho câu hỏi trắc nghiệm
                  question.options?.map((option, optionIndex) => {
                    const isUserChoice = userAnswer.includes(option);
                    const isCorrectOption = correctAnswers.includes(option);
                    
                    let optionClass = 'p-3 rounded-lg border transition-colors ';
                    
                    if (isCorrectOption) {
                      optionClass += 'bg-green-200 border-green-400 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
                    } else if (isUserChoice && !isCorrectOption) {
                      optionClass += 'bg-red-300 border-red-500 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
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
                  })
                )}
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
            Làm lại Quiz
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
