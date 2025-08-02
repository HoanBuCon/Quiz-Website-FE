// Test file có lỗi định dạng
const fs = require('fs');

function validateDocsFormat(content) {
  const errors = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let hasQuestions = false;
  let currentQuestionId = '';
  let hasValidQuestion = false;
  let questionCount = 0;
  let totalLines = lines.length;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('ID:')) {
      const idMatch = line.match(/ID:\s*(\d+)/);
      if (!idMatch) {
        errors.push(`Dòng ${i + 1}: Định dạng ID không hợp lệ - "${line}"`);
      } else {
        currentQuestionId = idMatch[1];
        hasQuestions = true;
      }
    } else if (line.startsWith('Câu') && line.includes(':')) {
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
  
  if (!hasQuestions) {
    errors.push(`Không tìm thấy câu hỏi nào trong file (thiếu định dạng ID:). File có ${totalLines} dòng.`);
  } else if (!hasValidQuestion) {
    errors.push(`Không tìm thấy câu hỏi hợp lệ trong file (thiếu định dạng Câu X:). File có ${totalLines} dòng.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Test với file có lỗi
try {
  const content = fs.readFileSync('test-error-docs.txt', 'utf8');
  console.log('=== TEST FILE CÓ LỖI ===');
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
  }
} catch (error) {
  console.error('Lỗi:', error);
} 