import { Question } from '../types';
import { parseWordFile, validateWordFormat } from './wordParser';

export interface ParsedQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'drag' | 'composite';
  options?: string[] | { targets: any[]; items: any[] };
  correctAnswers: string[] | Record<string, string>;
  explanation?: string;
  subQuestions?: ParsedQuestion[]; // Hỗ trợ câu hỏi mẹ
}

export interface ParseResult {
  success: boolean;
  questions?: ParsedQuestion[];
  error?: string;
}

export async function parseFile(file: File): Promise<ParseResult> {
  try {
    let content: string;
    
    // Xử lý file Word
    if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
      const wordResult = await parseWordFile(file);
      if (!wordResult.success) {
        return {
          success: false,
          error: wordResult.error || 'Không thể đọc file Word'
        };
      }
      content = wordResult.content!;
    } else {
      // Xử lý file text
      content = await file.text();
    }
    
    // Validate format
    const validation = validateDocsFormat(content);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join('\n')
      };
    }
    
    // Parse questions
    const questions = parseDocsContent(content);
    
    return {
      success: true,
      questions
    };
    
  } catch (error) {
    console.error('Error parsing file:', error);
    return {
      success: false,
      error: `Lỗi khi xử lý file: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
    };
  }
}

export function parseDocsContent(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentQuestion: Partial<ParsedQuestion> = {};
  let currentOptions: string[] = [];
  let currentCorrectAnswers: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Tìm ID của câu hỏi
    if (line.startsWith('ID:')) {
      // Lưu câu hỏi trước đó nếu có
      if (currentQuestion.question && currentQuestion.question.length > 0) {
        const questionType = determineQuestionType(currentCorrectAnswers);
        questions.push({
          id: currentQuestion.id || `q-${Date.now()}-${Math.random()}`,
          question: currentQuestion.question,
          type: questionType,
          options: questionType !== 'text' ? currentOptions : undefined,
          correctAnswers: currentCorrectAnswers,
          explanation: currentQuestion.explanation
        });
      }
      
      // Bắt đầu câu hỏi mới
      const idMatch = line.match(/ID:\s*(\d+)/);
      currentQuestion = {
        id: idMatch ? idMatch[1] : `q-${Date.now()}-${Math.random()}`
      };
      currentOptions = [];
      currentCorrectAnswers = [];
      continue;
    }
    
    // Tìm câu hỏi
    if (line.startsWith('Câu') && line.includes(':')) {
      const questionMatch = line.match(/Câu\s+\d+:\s*(.+)/);
      if (questionMatch) {
        currentQuestion.question = questionMatch[1].trim();
      }
      continue;
    }
    
    // Tìm các đáp án - cải thiện regex để xử lý tốt hơn
    if (line.match(/^[*]?[A-E]\.\s+/)) {
      const optionMatch = line.match(/^[*]?([A-E])\.\s*(.+)/);
      if (optionMatch) {
        const optionLetter = optionMatch[1];
        const optionText = optionMatch[2].trim();
        const isCorrect = line.startsWith('*');
        
        // Kiểm tra xem có dấu * không
        if (isCorrect) {
          currentOptions.push(optionText);
          currentCorrectAnswers.push(optionText);
        } else {
          currentOptions.push(optionText);
        }
      }
    }
  }
  
  // Thêm câu hỏi cuối cùng
  if (currentQuestion.question && currentQuestion.question.length > 0) {
    const questionType = determineQuestionType(currentCorrectAnswers);
    
    questions.push({
      id: currentQuestion.id || `q-${Date.now()}-${Math.random()}`,
      question: currentQuestion.question,
      type: questionType,
      options: questionType !== 'text' ? currentOptions : undefined,
      correctAnswers: currentCorrectAnswers,
      explanation: currentQuestion.explanation
    });
  }
  
  return questions;
}

function determineQuestionType(correctAnswers: string[]): 'single' | 'multiple' | 'text' {
  if (correctAnswers.length === 0) {
    return 'text'; // Câu hỏi điền đáp án
  } else if (correctAnswers.length === 1) {
    return 'single'; // Câu hỏi chọn 1 đáp án
  } else {
    return 'multiple'; // Câu hỏi chọn nhiều đáp án
  }
}

export function validateDocsFormat(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let hasQuestions = false;
  let currentQuestionId = '';
  let hasValidQuestion = false;
  let questionCount = 0;
  let totalLines = lines.length;
  let hasIdFormat = false;
  let hasQuestionFormat = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('ID:')) {
      hasIdFormat = true;
      const idMatch = line.match(/ID:\s*(\d+)/);
      if (!idMatch) {
        errors.push(`Dòng ${i + 1}: Định dạng ID không hợp lệ - "${line}"`);
      } else {
        currentQuestionId = idMatch[1];
        hasQuestions = true;
      }
    } else if (line.startsWith('Câu') && line.includes(':')) {
      hasQuestionFormat = true;
      if (!currentQuestionId) {
        errors.push(`Dòng ${i + 1}: Thiếu ID cho câu hỏi - "${line}"`);
      } else {
        hasValidQuestion = true;
        questionCount++;
      }
    } else if (line.match(/^[*]?[A-E]\.\s+/)) {
      if (!currentQuestionId) {
        errors.push(`Dòng ${i + 1}: Thiếu ID cho đáp án - "${line}"`);
      }
    }
  }
  
  // Thông báo lỗi chi tiết với hướng dẫn
  if (!hasIdFormat && !hasQuestionFormat) {
    errors.push(`File không có định dạng hợp lệ. Vui lòng sử dụng định dạng sau:

ID: 1
Câu 1: Câu hỏi của bạn ở đây?
A. Đáp án A
B. Đáp án B
*C. Đáp án đúng (có dấu *)
D. Đáp án D

ID: 2
Câu 2: Câu hỏi tiếp theo?
*A. Đáp án đúng
B. Đáp án sai
C. Đáp án sai

Lưu ý: 
- File Word (.docx) hiện đã được hỗ trợ
- Sử dụng font đơn giản (Times New Roman, Arial)
- Không sử dụng bullet points, chỉ dùng A. B. C. D.
- Không sử dụng màu sắc hoặc định dạng phức tạp
- Đánh dấu đáp án đúng bằng dấu *`);
  } else if (!hasQuestions) {
    errors.push(`Không tìm thấy câu hỏi nào trong file (thiếu định dạng ID:). File có ${totalLines} dòng.`);
  } else if (!hasValidQuestion) {
    errors.push(`Không tìm thấy câu hỏi hợp lệ trong file (thiếu định dạng Câu X:). File có ${totalLines} dòng.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 