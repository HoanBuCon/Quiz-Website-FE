// Test để kiểm tra xem việc sửa chữa text question có hoạt động không
// Chạy file này trong console của trình duyệt

console.log('=== TESTING TEXT QUESTION FIX ===');

// Tạo một quiz test với text questions
const testQuiz = {
  id: 'quiz-test-fix-' + Date.now(),
  title: 'Test Quiz Fix Text Questions',
  description: 'Test để kiểm tra việc sửa chữa text questions',
  questions: [
    {
      id: 'q1',
      question: 'React là gì?',
      type: 'text',
      correctAnswers: ['javascript library'], // Đây là đáp án đúng
      explanation: 'React là một thư viện JavaScript'
    },
    {
      id: 'q2',
      question: 'HTML viết tắt của gì?',
      type: 'text', 
      correctAnswers: ['hypertext markup language'], // Đây là đáp án đúng
      explanation: 'HTML là HyperText Markup Language'
    },
    {
      id: 'q3',
      question: 'Chọn đáp án đúng:',
      type: 'single',
      options: ['A', 'B', 'C', 'D'],
      correctAnswers: ['B'],
      explanation: 'Đáp án B là đúng'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Lưu vào localStorage
const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
existingQuizzes.push(testQuiz);
localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));

console.log('Test quiz đã được tạo với ID:', testQuiz.id);
console.log('Text questions:');
testQuiz.questions.forEach((q, index) => {
  if (q.type === 'text') {
    console.log(`Câu ${index + 1}: "${q.question}"`);
    console.log(`  - Đáp án đúng: "${q.correctAnswers[0]}"`);
    console.log(`  - Có đáp án: ${q.correctAnswers[0]?.trim() ? 'CÓ' : 'KHÔNG'}`);
  }
});

console.log('\nHãy vào trang EditQuizPage để test chỉnh sửa câu hỏi text!');
console.log('Quiz ID để test:', testQuiz.id);

// Hướng dẫn test
console.log('\n=== HƯỚNG DẪN TEST ===');
console.log('1. Vào EditQuizPage với quiz này');
console.log('2. Chỉnh sửa câu hỏi text');
console.log('3. Thay đổi đáp án đúng');
console.log('4. Lưu và publish quiz');
console.log('5. Kiểm tra trong QuizPage xem đáp án có được lưu đúng không');
