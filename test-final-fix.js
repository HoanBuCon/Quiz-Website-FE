// Test final fix cho text questions
// Chạy trong console browser để test

console.log('=== TESTING FINAL FIX ===');

// Clear old quizzes để test sạch
localStorage.removeItem('quizzes');

// Tạo một quiz với text questions
const testQuiz = {
  id: 'quiz-final-test-' + Date.now(),
  title: 'Final Test Quiz - Text Questions',
  description: 'Test cuối cùng cho text questions',
  questions: [
    {
      id: 'q1',
      question: 'Python được phát triển bởi ai?',
      type: 'text',
      correctAnswers: ['Guido van Rossum'], // Đáp án đúng
      explanation: 'Python được tạo ra bởi Guido van Rossum'
    },
    {
      id: 'q2',
      question: 'Framework Anaconda hỗ trợ cài đặt trực tiếp môi trường nào để phát triển Python?',
      type: 'text',
      correctAnswers: ['Jupyter Notebook'], // Đáp án đúng
      explanation: 'Anaconda hỗ trợ Jupyter Notebook'
    },
    {
      id: 'q3',
      question: 'IDE nào phổ biến nhất cho Python?',
      type: 'text',
      correctAnswers: ['PyCharm'], // Đáp án đúng
      explanation: 'PyCharm là IDE phổ biến cho Python'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  published: true
};

// Lưu quiz vào localStorage
const quizzes = [testQuiz];
localStorage.setItem('quizzes', JSON.stringify(quizzes));

console.log('✅ Test quiz đã được tạo với ID:', testQuiz.id);
console.log('📊 Quiz có', testQuiz.questions.length, 'câu hỏi text');

// Kiểm tra từng câu hỏi
testQuiz.questions.forEach((q, index) => {
  console.log(`\n📝 Câu ${index + 1}: "${q.question}"`);
  console.log(`   💡 Đáp án: "${q.correctAnswers[0]}"`);
  console.log(`   ✅ Có đáp án: ${q.correctAnswers[0]?.trim() ? 'CÓ' : 'KHÔNG'}`);
});

console.log('\n🎯 HƯỚNG DẪN TEST:');
console.log('1. Refresh trang web');
console.log('2. Vào Classes → Tìm quiz "Final Test Quiz - Text Questions"');
console.log('3. Click "Làm bài"');
console.log('4. Thử trả lời:');
console.log('   - Câu 1: "Guido van Rossum"');
console.log('   - Câu 2: "Jupyter Notebook"');
console.log('   - Câu 3: "PyCharm"');
console.log('5. Nộp bài và kiểm tra kết quả');

console.log('\n🔧 Quiz ID để debug:', testQuiz.id);
