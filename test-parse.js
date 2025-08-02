// Test parse toàn bộ file template
const fs = require('fs');

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
          correctAnswers: currentCorrectAnswers
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
    
    // Tìm các đáp án
    if (line.match(/^[*]?[A-E]\.\s+/)) {
      const optionMatch = line.match(/^[*]?([A-E])\.\s*(.+)/);
      if (optionMatch) {
        const optionLetter = optionMatch[1];
        const optionText = optionMatch[2].trim();
        const isCorrect = line.startsWith('*');
        
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
      correctAnswers: currentCorrectAnswers
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

// Test với toàn bộ file template
try {
  const content = fs.readFileSync('template-docs.txt', 'utf8');
  console.log('=== TEST PARSE TEMPLATE ===');
  console.log('Nội dung file:');
  console.log(content);
  console.log('\n=== KẾT QUẢ PARSE ===');
  
  const questions = parseDocsContent(content);
  questions.forEach((q, index) => {
    console.log(`\nCâu hỏi ${index + 1}:`);
    console.log(`ID: ${q.id}`);
    console.log(`Câu hỏi: ${q.question}`);
    console.log(`Loại: ${q.type}`);
    console.log(`Số options: ${q.options?.length || 0}`);
    console.log(`Số correct answers: ${q.correctAnswers.length}`);
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