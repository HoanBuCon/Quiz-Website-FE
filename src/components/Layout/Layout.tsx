import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import BackgroundMusic from '../BackgroundMusic';

// Interface cho Layout component
interface LayoutProps {
  children: ReactNode;
}

// Component Layout chính của website
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Background Music Player */}
      <BackgroundMusic />
    </div>
  );
};

export default Layout; 