import mammoth from 'mammoth';

export interface WordParseResult {
  success: boolean;
  content?: string;
  error?: string;
}

export async function parseWordFile(file: File): Promise<WordParseResult> {
  try {
    // Đọc file Word
    const arrayBuffer = await file.arrayBuffer();
    
    // Chuyển đổi Word sang HTML
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('Word parsing warnings:', result.messages);
    }
    
    // Lấy text thuần túy từ HTML
    const plainText = result.value;
    
    // Làm sạch text
    const cleanedText = cleanWordText(plainText);
    
    return {
      success: true,
      content: cleanedText
    };
    
  } catch (error) {
    console.error('Error parsing Word file:', error);
    return {
      success: false,
      error: `Không thể đọc file Word: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
    };
  }
}

function cleanWordText(text: string): string {
  // Loại bỏ các ký tự đặc biệt và định dạng không cần thiết
  return text
    // Loại bỏ các ký tự điều khiển
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Thay thế các ký tự bullet points bằng A. B. C. D.
    .replace(/^[•·▪▫◦‣⁃]\s*/gm, '')
    .replace(/^[1-9]\.\s*/gm, '')
    // Chuẩn hóa khoảng trắng trong dòng (không loại bỏ dòng trống)
    .replace(/[ \t]+/g, ' ')
    // Loại bỏ khoảng trắng ở đầu và cuối dòng
    .split('\n').map(line => line.trim()).join('\n')
    // Loại bỏ các dòng trống ở đầu và cuối file
    .trim();
}

export function validateWordFormat(content: string): { isValid: boolean; errors: string[] } {
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
    errors.push(`File Word không có định dạng hợp lệ. Vui lòng sử dụng định dạng sau:

ID: 1
Câu 1: Câu hỏi của bạn ở đây?
A. Đáp án A
B. Đáp án B
*C. Đáp án đúng (có dấu *)
D. Đáp án D

Lưu ý: 
- Sử dụng font đơn giản (Times New Roman, Arial)
- Không sử dụng bullet points, chỉ dùng A. B. C. D.
- Không sử dụng màu sắc hoặc định dạng phức tạp
- Đánh dấu đáp án đúng bằng dấu *`);
  } else if (!hasQuestions) {
    errors.push(`Không tìm thấy câu hỏi nào trong file Word (thiếu định dạng ID:). File có ${totalLines} dòng.`);
  } else if (!hasValidQuestion) {
    errors.push(`Không tìm thấy câu hỏi hợp lệ trong file Word (thiếu định dạng Câu X:). File có ${totalLines} dòng.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 