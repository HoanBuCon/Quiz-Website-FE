import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UploadedFile } from '../types';

// Component trang tài liệu
const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data cho tài liệu
  useEffect(() => {
    setTimeout(() => {
      const mockDocuments: UploadedFile[] = [
        {
          id: '1',
          name: 'Toán học cơ bản.docx',
          type: 'docs',
          size: 2048576, // 2MB
          uploadedAt: new Date('2024-01-15'),
          content: 'Nội dung tài liệu toán học...',
        },
        {
          id: '2',
          name: 'Vật lý đại cương.json',
          type: 'json',
          size: 512000, // 512KB
          uploadedAt: new Date('2024-01-20'),
          content: '{"questions": [...]}',
        },
        {
          id: '3',
          name: 'Hóa học phổ thông.txt',
          type: 'txt',
          size: 1024000, // 1MB
          uploadedAt: new Date('2024-01-25'),
          content: 'Nội dung tài liệu hóa học...',
        },
        {
          id: '4',
          name: 'Tiếng Anh cơ bản.docx',
          type: 'docs',
          size: 1536000, // 1.5MB
          uploadedAt: new Date('2024-01-30'),
          content: 'Nội dung tài liệu tiếng Anh...',
        },
      ];
      setDocuments(mockDocuments);
      setLoading(false);
    }, 1000);
  }, []);

  // Xử lý download file
  const handleDownload = (file: UploadedFile) => {
    // Giả lập download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([file.content || ''], { type: 'text/plain' }));
    link.download = file.name;
    link.click();
  };

  // Xử lý tạo lớp từ file
  const handleCreateClass = (file: UploadedFile) => {
    // Chuyển đến trang tạo lớp với file đã chọn
    console.log('Tạo lớp từ file:', file.name);
  };

  // Xóa file
  const handleDeleteFile = (fileId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== fileId));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'docs':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'json':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'txt':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Left Section - 70% */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Tài liệu của tôi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Quản lý và sử dụng các tài liệu đã tải lên
            </p>
          </div>

          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                    <div className="space-x-2">
                      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Danh sách tài liệu
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {doc.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>Tải lên: {doc.uploadedAt.toLocaleDateString('vi-VN')}</span>
                          <span>•</span>
                          <span className="uppercase">{doc.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="btn-secondary text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Tải về
                      </button>
                      <button
                        onClick={() => handleCreateClass(doc)}
                        className="btn-primary text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Tạo lớp
                      </button>
                      <button
                        onClick={() => handleDeleteFile(doc.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && documents.length === 0 && (
            <div className="card p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Chưa có tài liệu nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Tải lên tài liệu đầu tiên để bắt đầu tạo bài trắc nghiệm
              </p>
              <Link to="/create" className="btn-primary">
                Tải lên tài liệu
              </Link>
            </div>
          )}
        </div>

        {/* Right Section - 30% */}
        <div className="w-1/3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Thống kê tài liệu
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tổng tài liệu:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {documents.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tổng dung lượng:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Lớp đã tạo:</span>
                <span className="font-semibold text-green-600">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Tài liệu mới nhất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {documents.length > 0 ? documents[0].uploadedAt.toLocaleDateString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Hướng dẫn sử dụng
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>• Tải lên file .doc, .docx, .json, .txt</p>
              <p>• Click "Tải về" để download tài liệu</p>
              <p>• Click "Tạo lớp" để tạo bài trắc nghiệm</p>
              <p>• Xóa tài liệu không cần thiết</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage; 