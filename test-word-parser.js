// Test file để kiểm tra việc xử lý file Word
const mammoth = require('mammoth');
const fs = require('fs');

// Test content mô phỏng từ file Word
const testWordContent = `
ID: 1
Câu 1: Một trong những lợi ích chính của phần mềm mã nguồn mở so với phần mềm mã nguồn đóng là gì?
A. Mã nguồn mở thường có giao diện người dùng thân thiện hơn.
B. Mã nguồn mở luôn có hiệu suất cao hơn mã nguồn đóng.
*C. Mã nguồn mở có thể được tùy chỉnh theo nhu cầu cụ thể của người dùng.
D. Mã nguồn mở không bao giờ gặp lỗi hoặc lỗ hổng bảo mật.

ID: 2
Câu 2: Ai là người phát triển ngôn ngữ lập trình Python?
A. Dennis Ritchie
*B. Guido van Rossum
C. Bjarne Stroustrup
D. James Gosling
`;

function cleanWordText(text) {
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

// Test function
function testWordParsing() {
  console.log('=== Test Word Parser ===');
  
  // Test 1: Clean text
  console.log('\n1. Testing text cleaning:');
  const cleanedText = cleanWordText(testWordContent);
  console.log('Cleaned text length:', cleanedText.length);
  console.log('First 200 characters:', cleanedText.substring(0, 200));
  
  // Test 2: Parse questions
  console.log('\n2. Testing question parsing:');
  const questions = parseDocsContent(cleanedText);
  console.log('Number of questions parsed:', questions.length);
  
  questions.forEach((q, index) => {
    console.log(`\nQuestion ${index + 1}:`);
    console.log('ID:', q.id);
    console.log('Question:', q.question);
    console.log('Type:', q.type);
    console.log('Options:', q.options?.length || 0);
    console.log('Correct answers:', q.correctAnswers.length);
  });
  
  console.log('\n=== Test completed ===');
}

// Run test
testWordParsing(); 