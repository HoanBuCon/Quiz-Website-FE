import React from 'react';
import { Question } from '../types';

interface QuizPreviewProps {
  questions: Question[];
  quizTitle?: string;
  onEdit?: (content: string) => void;
  isEditable?: boolean;
}

const QuizPreview: React.FC<QuizPreviewProps> = ({ 
  questions, 
  quizTitle = "Preview Quiz",
  onEdit,
  isEditable = false
}) => {
  // Chuyển đổi questions thành format text để hiển thị
  const generatePreviewText = () => {
    let content = '';
    
    questions.forEach((q, index) => {
      content += `ID: ${q.id}\n`;
      content += `Câu ${index + 1}: ${q.question}\n`;
      
      if (q.type === 'text') {
        // Câu hỏi điền đáp án - không có đáp án hiển thị
        content += `(Câu hỏi không có đáp án thì website sẽ tự hiểu đó là câu hỏi "Điền đáp án đúng". Lúc này đáp án đúng cần được giáo viên nhập thủ công trong giao diện tạo / chỉnh sửa quiz trước khi xuất bản.)\n`;
      } else {
        // Câu hỏi trắc nghiệm
        q.options?.forEach((option, optIndex) => {
          const isCorrect = q.correctAnswers.includes(option);
          const prefix = isCorrect ? '*' : '';
          const letter = String.fromCharCode(65 + optIndex); // A, B, C, D...
          content += `${prefix}${letter}. ${option}\n`;
        });
      }
      
      if (index < questions.length - 1) {
        content += '\n';
      }
    });
    
    return content;
  };


  const [editableContent, setEditableContent] = React.useState(generatePreviewText());
  const [isContentChanged, setIsContentChanged] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Cập nhật nội dung khi questions thay đổi, chỉ khi textarea không focus
  React.useEffect(() => {
    if (document.activeElement !== textareaRef.current) {
      const newContent = generatePreviewText();
      setEditableContent(newContent);
      setIsContentChanged(false);
    }
  }, [questions]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditableContent(newContent);
    setIsContentChanged(true);
    
    // Debounce việc gọi callback để tránh update quá nhiều
    const timeoutId = setTimeout(() => {
      if (onEdit) {
        onEdit(newContent);
      }
      setIsContentChanged(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const parseEditedContent = (content: string) => {
    // Parse nội dung đã chỉnh sửa thành questions
    const lines = content.split('\n').filter(line => line.trim());
    const parsedQuestions: Question[] = [];
    
    let currentQuestion: Partial<Question> = {};
    let currentOptions: string[] = [];
    let currentCorrectAnswers: string[] = [];
    let isTextQuestion = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('ID:')) {
        // Lưu câu hỏi trước đó nếu có
        if (currentQuestion.question) {
          parsedQuestions.push({
            id: currentQuestion.id || `q-${Date.now()}-${Math.random()}`,
            question: currentQuestion.question,
            type: isTextQuestion ? 'text' : (currentCorrectAnswers.length > 1 ? 'multiple' : 'single'),
            options: isTextQuestion ? undefined : currentOptions,
            correctAnswers: currentCorrectAnswers,
            explanation: currentQuestion.explanation || ''
          } as Question);
        }
        
        // Reset cho câu hỏi mới
        currentQuestion = { id: line.replace('ID:', '').trim() };
        currentOptions = [];
        currentCorrectAnswers = [];
        isTextQuestion = false;
      } else if (line.match(/^Câu \d+:/)) {
        currentQuestion.question = line.replace(/^Câu \d+:\s*/, '');
      } else if (line.includes('Câu hỏi không có đáp án') || line.includes('Điền đáp án đúng')) {
        // Đây là câu hỏi text
        isTextQuestion = true;
      } else if (line.match(/^\*?[A-Z]\./)) {
        // Đây là đáp án
        const isCorrect = line.startsWith('*');
        const optionText = line.replace(/^\*?[A-Z]\.\s*/, '');
        currentOptions.push(optionText);
        
        if (isCorrect) {
          currentCorrectAnswers.push(optionText);
        }
      }
    }
    
    // Thêm câu hỏi cuối cùng
    if (currentQuestion.question) {
      parsedQuestions.push({
        id: currentQuestion.id || `q-${Date.now()}-${Math.random()}`,
        question: currentQuestion.question,
        type: isTextQuestion ? 'text' : (currentCorrectAnswers.length > 1 ? 'multiple' : 'single'),
        options: isTextQuestion ? undefined : currentOptions,
        correctAnswers: currentCorrectAnswers,
        explanation: currentQuestion.explanation || ''
      } as Question);
    }
    
    return parsedQuestions;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Xem trước định dạng
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isEditable ? 'Chỉnh sửa trực tiếp định dạng File' : 'Định dạng xuất ra File'}
            </p>
          </div>
          {isContentChanged && (
            <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
              <svg className="w-4 h-4 mr-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Đang cập nhật...
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {isEditable ? (
          <textarea
            ref={textareaRef}
            value={editableContent}
            onChange={handleContentChange}
            className="w-full h-full min-h-[600px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white font-mono text-sm resize-none custom-scrollbar"
            placeholder="Chỉnh sửa nội dung file..."
          />
        ) : (
          <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words custom-scrollbar overflow-auto">
            {editableContent}
          </pre>
        )}
      </div>

      {/* Footer với hướng dẫn */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <div><strong className="text-gray-800 dark:text-gray-200">Hướng dẫn chỉnh sửa trực tiếp:</strong></div>
          <div>• Thay đổi <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded">*A</code> thành <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded">*B</code> để chuyển đáp án đúng từ A sang B</div>
          <div>• Thêm <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded">*</code> trước đáp án để đánh dấu là đáp án đúng</div>
          <div>• Nhiều <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded">*</code> = câu hỏi chọn nhiều đáp án</div>
          <div>• Không có đáp án = câu hỏi điền đáp án</div>
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border-l-4 border-blue-400 dark:border-blue-500">
            <div className="text-blue-700 dark:text-blue-200">
              <strong>💡 Mẹo:</strong> Thay đổi ở đây sẽ tự động cập nhật cột bên trái!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPreview;
