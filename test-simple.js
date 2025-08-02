// Test file đơn giản
const fs = require('fs');

function validateDocsFormat(content) {
  const errors = [];
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
  
  if (!hasIdFormat && !hasQuestionFormat) {
    errors.push(`File không có định dạng hợp lệ. Vui lòng sử dụng định dạng sau:
    
ID: 1
Câu 1: Câu hỏi của bạn ở đây?
A. Đáp án A
B. Đáp án B
*C. Đáp án đúng (có dấu *)
D. Đáp án D`);
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

// Test với file đơn giản
try {
  const content = fs.readFileSync('test-simple-docs.txt', 'utf8');
  console.log('=== TEST FILE ĐƠN GIẢN ===');
  console.log('Nội dung file:');
  console.log(content);
  console.log('\n=== VALIDATE FORMAT ===');
  
  const validation = validateDocsFormat(content);
  console.log('Kết quả validate:', validation);
  
  if (!validation.isValid) {
    console.log('\n=== LỖI CHI TIẾT ===');
    validation.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ File hợp lệ!');
  }
} catch (error) {
  console.error('Lỗi:', error);
} 