// Test với multiple correct answers cho text questions
// Chạy trong console browser

console.log('=== TESTING MULTIPLE CORRECT ANSWERS ===');

const multiAnswerQuiz = {
  id: 'quiz-multi-answer-' + Date.now(),
  title: 'Multi Answer Test Quiz',
  description: 'Test nhiều đáp án đúng cho text questions',
  questions: [
    {
      id: 'q1',
      question: 'Python là ngôn ngữ gì?',
      type: 'text',
      correctAnswers: [
        'ngôn ngữ lập trình', 
        'programming language',
        'lập trình',
        'python'
      ], // Nhiều đáp án đúng
      explanation: 'Python là ngôn ngữ lập trình'
    },
    {
      id: 'q2',
      question: 'IDE cho Python là gì? (nhiều đáp án được chấp nhận)',
      type: 'text',
      correctAnswers: [
        'PyCharm',
        'VS Code', 
        'Visual Studio Code',
        'Jupyter',
        'Jupyter Notebook',
        'IDLE'
      ], // Nhiều đáp án đúng
      explanation: 'Có nhiều IDE cho Python'
    },
    {
      id: 'q3',
      question: 'Framework web Python phổ biến?',
      type: 'text',
      correctAnswers: [
        'Django',
        'Flask',
        'FastAPI'
      ], // Nhiều đáp án đúng
      explanation: 'Django, Flask, FastAPI đều là framework web Python'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  published: true
};

// Thêm vào localStorage
const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
existingQuizzes.push(multiAnswerQuiz);
localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));

console.log('✅ Multi answer quiz đã được tạo:', multiAnswerQuiz.id);

multiAnswerQuiz.questions.forEach((q, index) => {
  console.log(`\n📝 Câu ${index + 1}: "${q.question}"`);
  console.log(`   💡 Đáp án được chấp nhận:`, q.correctAnswers);
});

console.log('\n🎯 HƯỚNG DẪN TEST:');
console.log('Thử các câu trả lời này (bất kỳ cái nào cũng được tính đúng):');
console.log('Câu 1: "python", "lập trình", "programming language", "ngôn ngữ lập trình"');
console.log('Câu 2: "PyCharm", "VS Code", "Jupyter", "IDLE"');
console.log('Câu 3: "Django", "Flask", "FastAPI"');

console.log('\n🔧 Quiz ID:', multiAnswerQuiz.id);
