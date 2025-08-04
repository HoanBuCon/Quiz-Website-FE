// Định nghĩa các types cho dự án Quiz Website

export interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text'; // Loại câu hỏi: chọn 1, chọn nhiều, điền đáp án
  options?: string[]; // Các lựa chọn cho câu hỏi trắc nghiệm
  correctAnswers: string[]; // Đáp án đúng (có thể nhiều đáp án)
  explanation?: string; // Giải thích đáp án
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassRoom {
  id: string;
  name: string;
  description?: string;
  quizIds?: string[]; // IDs của các quiz thuộc lớp học này (old format)
  quizzes?: Quiz[] | string[]; // Danh sách quiz hoặc IDs (new format, runtime only)
  isPublic?: boolean;
  students?: any[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserAnswer {
  questionId: string;
  answers: string[];
  isCorrect?: boolean;
}

export interface QuizSession {
  id: string;
  quizId: string;
  answers: UserAnswer[];
  score?: number;
  totalQuestions: number;
  completedAt?: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'docs' | 'json' | 'txt';
  size: number;
  uploadedAt: Date;
  content?: string;
  quizzes?: Quiz[];
} 