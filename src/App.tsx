import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import ClassesPage from './pages/ClassesPage';
import CreateClassPage from './pages/CreateClassPage';
import EditQuizPage from './pages/EditQuizPage';
import DocumentsPage from './pages/DocumentsPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';

// Component App chính của website
function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Route trang chủ */}
            <Route path="/" element={<HomePage />} />
            
            {/* Route trang lớp học */}
            <Route path="/classes" element={<ClassesPage />} />
            
            {/* Route trang tạo lớp */}
            <Route path="/create" element={<CreateClassPage />} />
            
            {/* Route trang chỉnh sửa quiz */}
            <Route path="/edit-quiz" element={<EditQuizPage />} />
            
            {/* Route trang tài liệu */}
            <Route path="/documents" element={<DocumentsPage />} />
            
            {/* Route trang làm bài trắc nghiệm */}
            <Route path="/quiz/:quizId" element={<QuizPage />} />
            
            {/* Route trang kết quả quiz */}
            <Route path="/results/:quizId" element={<ResultsPage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
