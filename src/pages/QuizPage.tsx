import { FaRegDotCircle, FaRegEdit, FaRegHandPointer, FaSitemap } from "react-icons/fa";
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question, UserAnswer, DragTarget, DragItem } from '../types';
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
  const [quizTitle, setQuizTitle] = useState('');
  const [startTime] = useState(Date.now()); // Thời gian bắt đầu làm bài
  const [effectiveQuizId, setEffectiveQuizId] = useState<string | null>(null);

  // UI mode: 'default' (nộp bài mới xem kết quả) | 'instant' (xem kết quả ngay)
  const [uiMode, setUiMode] = useState<'default' | 'instant'>('default');
  const [showModeChooser, setShowModeChooser] = useState<boolean>(false);
  // Lưu trạng thái đã xác nhận (reveal) cho các câu hỏi cần nút Xác nhận (text/drag)
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  // Theo dõi viewport để render floating nút chuyển đổi chỉ khi >= 1024px (lg)
  const [isLarge, setIsLarge] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));

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

  // Hỏi người dùng chọn định dạng khi vào trang
  useEffect(() => {
    // Chỉ hiển thị sau khi loading xong và có câu hỏi hợp lệ
    if (!loading && questions.length > 0) {
      setShowModeChooser(true);
    }
  }, [loading, questions.length]);

  // Lắng nghe thay đổi kích thước màn hình để quyết định có render floating toggle hay không
  useEffect(() => {
    const onResize = () => setIsLarge(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Xử lý khi người dùng chọn đáp án (cho single/multiple/text)
  const handleAnswerSelect = (questionId: string, answer: string, questionType?: 'single' | 'multiple' | 'text') => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Xác định type: ưu tiên questionType được truyền vào (cho sub-question), fallback về currentQuestion.type
    const typeToCheck = questionType || currentQuestion.type;

    // Nếu đang ở chế độ instant và câu hỏi đã reveal (khoá), không cho chọn lại
    if (uiMode === 'instant') {
      // Khoá top-level khi đã reveal
      if (revealed.has(questionId)) return;
      // Trong composite: nếu đang chọn câu con và parent đã reveal thì không cho chọn
      if (currentQuestion.type === 'composite' && questionId !== currentQuestion.id && revealed.has(currentQuestion.id)) return;
    }
    
    setUserAnswers(prev => {
      const existingAnswer = prev.find(a => a.questionId === questionId);
      
      if (!existingAnswer) {
        return [...prev, { questionId, answers: [answer] }];
      }

      if (typeToCheck === 'multiple') {
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

    // Ở chế độ instant: Single (top-level) sẽ reveal và khoá ngay sau khi chọn lần đầu
    if (uiMode === 'instant') {
      const isTopLevel = questionId === currentQuestion.id;
      if (isTopLevel && (typeToCheck === 'single') && currentQuestion.type === 'single') {
        markRevealed(questionId);
      }
    }
  };

  const getCurrentAnswer = (questionId: string) => {
    return userAnswers.find(a => a.questionId === questionId)?.answers || [];
  };

  // Kiểm tra xem câu hỏi đã được trả lời chưa (cho minimap)
  const isQuestionAnswered = (question: Question): boolean => {
    if (question.type === 'drag') {
      // Drag-drop: kiểm tra xem có mapping nào không
      const answer = userAnswers.find(a => a.questionId === question.id);
      if (!answer) return false;
      const mapping = answer.answers?.[0];
      if (!mapping || typeof mapping !== 'object') return false;
      return Object.keys(mapping).length > 0;
    } else if (question.type === 'composite') {
      // Composite: kiểm tra tất cả sub-questions đã được trả lời chưa
      const subQuestions = (question as any).subQuestions || [];
      if (subQuestions.length === 0) return false;
      return subQuestions.every((sub: Question) => {
        const subAnswer = getCurrentAnswer(sub.id);
        if (sub.type === 'drag') {
          const mapping = userAnswers.find(a => a.questionId === sub.id)?.answers?.[0];
          return mapping && typeof mapping === 'object' && Object.keys(mapping).length > 0;
        }
        return subAnswer.length > 0;
      });
    } else {
      // Single/Multiple/Text: kiểm tra length
      return getCurrentAnswer(question.id).length > 0;
    }
  };

  // Helpers
  const getCorrectAnswers = (q: Question): string[] => {
    if (q.type === 'drag' || q.type === 'composite') return [] as string[];
    const ca = Array.isArray(q.correctAnswers) ? q.correctAnswers as string[] : [];
    return ca;
  };

  const isRevealed = (qid: string) => uiMode === 'instant' && revealed.has(qid);
  const isChoiceReveal = (q: Question, _selected: string[], forceReveal: boolean = false) => uiMode === 'instant' && (forceReveal || revealed.has(q.id));

  const markRevealed = (qid: string) => setRevealed(prev => new Set(prev).add(qid));
  const unmarkRevealed = (qid: string) => setRevealed(prev => { const n = new Set(prev); n.delete(qid); return n; });

  const isTextAnswerCorrect = (q: Question, value: string) => {
    const ca = Array.isArray(q.correctAnswers) ? q.correctAnswers as string[] : [];
    const norm = (s: string) => (s || '').trim().toLowerCase();
    return ca.some(ans => norm(ans) === norm(value));
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
          const v: any = answer.answers;
          acc[answer.questionId] = (Array.isArray(v) && typeof v[0] === 'object') ? v[0] : v;
          return acc;
        }, {} as Record<string, any>);
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
    const Spinner = require('../components/Spinner').default;
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex items-center justify-center">
        <Spinner size={48} />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
        <div className="flex-1 min-w-0 order-2 lg:order-1">
          {/* Question */}
          <div className="group card p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 border-l-4 border-l-stone-400 dark:border-l-gray-600 hover:border-l-blue-500 dark:hover:border-l-blue-500">
            {/* Question number */}
            <div className="flex flex-row justify-between items-start mb-4 gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Câu {currentQuestionIndex + 1}/{questions.length} (ID: {currentQuestion.id})
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {currentQuestion.type === 'single' ? 'Chọn một đáp án' : 
                   currentQuestion.type === 'multiple' ? 'Chọn nhiều đáp án' : 
                   (currentQuestion.type === 'drag' ? 'Kéo thả đáp án vào nhóm/ô tương ứng' :
                   (currentQuestion.type === 'composite' ? 'Câu hỏi gồm nhiều câu hỏi con' : 'Điền đáp án'))}
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
                  className={`text-[11px] md:text-sm px-2 md:px-3 py-1 rounded-full leading-tight transition-colors w-auto md:w-fit max-w-[120px] md:max-w-none overflow-hidden text-ellipsis whitespace-nowrap min-h-[1.75rem] max-h-[1.75rem] md:min-h-[2rem] md:max-h-[2rem] flex items-center shrink-0 ${
                  markedQuestions.includes(currentQuestion.id)
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
              <div className="flex-1 border-t border-gray-400 dark:border-gray-600"></div>
              <span className="px-3 flex items-center justify-center">
                {currentQuestion.type === 'single' || currentQuestion.type === 'multiple' ? (
                  <FaRegDotCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                ) : currentQuestion.type === 'text' ? (
                  <FaRegEdit className="w-5 h-5 text-green-500 dark:text-green-400" />
                ) : currentQuestion.type === 'drag' ? (
                  <FaRegHandPointer className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                ) : currentQuestion.type === 'composite' ? (
                  <FaSitemap className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                ) : (
                  <FaRegEdit className="w-5 h-5 text-green-500 dark:text-green-400" />
                )}
              </span>
              <div className="flex-1 border-t border-gray-400 dark:border-gray-600"></div>
            </div>

            {/* Answer options */}
            <div className="space-y-2 sm:space-y-3">
              {currentQuestion.type === 'text' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    disabled={isRevealed(currentQuestion.id)}
                    className={`w-full p-3 rounded-lg text-sm sm:text-base transition-colors duration-200 dark:bg-gray-700 dark:text-gray-100 border ${
                      isRevealed(currentQuestion.id)
                        ? (isTextAnswerCorrect(currentQuestion, (getCurrentAnswer(currentQuestion.id)[0] as string) || '')
                            ? 'border-green-600 bg-green-500 text-white dark:bg-green-900/40 dark:text-green-100 dark:border-green-500'
                            : 'border-rose-600 bg-rose-500 text-white dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-500')
                        : 'border-gray-400 dark:border-gray-600'
                    }`}
                    placeholder="Nhập câu trả lời của bạn"
                    value={(getCurrentAnswer(currentQuestion.id)[0] || '') as string}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                  />
                  {uiMode === 'instant' && isRevealed(currentQuestion.id) && (
                    <TextRevealPanel question={currentQuestion} userValue={(getCurrentAnswer(currentQuestion.id)[0] as string) || ''} />
                  )}
                </div>
              )}
              {currentQuestion.type !== 'text' && currentQuestion.type !== 'drag' && currentQuestion.type !== 'composite' && Array.isArray(currentQuestion.options) && (
                <>
                  {currentQuestion.options.map((option, index) => {
                    const optionImage = currentQuestion.optionImages && currentQuestion.optionImages[option];
                    const selected = getCurrentAnswer(currentQuestion.id);
                    const shouldReveal = isChoiceReveal(currentQuestion, selected);
                    const isCorrect = getCorrectAnswers(currentQuestion).includes(option);
                    const isChosen = selected.includes(option);
                    const locked = uiMode === 'instant' && revealed.has(currentQuestion.id);
                    const base = 'w-full p-3 sm:p-4 text-left rounded-lg transition-all duration-200 border text-sm sm:text-base disabled:cursor-not-allowed';
                    const chosenStyle = 'bg-primary-100 text-primary-900 border-primary-600 shadow-md shadow-primary-500/20 dark:bg-primary-900/50 dark:text-primary-100 dark:border-primary-400 dark:shadow-lg dark:shadow-primary-500/25';
                    const normalStyle = 'bg-white text-gray-800 border-gray-400 hover:border-gray-500 hover:bg-stone-100 hover:shadow-md hover:shadow-gray-400/15 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 dark:hover:shadow-md dark:hover:shadow-gray-400/20';
                    const correctStyle = 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20 dark:bg-green-900/40 dark:text-green-100 dark:border-green-500';
                    const wrongChosenStyle = 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-500';

                    const cls = shouldReveal
                      ? (isCorrect ? correctStyle : (isChosen ? wrongChosenStyle : normalStyle))
                      : (isChosen ? chosenStyle : normalStyle);

                    return (
                      <button
                        key={index}
                        disabled={locked}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                        className={`${base} ${cls}`}
                      >
                        <div className="flex flex-col items-start gap-2 w-full">
                          <span className="flex items-center gap-2">
                            {shouldReveal && isCorrect && (
                              <svg className="w-4 h-4 text-current dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {shouldReveal && isChosen && !isCorrect && (
                              <svg className="w-4 h-4 text-current dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span>{String.fromCharCode(65 + index)}. {option}</span>
                          </span>
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
                  })}
                </>
              )}
              {currentQuestion.type === 'drag' && (
                <DragDropQuestion 
                  key={currentQuestion.id}
                  question={currentQuestion}
                  value={(userAnswers.find(a => a.questionId === currentQuestion.id)?.answers?.[0] as any) || {}}
                  onChange={(mapping) => {
                    setUserAnswers(prev => {
                      const existing = prev.find(a => a.questionId === currentQuestion.id);
                      if (!existing) return [...prev, { questionId: currentQuestion.id, answers: [mapping as any] }];
                      return prev.map(a => a.questionId === currentQuestion.id ? { ...a, answers: [mapping as any] } : a);
                    });
                  }}
                  reveal={isRevealed(currentQuestion.id)}
                  correctMapping={(currentQuestion.correctAnswers as any) || {}}
                />
              )}
              {currentQuestion.type === 'composite' && Array.isArray((currentQuestion as any).subQuestions) && (
                <div className="space-y-4">
                  {(currentQuestion as any).subQuestions.map((sub: Question, idx: number) => {
                    const parentRevealed = isRevealed(currentQuestion.id);
                    return (
                    <div key={sub.id} className="border border-gray-400 rounded-lg p-4 bg-gray-200/40 dark:border-gray-600 dark:bg-gray-900/30 transition-colors duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Câu hỏi con {idx + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {sub.type === 'text' ? 'Tự luận' : sub.type === 'single' ? 'Chọn 1' : 'Chọn nhiều'}
                        </span>
                      </div>
                      <div className="font-medium mb-3 text-gray-900 dark:text-gray-100">{sub.question}</div>
                      {sub.type === 'text' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            disabled={parentRevealed}
                            className={`w-full p-3 rounded-lg bg-white text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white border ${
                              parentRevealed
                                ? (isTextAnswerCorrect(sub, (getCurrentAnswer(sub.id)[0] as string) || '')
                                    ? 'border-green-600 bg-green-500 text-white dark:bg-green-900/40 dark:text-green-100 dark:border-green-500'
                                    : 'border-rose-600 bg-rose-500 text-white dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-500')
                                : 'border-gray-400'
                            }`}
                            placeholder="Nhập câu trả lời của bạn"
                            value={(getCurrentAnswer(sub.id)[0] || '') as string}
                            onChange={(e) => handleAnswerSelect(sub.id, e.target.value, 'text')}
                          />
                          {uiMode === 'instant' && parentRevealed && (
                            <TextRevealPanel question={sub} userValue={(getCurrentAnswer(sub.id)[0] as string) || ''} />
                          )}
                        </div>
                      )}
                      {sub.type !== 'text' && sub.type !== 'drag' && Array.isArray(sub.options) && (
                        <div className="space-y-2">
                          {sub.options.map((opt, oidx) => {
                            const selected = getCurrentAnswer(sub.id);
                            const shouldReveal = isChoiceReveal(sub, selected, parentRevealed);
                            const isCorrect = (Array.isArray(sub.correctAnswers) ? sub.correctAnswers as string[] : []).includes(opt);
                            const isChosen = selected.includes(opt);
                            const base = 'w-full p-3 text-left rounded-lg border transition-all duration-200 disabled:cursor-not-allowed';
                            const chosenStyle = 'bg-primary-100 border-primary-600 text-primary-900 shadow-sm dark:bg-primary-900/50 dark:border-primary-400 dark:text-primary-100';
                            const normalStyle = 'bg-white border-gray-400 text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700';
                            const correctStyle = 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20 dark:bg-green-900/40 dark:text-green-100 dark:border-green-500';
                            const wrongChosenStyle = 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-500';
                            const cls = shouldReveal ? (isCorrect ? correctStyle : (isChosen ? wrongChosenStyle : normalStyle)) : (isChosen ? chosenStyle : normalStyle);
                            return (
                              <button
                                key={oidx}
                                disabled={parentRevealed}
                                onClick={() => handleAnswerSelect(sub.id, opt, sub.type as 'single' | 'multiple')}
                                className={`${base} ${cls}`}
                              >
                                <div className="text-left w-full flex items-center gap-2">
                                  {shouldReveal && isCorrect && (
                                    <svg className="w-4 h-4 text-current dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {shouldReveal && isChosen && !isCorrect && (
                                    <svg className="w-4 h-4 text-current dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                  <span className="font-medium">{String.fromCharCode(65 + oidx)}.</span> {opt}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {sub.type === 'drag' && (
                        <DragDropQuestion 
                          key={sub.id}
                          question={sub}
                          value={(userAnswers.find(a => a.questionId === sub.id)?.answers?.[0] as any) || {}}
                          onChange={(mapping) => {
                            setUserAnswers(prev => {
                              const existing = prev.find(a => a.questionId === sub.id);
                              if (!existing) return [...prev, { questionId: sub.id, answers: [mapping as any] }];
                              return prev.map(a => a.questionId === sub.id ? { ...a, answers: [mapping as any] } : a);
                            });
                          }}
                          reveal={parentRevealed}
                          correctMapping={(sub.correctAnswers as any) || {}}
                        />
                      )}
                    </div>
                    );
                  })}
                  {/* Nút Xác nhận cho Composite trong chế độ xem ngay */}
                  {uiMode === 'instant' && (
                    <div className="pt-2">
                      <button
                        onClick={() => markRevealed(currentQuestion.id)}
                        disabled={isRevealed(currentQuestion.id)}
                        className="btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Xác nhận
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-row items-stretch mt-4 sm:mt-6 gap-3 w-full">
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

            {/* Nút Xác nhận cho multiple/text/drag/composite ở chế độ instant */}
            {uiMode === 'instant' && (currentQuestion.type === 'multiple' || currentQuestion.type === 'text' || currentQuestion.type === 'drag' || currentQuestion.type === 'composite') && (
              <button
                onClick={() => markRevealed(currentQuestion.id)}
                disabled={isRevealed(currentQuestion.id)}
                className="flex-1 btn-primary text-base sm:text-lg px-4 py-2 sm:px-5 sm:py-2 min-w-[110px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Xác nhận
              </button>
            )}

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
        <div className="w-full lg:w-80 lg:flex-shrink-0 order-1 lg:order-2">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Danh sách câu hỏi
              </h3>
              {/* Nút chuyển đổi chế độ cho màn hình < 1024px */}
              <button
                onClick={() => setUiMode(prev => prev === 'default' ? 'instant' : 'default')}
                className="block lg:hidden ml-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-colors duration-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Chuyển đổi định dạng"
              >
                <span className="hidden sm:inline">Chuyển đổi</span>
                <span className="sm:hidden">Đổi</span>
                <span className={`ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${uiMode === 'instant' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>{uiMode === 'instant' ? 'Xem ngay' : 'Mặc định'}</span>
              </button>
            </div>
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
                        : isQuestionAnswered(question)
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
            Tiến độ làm bài: {questions.filter(q => isQuestionAnswered(q)).length}/{questions.length} câu
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round((questions.filter(q => isQuestionAnswered(q)).length / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(questions.filter(q => isQuestionAnswered(q)).length / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>
      {/* Floating switch mode button for >=1024px - chỉ render khi viewport >= 1024px */}
      {isLarge && (
        <button
          onClick={() => setUiMode(prev => prev === 'default' ? 'instant' : 'default')}
          className="hidden lg:flex fixed bottom-6 right-6 z-40 items-center gap-2 px-4 py-2 rounded-full shadow-lg border transition-all duration-200 bg-white/90 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-800"
          title="Chuyển đổi định dạng"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5 9a7 7 0 0014 0M19 15a7 7 0 00-14 0" />
          </svg>
          <span className="font-medium text-sm">{uiMode === 'instant' ? 'Định dạng: Xem ngay' : 'Định dạng: Mặc định'}</span>
        </button>
      )}

      {/* Mode chooser dialog */}
      {showModeChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chọn định dạng làm bài</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Bạn có thể thay đổi lại bất cứ lúc nào.</p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => { setUiMode('default'); setShowModeChooser(false); }}
                className="rounded-lg border border-gray-300 dark:border-gray-600 p-4 text-left hover:border-blue-500 hover:shadow-sm transition-colors duration-200 bg-white dark:bg-gray-800"
              >
                <div className="font-semibold text-gray-900 dark:text-gray-100">Định dạng mặc định</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Làm bài bình thường và xem kết quả sau khi nộp.</div>
              </button>
              <button
                onClick={() => { setUiMode('instant'); setShowModeChooser(false); }}
                className="rounded-lg border border-gray-300 dark:border-gray-600 p-4 text-left hover:border-emerald-500 hover:shadow-sm transition-colors duration-200 bg-white dark:bg-gray-800"
              >
                <div className="font-semibold text-gray-900 dark:text-gray-100">Xem đáp án ngay</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Chọn là biết đúng/sai ngay; điền/kéo thả có nút Xác nhận.</div>
              </button>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-right">
              <button onClick={() => setShowModeChooser(false)} className="btn-secondary px-4 py-2 text-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TextRevealPanel: React.FC<{ question: Question; userValue: string }> = ({ question, userValue }) => {
  const ca = Array.isArray(question.correctAnswers) ? (question.correctAnswers as string[]) : [];
  const norm = (s: string) => (s || '').trim();
  const isOk = ca.some(ans => norm(ans).toLowerCase() === norm(userValue).toLowerCase());
  return (
    <div className={`mt-2 rounded-lg border p-3 text-sm transition-colors ${isOk ? 'border-green-500 bg-green-50/60 text-green-800 dark:border-green-400 dark:bg-green-900/20 dark:text-green-200' : 'border-rose-500 bg-rose-50/60 text-rose-800 dark:border-rose-400 dark:bg-rose-900/20 dark:text-rose-200'}`}>
      {isOk ? 'Chính xác!' : 'Chưa chính xác.'}
      <div className="mt-1">
        <span className="opacity-80">Đáp án của bạn:</span> <span className="font-medium">{userValue || '(trống)'}</span>
      </div>
      <div className="mt-1">
        <span className="opacity-80">Đáp án đúng:</span> <span className="font-medium">{ca.join(' | ') || '(chưa cấu hình)'}</span>
      </div>
    </div>
  );
};

// Drag & Drop component for 'drag' question type
const DragDropQuestion: React.FC<{ question: Question; value: Record<string, string>; onChange: (mapping: Record<string, string>) => void; reveal?: boolean; correctMapping?: Record<string, string> }> = ({ question, value, onChange, reveal = false, correctMapping = {} }) => {
  const targets = (question.options && (question.options as any).targets) as DragTarget[] || [];
  const items = (question.options && (question.options as any).items) as DragItem[] || [];

  const [mapping, setMapping] = useState<Record<string, string>>(() => ({ ...(value || {}) }));
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Sync up to parent whenever local mapping changes
  useEffect(() => { onChange(mapping); }, [mapping]);

  // Reset local mapping when switching to a different question (avoid carrying over state)
  useEffect(() => {
    setMapping({ ...(value || {}) });
  }, [question.id]);

  const poolItems = items.filter(it => !mapping[it.id]);
  const itemsByTarget: Record<string, DragItem[]> = {};
  for (const t of targets) itemsByTarget[t.id] = [];
  for (const it of items) {
    const tid = mapping[it.id];
    if (tid && itemsByTarget[tid]) itemsByTarget[tid].push(it);
  }

  const assign = (itemId: string, targetId?: string) => {
    if (reveal) return; // khoá sau khi reveal
    setMapping(prev => {
      const next = { ...prev } as any;
      if (!targetId) delete next[itemId]; else next[itemId] = targetId;
      return next;
    });
  };

  const isItemCorrect = (it: DragItem) => {
    if (!reveal) return undefined;
    const cur = mapping[it.id];
    const ok = correctMapping && correctMapping[it.id] && cur === correctMapping[it.id];
    return ok ? true : (cur ? false : undefined);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (reveal) { e.preventDefault(); return; }
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    if (reveal) return;
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId || 'pool');
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    if (reveal) return;
    if (draggedItem) {
      assign(draggedItem, targetId);
    }
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Kho đáp án */}
      <div 
        className={`border border-gray-400 rounded-lg p-4 bg-gray-200/40 dark:border-gray-600 dark:bg-gray-900/30 transition-all duration-200 ${
          dragOverTarget === 'pool' ? 'ring-2 ring-yellow-500 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''
        }`}
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">Kho đáp án</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {poolItems.map(it => (
            <button 
              key={it.id}
              draggable={!reveal}
              onDragStart={(e) => handleDragStart(e, it.id)}
              onDragEnd={handleDragEnd}
              className={`p-3 rounded-lg font-medium border-2 text-left transition-all duration-200 ${reveal ? 'cursor-default' : 'cursor-move'} ${
                draggedItem === it.id ? 'opacity-50 scale-95' : ''
              } ${reveal && correctMapping[it.id] ? 'bg-rose-500 border-rose-600 text-white dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-500' : 'bg-yellow-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20 hover:bg-yellow-600 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border dark:border-yellow-500 dark:shadow-md dark:shadow-yellow-500/20 dark:hover:bg-yellow-900/30'}`}
              onClick={() => assign(it.id, undefined)}
              disabled={reveal}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
                {it.label}
              </span>
            </button>
          ))}
          {poolItems.length === 0 && (
            <div className="col-span-full text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              Tất cả đáp án đã được phân loại
            </div>
          )}
        </div>
      </div>

      {/* Các nhóm/ô đích */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targets.map(t => (
          <div 
            key={t.id} 
            className={`border border-gray-400 rounded-lg p-4 bg-gray-200/40 dark:border-gray-600 dark:bg-gray-900/30 transition-all duration-200 ${
              dragOverTarget === t.id ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, t.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, t.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t.label}</h3>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                {(itemsByTarget[t.id] || []).length} đáp án
              </span>
            </div>
            
            {/* Dropdown chọn đáp án */}
            {poolItems.length > 0 && (
              <div className="mb-3">
                <select
                  disabled={reveal}
                  className="w-full p-2.5 border border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value=""
                  onChange={(e) => {
                    const itemId = e.target.value;
                    if (itemId) assign(itemId, t.id);
                  }}
                >
                  <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">-- Chọn đáp án --</option>
                  {poolItems.map(it => (
                    <option key={it.id} value={it.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">{it.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Đáp án đã chọn */}
            <div className="space-y-2 min-h-[60px]">
              {(itemsByTarget[t.id] || []).map(it => {
                const state = isItemCorrect(it);
                const base = 'w-full p-3 rounded-lg font-medium border-2 text-left transition-all duration-200';
                const normal = 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20 hover:bg-primary-600 dark:bg-primary-900/50 dark:text-primary-100 dark:border dark:border-primary-400 dark:shadow-lg dark:shadow-primary-500/25 dark:hover:bg-primary-900/60';
                const ok = 'bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20 dark:bg-green-900/40 dark:text-green-100 dark:border-green-500';
                const bad = 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-500';
                return (
                  <button 
                    key={it.id}
                    draggable={!reveal}
                    onDragStart={(e) => handleDragStart(e, it.id)}
                    onDragEnd={handleDragEnd}
                    className={`${base} ${reveal ? 'cursor-default' : 'cursor-move'} ${draggedItem === it.id ? 'opacity-50 scale-95' : ''} ${state === undefined ? normal : state ? ok : bad}`}
                    onClick={() => assign(it.id, undefined)}
                    disabled={reveal}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      {it.label}
                    </span>
                  </button>
                );
              })}
              {(itemsByTarget[t.id] || []).length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  Chưa có đáp án
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hướng dẫn */}
      <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
        <p><strong>Hướng dẫn:</strong> Kéo thả đáp án từ kho vào nhóm tương ứng, hoặc chọn từ dropdown. Nhấn vào đáp án đã chọn để đưa về kho.</p>
        {reveal && (
          <div className="mt-2 rounded-lg border p-3 transition-colors text-sm text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600">
            <div className="font-medium mb-1">Đáp án đúng:</div>
            <ul className="list-disc list-inside space-y-0.5">
              {items.map(it => (
                <li key={it.id}>
                  <span className="opacity-80">{it.label}</span> → <span className="font-medium">{targets.find(t => t.id === (correctMapping as any)[it.id])?.label || '(chưa cấu hình)'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
