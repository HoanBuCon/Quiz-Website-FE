import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Question, Quiz } from '../types';
import { ParsedQuestion } from '../utils/docsParser';
import { toast } from 'react-toastify';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        const reorderedQuestions = arrayMove(items, oldIndex, newIndex);
        toast.success('Đã thay đổi thứ tự câu hỏi!');
        return reorderedQuestions;
      });
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // Validation: Phải có ít nhất 1 câu hỏi
      if (questions.length === 0) {
        alert('Vui lòng thêm ít nhất một câu hỏi trước khi xuất bản');
        return;
      }

      // Validation trước khi xuất bản
      const invalidQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        if (!q.question.trim()) {
          invalidQuestions.push(`Câu ${i + 1}: Chưa có nội dung câu hỏi`);
          continue;
        }
        
        if (q.type === 'text') {
          if (!q.correctAnswers[0]?.trim()) {
            invalidQuestions.push(`Câu ${i + 1}: Câu hỏi tự luận chưa có đáp án đúng`);
          }
        } else {
          const validOptions = q.options?.filter(opt => opt.trim()) || [];
          if (validOptions.length < 2) {
            invalidQuestions.push(`Câu ${i + 1}: Câu hỏi trắc nghiệm cần ít nhất 2 đáp án`);
          }
          
          const validCorrectAnswers = q.correctAnswers.filter(ans => validOptions.includes(ans));
          if (validCorrectAnswers.length === 0) {
            invalidQuestions.push(`Câu ${i + 1}: Chưa chọn đáp án đúng`);
          }
        }
      }
      
      if (invalidQuestions.length > 0) {
        alert(`Vui lòng sửa các lỗi sau:\n\n${invalidQuestions.join('\n')}`);
        return;
      }

      // Lưu quiz vào localStorage chỉ khi xuất bản
      const savedQuizzes = localStorage.getItem('quizzes') || '[]';
      const quizzes = JSON.parse(savedQuizzes);
      
      // Kiểm tra xem quiz đã tồn tại chưa - nếu chưa thì tạo mới
      const existingQuizIndex = quizzes.findIndex((q: Quiz) => q.id === state.fileId);
      
      // Tạo quiz mới với dữ liệu đã được cập nhật
      const newQuiz = {
        id: state.fileId,
        title: quizTitle || `Quiz từ file ${state.fileName}`,
        description: quizDescription || 'Bài trắc nghiệm từ tài liệu đã tải lên',
        questions: questions, // Sử dụng questions state hiện tại (đã được cập nhật)
        fileName: state.fileName,
        createdAt: existingQuizIndex >= 0 ? quizzes[existingQuizIndex].createdAt : new Date(),
        updatedAt: new Date(),
        published: true
      };
      
      if (existingQuizIndex >= 0) {
        // Cập nhật quiz có sẵn
        quizzes[existingQuizIndex] = newQuiz;
      } else {
        // Thêm quiz mới
        quizzes.push(newQuiz);
      }
      
      localStorage.setItem('quizzes', JSON.stringify(quizzes));
      
      // Tạo lớp học với quiz vừa được xuất bản
      const newClass = {
        id: `class-${Date.now()}-${Math.random()}`,
        name: quizTitle || `Lớp học ${state.fileName}`,
        description: quizDescription || 'Lớp học được tạo từ quiz',
        quizzes: [state.fileId], // Gắn quiz vào lớp
        students: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const savedClasses = localStorage.getItem('classes') || '[]';
      const classes = JSON.parse(savedClasses);
      classes.push(newClass);
      localStorage.setItem('classes', JSON.stringify(classes));
      
      console.log('Quiz saved with questions:', questions); // Debug log
      console.log('Class created with quiz:', state.fileId); // Debug log
      
      toast.success('Xuất bản thành công!');
      navigate('/classes');
    } catch (error) {
      console.error('Error publishing quiz:', error);
      toast.error('Có lỗi xảy ra khi xuất bản');
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    console.log('EditQuizPage: received state', state);
    
    if (!state) {
      console.log('No state provided, redirecting');
      toast.error('Không có thông tin quiz');
      navigate('/create');
      return;
    }

    // Kiểm tra xem có phải là manual quiz không (từ nút "Tạo bài trắc nghiệm")
    if (state.fileName === 'Quiz thủ công' && (!state.questions || state.questions.length === 0)) {
      console.log('Manual quiz - initializing empty questions');
      setQuestions([]);
      setQuizTitle('Quiz thủ công');
      setQuizDescription('Bài trắc nghiệm tạo thủ công');
      return;
    }

    // Với file upload - cần có câu hỏi
    if (!state?.questions || state.questions.length === 0) {
      console.log('No questions found, redirecting');
      toast.error('Không có câu hỏi nào được tải lên');
      navigate('/create');
      return;
    }

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
  }, [state]);

  const handleQuestionEdit = (questionId: string) => {
    setIsEditing(questionId);
  };

  const handleQuestionSave = (questionId: string, updatedQuestion: Partial<Question>) => {
    console.log('Saving question:', questionId, updatedQuestion); // Debug log
    
    setQuestions(prev => {
      const updated = prev.map(q => {
        if (q.id === questionId) {
          const result = { ...q, ...updatedQuestion };
          
          // Đảm bảo câu hỏi text không có options
          if (result.type === 'text') {
            result.options = undefined; // Xóa options cho câu hỏi text
            // Đảm bảo luôn có ít nhất 1 đáp án trống cho câu hỏi text
            if (!result.correctAnswers || result.correctAnswers.length === 0) {
              result.correctAnswers = [''];
            }
            // KHÔNG reset correctAnswers - giữ nguyên dữ liệu đã được truyền vào từ updatedQuestion
          } else {
            // Đối với câu hỏi trắc nghiệm, đảm bảo có options
            if (!result.options || result.options.length === 0) {
              result.options = ["", "", "", ""];
            }
          }
          
          console.log('Question after save:', result); // Debug log
          return result;
        }
        return q;
      });
      
      console.log('Updated questions array:', updated); // Debug log
      setIsEditing(null);
      return updated;
    });
  };
  
  const handleQuestionDelete = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}-${Math.random()}`,
      question: '',
      type: 'single',
      options: ['', ''], // Bắt đầu với 2 đáp án trống
      correctAnswers: [],
      explanation: ''
    };
    setQuestions(prev => [...prev, newQuestion]);
    setIsEditing(newQuestion.id);
  };

  // Component để wrap các câu hỏi với drag & drop
  const SortableQuestionItem: React.FC<{ question: Question; index: number }> = ({ question, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: question.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className="relative group">
        {/* Drag handle - hiển thị khi hover */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing z-10 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-sm transition-opacity"
          title="Kéo để sắp xếp lại"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        
        {/* Question content giữ nguyên kích thước */}
        <div className="hover:shadow-md transition-shadow duration-200">
          {isEditing === question.id ? (
            <QuestionEditor question={question} index={index} />
          ) : (
            <QuestionDisplay question={question} index={index} />
          )}
        </div>
      </div>
    );
  };

  const QuestionEditor: React.FC<{ question: Question; index: number }> = ({ question, index }) => {
    const [editedQuestion, setEditedQuestion] = useState<Question>(question);
    const savedOptionsRef = useRef<string[]>(question.options || ["", ""]);

    useEffect(() => {
      // Đảm bảo câu hỏi text luôn có ít nhất 1 đáp án trống
      if (question.type === 'text' && (!question.correctAnswers || question.correctAnswers.length === 0)) {
        setEditedQuestion({
          ...question,
          correctAnswers: [''] // Tạo 1 đáp án trống mặc định
        });
      } else {
        setEditedQuestion(question);
      }
      
      // Luôn đảm bảo có ít nhất 2 options để backup
      const optionsBackup = question.options || ["", ""];
      savedOptionsRef.current = optionsBackup.length >= 2 ? optionsBackup : ["", ""];
    }, [question.id]);

    const handleSave = () => {
      // Kiểm tra dữ liệu trước khi lưu
      if (!editedQuestion.question.trim()) {
        alert('Vui lòng nhập nội dung câu hỏi');
        return;
      }

      console.log('Edited question before save:', editedQuestion); // Debug log

      if (editedQuestion.type === 'text') {
        // Đối với câu hỏi text, đảm bảo có ít nhất một đáp án đúng
        const validAnswers = editedQuestion.correctAnswers.filter(answer => answer?.trim());
        if (validAnswers.length === 0) {
          alert('Vui lòng nhập ít nhất một đáp án đúng cho câu hỏi tự luận');
          return;
        }
        
        const updatedData = {
          ...editedQuestion,
          options: undefined, // Xóa options cho câu hỏi text
          correctAnswers: validAnswers // Chỉ lưu các đáp án có nội dung
        };
        
        console.log('Saving text question with data:', updatedData); // Debug log
        handleQuestionSave(question.id, updatedData);
      } else {
        // Đối với câu hỏi trắc nghiệm
        const filteredOptions = (editedQuestion.options || []).filter(opt => opt.trim() !== '');
        if (filteredOptions.length < 2) {
          alert('Câu hỏi trắc nghiệm cần ít nhất 2 đáp án');
          return;
        }
        
        const filteredCorrectAnswers = editedQuestion.correctAnswers.filter(ans => filteredOptions.includes(ans));
        if (filteredCorrectAnswers.length === 0) {
          alert('Vui lòng chọn ít nhất một đáp án đúng');
          return;
        }
        
        const updatedData = {
          ...editedQuestion,
          options: filteredOptions,
          correctAnswers: filteredCorrectAnswers
        };
        
        console.log('Saving multiple choice question with data:', updatedData); // Debug log
        handleQuestionSave(question.id, updatedData);
      }
    };

    const handleCancel = () => {
      setEditedQuestion(question);
      setIsEditing(null);
    };

    const handleOptionChange = (index: number, value: string) => {
      const newOptions = [...(editedQuestion.options || [])];
      newOptions[index] = value;
      setEditedQuestion(prev => ({ ...prev, options: newOptions }));
    
      // Cập nhật luôn vào ref để giữ lại khi chuyển kiểu
      savedOptionsRef.current = newOptions;
    };
    
    

    const handleTypeChange = (newType: 'single' | 'multiple' | 'text') => {
      setEditedQuestion(prev => {
        if (newType === 'text') {
          // Lưu options hiện tại vào ref trước khi ẩn
          savedOptionsRef.current = prev.options || savedOptionsRef.current;
          
          // Nếu có đáp án đúng từ trắc nghiệm, chuyển sang text
          const existingCorrectAnswer = prev.correctAnswers.length > 0 ? prev.correctAnswers[0] : '';
          
          return {
            ...prev,
            type: 'text',
            correctAnswers: existingCorrectAnswer ? [existingCorrectAnswer] : [''], // Đảm bảo luôn có ít nhất 1 đáp án trống
            options: undefined // Xóa options khi chuyển sang text
          };
        } else {
          // Khôi phục options từ ref hoặc từ chính question
          const optionsToRestore = prev.options || savedOptionsRef.current || ['', ''];
          // Đảm bảo có ít nhất 2 đáp án
          const finalOptions = optionsToRestore.length >= 2 ? optionsToRestore : ['', ''];
          
          return {
            ...prev,
            type: newType,
            options: finalOptions,
            correctAnswers: [] // Reset correctAnswers khi chuyển về trắc nghiệm
          };
        }
      });
    };
      

    const handleCorrectAnswerToggle = (option: string) => {
      setEditedQuestion(prev => {
        if (prev.type === 'single') {
          // Với câu hỏi chọn 1 → chỉ chọn 1 đáp án
          return {
            ...prev,
            correctAnswers: [option]
          };
        } else {
          // Với chọn nhiều → toggle như cũ
          const isSelected = prev.correctAnswers.includes(option);
          const newCorrectAnswers = isSelected
            ? prev.correctAnswers.filter(ans => ans !== option)
            : [...prev.correctAnswers, option];
          return {
            ...prev,
            correctAnswers: newCorrectAnswers
          };
        }
      });
    };
    
      return (
       <div className="card p-6 mb-4 relative">
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
              className="w-full p-3 border border-stone-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại câu hỏi
            </label>
            <select
              value={editedQuestion.type}
              onChange={(e) => handleTypeChange(e.target.value as 'single' | 'multiple' | 'text')}
              className="w-full p-3 border border-stone-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="single">Chọn 1 đáp án</option>
              <option value="multiple">Chọn nhiều đáp án</option>
              <option value="text">Điền đáp án</option>
            </select>
          </div>

          {editedQuestion.type !== 'text' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Các đáp án
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = [...(editedQuestion.options || []), ''];
                    setEditedQuestion(prev => ({ ...prev, options: newOptions }));
                    savedOptionsRef.current = newOptions;
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Thêm đáp án
                </button>
              </div>
              <div className="space-y-2">
                {(editedQuestion.options || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type={editedQuestion.type === 'single' ? 'radio' : 'checkbox'}
                      name={`correct-${editedQuestion.id}`} // group cho radio
                      checked={editedQuestion.correctAnswers.includes(option)}
                      onChange={() => handleCorrectAnswerToggle(option)}
                      disabled={!option.trim()}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 p-2 border border-stone-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                      placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                    />
                    {(editedQuestion.options || []).length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = (editedQuestion.options || []).filter((_, i) => i !== index);
                          // Cập nhật correctAnswers để loại bỏ đáp án đã xóa
                          const newCorrectAnswers = editedQuestion.correctAnswers.filter(ans => newOptions.includes(ans));
                          setEditedQuestion(prev => ({ 
                            ...prev, 
                            options: newOptions,
                            correctAnswers: newCorrectAnswers
                          }));
                          savedOptionsRef.current = newOptions;
                        }}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cần ít nhất 2 đáp án cho câu hỏi trắc nghiệm. Nhấn vào checkbox/radio để chọn đáp án đúng.
              </p>
            </div>
          )}

          {editedQuestion.type === 'text' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Đáp án đúng
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEditedQuestion(prev => ({
                      ...prev,
                      correctAnswers: [...prev.correctAnswers, '']
                    }));
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Thêm đáp án
                </button>
              </div>
              <div className="space-y-2">
                {editedQuestion.correctAnswers.map((answer, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => {
                        const newAnswers = [...editedQuestion.correctAnswers];
                        newAnswers[index] = e.target.value;
                        setEditedQuestion(prev => ({ 
                          ...prev, 
                          correctAnswers: newAnswers
                        }));
                      }}
                      className="flex-1 p-3 border border-stone-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                      placeholder={`Đáp án đúng ${index + 1}`}
                    />
                    {editedQuestion.correctAnswers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newAnswers = editedQuestion.correctAnswers.filter((_, i) => i !== index);
                          setEditedQuestion(prev => ({ 
                            ...prev, 
                            correctAnswers: newAnswers.length > 0 ? newAnswers : ['']
                          }));
                        }}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Có thể thêm nhiều đáp án đúng. Học sinh chỉ cần nhập một trong các đáp án này.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Giải thích (tùy chọn)
            </label>
            <textarea
              value={editedQuestion.explanation || ''}
              onChange={(e) => setEditedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              className="w-full p-3 border border-stone-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
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
      <div className="card p-6 mb-4 relative">
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
            <div className="mb-2">
              <span className="text-gray-600 dark:text-gray-300">Đáp án đúng: </span>
              {question.correctAnswers.filter(ans => ans?.trim()).length > 0 ? (
                <div className="mt-1">
                  {question.correctAnswers.filter(ans => ans?.trim()).map((answer, index) => (
                    <span 
                      key={index}
                      className="inline-block bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded text-sm mr-2 mb-1"
                    >
                      "{answer.trim()}"
                    </span>
                  ))}
                </div>
              ) : (
                <span className="font-medium text-red-600 dark:text-red-400">
                  Chưa có đáp án - Vui lòng chỉnh sửa để thêm đáp án
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Học sinh chỉ cần nhập một trong các đáp án trên (không phân biệt hoa thường)
            </p>
            {/* Debug info */}
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Debug Info (Click to expand)
              </summary>
              <pre className="text-xs text-gray-500 mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {JSON.stringify({
                  id: question.id,
                  type: question.type,
                  correctAnswers: question.correctAnswers,
                  validAnswersCount: question.correctAnswers.filter(ans => ans?.trim()).length,
                  hasOptions: !!question.options,
                  optionsLength: question.options?.length || 0
                }, null, 2)}
              </pre>
            </details>
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

  if (!state) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Không có dữ liệu để chỉnh sửa
          </h1>
          <button
            onClick={() => navigate('/create')}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Chỉnh sửa Quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kiểm tra và chỉnh sửa các câu hỏi từ file {state.fileName}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="btn-primary flex items-center"
            >
              {isPublishing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xuất bản...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Xuất bản Quiz
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Thông tin Quiz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề Quiz
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full p-3 border border-stone-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                placeholder="Nhập tiêu đề Quiz"
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
                className="w-full p-3 border border-stone-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                placeholder="Nhập mô tả Quiz"
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
            <div className="flex items-center gap-3">
              {questions.length > 1 && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Kéo thả để sắp xếp
                </div>
              )}
              <button
                onClick={handleAddQuestion}
                className="btn-secondary flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm câu hỏi
              </button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>          {questions.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Chưa có câu hỏi nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Thêm câu hỏi đầu tiên để bắt đầu tạo Quiz
              </p>
            </div>
          )}
        </div>
        
        {/* Nút xuất bản ở cuối trang */}
        {questions.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={handleAddQuestion}
                className="btn-secondary flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm câu hỏi
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="btn-primary flex items-center"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xuất bản...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Xuất bản Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditQuizPage; 