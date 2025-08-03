// Test script để thêm quiz có câu hỏi text vào localStorage
// Chạy trong console của browser để test

const testQuizWithTextQuestions = {
  id: 'quiz-test-text-1',
  title: 'Test Quiz với câu hỏi điền đáp án',
  description: 'Bài test để kiểm tra câu hỏi tự luận',
  questions: [
    {
      id: 'q1',
      question: 'React là gì?',
      type: 'text',
      correctAnswers: ['javascript library', 'thư viện javascript', 'library'],
      explanation: 'React là một thư viện JavaScript để xây dựng giao diện người dùng'
    },
    {
      id: 'q2', 
      question: 'Viết tắt của HTML là gì?',
      type: 'text',
      correctAnswers: ['hypertext markup language', 'HyperText Markup Language'],
      explanation: 'HTML là HyperText Markup Language'
    },
    {
      id: 'q3',
      question: 'CSS dùng để làm gì?',
      type: 'text',
      correctAnswers: ['styling', 'trang trí', 'định dạng', 'style'],
      explanation: 'CSS được dùng để định dạng và trang trí giao diện web'
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Thêm vào localStorage
const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
existingQuizzes.push(testQuizWithTextQuestions);
localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));

console.log('Test quiz với câu hỏi text đã được thêm!');
