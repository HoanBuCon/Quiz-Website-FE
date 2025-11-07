import React, { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import BackgroundMusic from "../BackgroundMusic";

// Interface cho FixedLayout component
interface FixedLayoutProps {
  children: ReactNode;
}

// Layout cố định cho trang EditClass - không scroll
const FixedLayout: React.FC<FixedLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content - cố định chiều cao */}
      <main className="flex-1 pt-16 overflow-hidden">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default FixedLayout;
