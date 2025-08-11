import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import Layout from './components/Layout/Layout';
import FixedLayout from './components/Layout/FixedLayout'; // Import FixedLayout
import BackgroundMusic from './components/BackgroundMusic'; // Import BackgroundMusic
import HomePage from './pages/HomePage';
import ClassesPage from './pages/ClassesPage';
import CreateClassPage from './pages/CreateClassPage';
import EditQuizPage from './pages/EditQuizPage';
import EditClassPage from './pages/EditClassPage';
import DocumentsPage from './pages/DocumentsPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';

// Component App chính của website
function App() {
  return (
    <ThemeProvider>
      <MusicProvider>
        <Router>
          <Routes>
            {/* Routes sử dụng Layout thông thường */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/classes" element={<Layout><ClassesPage /></Layout>} />
            <Route path="/create" element={<Layout><CreateClassPage /></Layout>} />
            <Route path="/edit-quiz" element={<Layout><EditQuizPage /></Layout>} />
            <Route path="/documents" element={<Layout><DocumentsPage /></Layout>} />
            <Route path="/quiz/:quizId" element={<Layout><QuizPage /></Layout>} />
            <Route path="/results/:quizId" element={<Layout><ResultsPage /></Layout>} />
            
            {/* Route sử dụng FixedLayout - KHÔNG SCROLL */}
            <Route path="/edit-class/:classId" element={<FixedLayout><EditClassPage /></FixedLayout>} />
          </Routes>
          
          {/* Background Music Player - Đặt ngoài để không bị reset */}
          <BackgroundMusic />
          
          {/* Toast notifications */}
          <Toaster 
            position="bottom-center"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{
              bottom: '20px',
            }}
            toastOptions={{
              className: '',
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(26, 32, 44, 0.95))',
                color: '#f7fafc',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: '500',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(116, 129, 140, 0.3)',
                minWidth: '200px',
                maxWidth: '400px',
                whiteSpace: 'nowrap' as const,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9))',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  minWidth: '200px',
                  maxWidth: '400px',
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#f87171',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  minWidth: '200px',
                  maxWidth: '400px',
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              },
            }}
          />
        </Router>
      </MusicProvider>
    </ThemeProvider>
  );
}

export default App;