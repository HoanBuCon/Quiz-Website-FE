// Test docsParser.ts
const fs = require('fs');

// Mock function để test parse docs (copy từ docsParser.ts)
function parseDocsContent(content) {
  const questions = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentQuestion = {};
  let currentOptions = [];
  let currentCorrectAnswers = [];
  
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
    
    // Tìm các đáp án - sửa regex để xử lý cả dấu * và không có dấu *
    if (line.match(/^[*]?[A-E]\.\s+/)) {
      const optionMatch = line.match(/^[*]?([A-E])\.\s*(.+)/);
      if (optionMatch) {
        const optionLetter = optionMatch[1];
        const optionText = optionMatch[2].trim();
        const isCorrect = line.startsWith('*');
        
        // Debug: In ra để kiểm tra
        console.log(`DEBUG: Xử lý đáp án - Letter: ${optionLetter}, Text: "${optionText}", IsCorrect: ${isCorrect}`);
        
        // Kiểm tra xem có dấu * không
        if (isCorrect) {
          console.log(`DEBUG: Tìm thấy đáp án đúng - "${optionText}"`);
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

function determineQuestionType(correctAnswers) {
  if (correctAnswers.length === 0) {
    return 'text'; // Câu hỏi điền đáp án
  } else if (correctAnswers.length === 1) {
    return 'single'; // Câu hỏi chọn 1 đáp án
  } else {
    return 'multiple'; // Câu hỏi chọn nhiều đáp án
  }
}

function validateDocsFormat(content) {
  const errors = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let hasQuestions = false;
  let currentQuestionId = '';
  let hasValidQuestion = false;
  let questionCount = 0;
  
  console.log('DEBUG: Bắt đầu validate file với', lines.length, 'dòng');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`DEBUG: Dòng ${i + 1}: "${line}"`);
    
    if (line.startsWith('ID:')) {
      const idMatch = line.match(/ID:\s*(\d+)/);
      if (!idMatch) {
        errors.push(`Dòng ${i + 1}: Định dạng ID không hợp lệ - "${line}"`);
      } else {
        currentQuestionId = idMatch[1];
        hasQuestions = true;
        console.log(`DEBUG: Tìm thấy ID: ${currentQuestionId}`);
      }
    } else if (line.startsWith('Câu') && line.includes(':')) {
      if (!currentQuestionId) {
        errors.push(`Dòng ${i + 1}: Thiếu ID cho câu hỏi - "${line}"`);
      } else {
        hasValidQuestion = true;
        questionCount++;
        console.log(`DEBUG: Tìm thấy câu hỏi ${questionCount}: "${line}"`);
      }
    } else if (line.match(/^[*]?[A-E]\.\s+/)) {
      if (!currentQuestionId) {
        errors.push(`Dòng ${i + 1}: Thiếu ID cho đáp án - "${line}"`);
      } else {
        console.log(`DEBUG: Tìm thấy đáp án: "${line}"`);
      }
    }
  }
  
  console.log(`DEBUG: Tổng kết - Có ${questionCount} câu hỏi, ${hasQuestions ? 'có' : 'không có'} ID, ${hasValidQuestion ? 'có' : 'không có'} câu hỏi hợp lệ`);
  
  if (!hasQuestions) {
    errors.push('Không tìm thấy câu hỏi nào trong file (thiếu định dạng ID:)');
  } else if (!hasValidQuestion) {
    errors.push('Không tìm thấy câu hỏi hợp lệ trong file (thiếu định dạng Câu X:)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Test với file docs
try {
  const content = fs.readFileSync('test-docs.txt', 'utf8');
  console.log('=== TEST DOCS PARSER ===');
  console.log('Nội dung file:');
  console.log(content);
  console.log('\n=== VALIDATE FORMAT ===');
  
  const validation = validateDocsFormat(content);
  console.log('Kết quả validate:', validation);
  
  console.log('\n=== PARSE CONTENT ===');
  const questions = parseDocsContent(content);
  questions.forEach((q, index) => {
    console.log(`\nCâu hỏi ${index + 1}:`);
    console.log(`ID: ${q.id}`);
    console.log(`Câu hỏi: ${q.question}`);
    console.log(`Loại: ${q.type}`);
    if (q.options && q.options.length > 0) {
      console.log(`Các đáp án: ${q.options.join(', ')}`);
    }
    if (q.correctAnswers && q.correctAnswers.length > 0) {
      console.log(`Đáp án đúng: ${q.correctAnswers.join(', ')}`);
    } else {
      console.log(`Đáp án đúng: (Không có)`);
    }
  });
  
  console.log(`\nTổng số câu hỏi: ${questions.length}`);
} catch (error) {
  console.error('Lỗi:', error);
} 