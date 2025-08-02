import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Question, Quiz } from '../types';
import { ParsedQuestion } from '../utils/docsParser';

interface LocationState {
  questions: ParsedQuestion[];
  fileName: string;
  fileId: string;
}

const EditQuizPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (state?.questions) {
      // Chuyển đổi ParsedQuestion thành Question
      const convertedQuestions: Question[] = state.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation
      }));
      setQuestions(convertedQuestions);
      setQuizTitle(`Quiz từ file ${state.fileName}`);
    }
  }, [state]);

  const handleQuestionEdit = (questionId: string) => {
    setIsEditing(questionId);
  };

  const handleQuestionSave = (questionId: string, updatedQuestion: Partial<Question>) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, ...updatedQuestion } : q
    ));
    setIsEditing(null);
  };

  const handleQuestionDelete = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}-${Math.random()}`,
      question: '',
      type: 'single',
      options: ['', '', '', ''],
      correctAnswers: [],
      explanation: ''
    };
    setQuestions(prev => [...prev, newQuestion]);
    setIsEditing(newQuestion.id);
  };

  const handlePublishQuiz = async () => {
    if (!quizTitle.trim()) {
      alert('Vui lòng nhập tiêu đề cho bài quiz');
      return;
    }

    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    setIsPublishing(true);

    // Giả lập API call để lưu quiz
    setTimeout(() => {
      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: quizTitle,
        description: quizDescription,
        questions: questions,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Lưu vào localStorage hoặc gửi lên server
      const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      existingQuizzes.push(newQuiz);
      localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));

      setIsPublishing(false);
      alert('Bài quiz đã được xuất bản thành công!');
      navigate('/classes'); // Chuyển về trang classes
    }, 2000);
  };

  const QuestionEditor: React.FC<{ question: Question; index: number }> = ({ question, index }) => {
    const [editedQuestion, setEditedQuestion] = useState<Question>(question);

    const handleSave = () => {
      handleQuestionSave(question.id, editedQuestion);
    };

    const handleCancel = () => {
      setEditedQuestion(question);
      setIsEditing(null);
    };

    const handleOptionChange = (index: number, value: string) => {
      const newOptions = [...(editedQuestion.options || [])];
      newOptions[index] = value;
      setEditedQuestion(prev => ({ ...prev, options: newOptions }));
    };

    const handleCorrectAnswerToggle = (option: string) => {
      const newCorrectAnswers = editedQuestion.correctAnswers.includes(option)
        ? editedQuestion.correctAnswers.filter(ans => ans !== option)
        : [...editedQuestion.correctAnswers, option];
      
      setEditedQuestion(prev => ({ ...prev, correctAnswers: newCorrectAnswers }));
    };

         return (
       <div className="card p-6 mb-4">
         <div className="mb-4">
           <div className="flex items-center mb-2">
             <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-3">
               Câu {index + 1}
             </span>
             <span className="text-xs text-gray-400 dark:text-gray-500">
               ID: {question.id}
             </span>
           </div>
         </div>
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
               Câu hỏi
             </label>
            <textarea
              value={editedQuestion.question}
              onChange={(e) => setEditedQuestion(prev => ({ ...prev, question: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại câu hỏi
            </label>
            <select
              value={editedQuestion.type}
              onChange={(e) => setEditedQuestion(prev => ({ 
                ...prev, 
                type: e.target.value as 'single' | 'multiple' | 'text',
                options: e.target.value === 'text' ? undefined : prev.options
              }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="single">Chọn 1 đáp án</option>
              <option value="multiple">Chọn nhiều đáp án</option>
              <option value="text">Điền đáp án</option>
            </select>
          </div>

          {editedQuestion.type !== 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Các đáp án
              </label>
              <div className="space-y-2">
                {(editedQuestion.options || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editedQuestion.correctAnswers.includes(option)}
                      onChange={() => handleCorrectAnswerToggle(option)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {editedQuestion.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Đáp án đúng
              </label>
              <input
                type="text"
                value={editedQuestion.correctAnswers[0] || ''}
                onChange={(e) => setEditedQuestion(prev => ({ 
                  ...prev, 
                  correctAnswers: [e.target.value] 
                }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Nhập đáp án đúng"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Giải thích (tùy chọn)
            </label>
            <textarea
              value={editedQuestion.explanation || ''}
              onChange={(e) => setEditedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={2}
              placeholder="Giải thích đáp án..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              Lưu
            </button>
            <button
              onClick={handleCancel}
              className="btn-secondary"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    );
  };

  const QuestionDisplay: React.FC<{ question: Question; index: number }> = ({ question, index }) => {
    return (
      <div className="card p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-3">
                Câu {index + 1}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ID: {question.id}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {question.question}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                {question.type === 'single' ? 'Chọn 1' : question.type === 'multiple' ? 'Chọn nhiều' : 'Điền đáp án'}
              </span>
              <span>
                {question.type === 'text' 
                  ? 'Điền đáp án' 
                  : `${question.options?.length || 0} đáp án`
                }
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleQuestionEdit(question.id)}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleQuestionDelete(question.id)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {question.type !== 'text' && question.options && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {question.type === 'single' 
                ? 'Chọn 1 đáp án đúng' 
                : 'Chọn nhiều đáp án đúng'
              }
            </div>
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  question.correctAnswers.includes(option)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <span className="font-medium text-gray-600 dark:text-gray-300 mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {option}
                </span>
                {question.correctAnswers.includes(option) && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                )}
              </div>
            ))}
          </div>
        )}

        {question.type === 'text' && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-600 dark:text-gray-300">Đáp án đúng: </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {question.correctAnswers[0] || 'Chưa có đáp án'}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Học sinh sẽ nhập đáp án vào ô text
            </p>
          </div>
        )}

        {question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Giải thích: </span>
            <span className="text-sm text-blue-700 dark:text-blue-300">{question.explanation}</span>
          </div>
        )}
      </div>
    );
  };

  if (!state?.questions) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Không có dữ liệu để chỉnh sửa
          </h1>
          <button
            onClick={() => navigate('/create-class')}
            className="btn-primary"
          >
            Quay lại trang tạo lớp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Chỉnh sửa bài quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kiểm tra và chỉnh sửa các câu hỏi từ file {state.fileName}
            </p>
          </div>
          <button
            onClick={handlePublishQuiz}
            disabled={isPublishing}
            className="btn-primary"
          >
            {isPublishing ? 'Đang xuất bản...' : 'Xuất bản bài quiz'}
          </button>
        </div>

        {/* Quiz Info */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Thông tin bài quiz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề bài quiz
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Nhập tiêu đề bài quiz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả (tùy chọn)
              </label>
              <input
                type="text"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Nhập mô tả bài quiz"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="mb-8">
                     <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
               Số lượng câu hỏi: {questions.length}
             </h2>
            <button
              onClick={handleAddQuestion}
              className="btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm câu hỏi
            </button>
          </div>

                     <div className="space-y-6">
             {questions.map((question, index) => (
               <div key={question.id}>
                 {isEditing === question.id ? (
                   <QuestionEditor question={question} index={index} />
                 ) : (
                   <QuestionDisplay question={question} index={index} />
                 )}
               </div>
             ))}
           </div>

          {questions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Chưa có câu hỏi nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Thêm câu hỏi đầu tiên để bắt đầu tạo bài quiz
              </p>
              <button
                onClick={handleAddQuestion}
                className="btn-primary"
              >
                Thêm câu hỏi đầu tiên
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditQuizPage; 