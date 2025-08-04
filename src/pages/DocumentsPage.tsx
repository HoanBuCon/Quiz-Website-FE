import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UploadedFile } from '../types';
import { parseFile } from '../utils/docsParser';
import { checkDuplicateFileName, showDuplicateModal } from '../utils/fileUtils';

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  
  // Modal states
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isCreateNewClass, setIsCreateNewClass] = useState(true);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [existingClasses, setExistingClasses] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Lấy documents từ localStorage
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
      const docs = JSON.parse(savedDocs).map((doc: any) => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt)
      }));
      setDocuments(docs);
    }
    
    // Lấy số lượng lớp học từ localStorage
    const savedClasses = localStorage.getItem('classrooms');
    if (savedClasses) {
      const classes = JSON.parse(savedClasses);
      setTotalClasses(classes.length);
      setExistingClasses(classes);
      
      // Tính tổng số quiz với support cho cả hai format
      const total = classes.reduce((sum: number, classroom: any) => {
        let quizCount = 0;
        
        // Handle both old format (quizIds) and new format (quizzes)
        if (classroom.quizIds && Array.isArray(classroom.quizIds)) {
          quizCount = classroom.quizIds.length;
        } else if (classroom.quizzes && Array.isArray(classroom.quizzes)) {
          quizCount = classroom.quizzes.length;
        }
        
        return sum + quizCount;
      }, 0);
      setTotalQuizzes(total);
    }
    
    setLoading(false);
  }, []);

  // Xử lý khi file được chọn
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  // Xử lý khi file được kéo thả
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Xử lý khi file được thả
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Xử lý upload files
  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    
    for (const file of files) {
      setProcessingFile(file.name);
      
      try {
        // Kiểm tra duplicate file name
        const duplicateCheck = checkDuplicateFileName(file.name, documents);
        let finalFileName = file.name;
        let shouldOverwrite = false;
        
        if (duplicateCheck.isDuplicate) {
          const action = await showDuplicateModal(file.name, duplicateCheck.suggestedName!);
          
          if (action.action === 'cancel') {
            continue; // Bỏ qua file này
          } else if (action.action === 'overwrite') {
            shouldOverwrite = true;
            finalFileName = file.name;
          } else if (action.action === 'rename') {
            finalFileName = action.newFileName!;
          }
        }
        
        const fileType = getFileType(finalFileName);
        
        // Đọc nội dung file
        const content = await readFileContent(file);
        
        // Tạo document mới
        const newDocument: UploadedFile = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: finalFileName,
          type: fileType,
          size: file.size,
          uploadedAt: new Date(),
          content: content
        };
        
        // Lưu vào localStorage
        const savedDocs = localStorage.getItem('documents') || '[]';
        let docs = JSON.parse(savedDocs);
        
        if (shouldOverwrite) {
          // Xóa file cũ và thêm file mới
          docs = docs.filter((doc: UploadedFile) => doc.name !== file.name);
          docs.push(newDocument);
          
          // Cập nhật state - xóa file cũ và thêm file mới
          setDocuments(prev => {
            const filtered = prev.filter(doc => doc.name !== file.name);
            return [...filtered, newDocument];
          });
        } else {
          // Thêm file mới
          docs.push(newDocument);
          
          // Cập nhật state
          setDocuments(prev => [...prev, newDocument]);
        }
        
        localStorage.setItem('documents', JSON.stringify(docs));
        
      } catch (error) {
        console.error('Lỗi khi xử lý file:', error);
        alert(`Lỗi khi xử lý file ${file.name}: ${error}`);
      }
    }
    
    setIsUploading(false);
    setProcessingFile(null);
  };

  // Đọc nội dung file
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      reader.onload = (e) => {
        try {
          if (fileExtension === 'doc' || fileExtension === 'docx') {
            // Đối với file Word, đọc dưới dạng ArrayBuffer và chuyển thành base64
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (!arrayBuffer) {
              reject(new Error('Không thể đọc file Word'));
              return;
            }
            
            // Chuyển ArrayBuffer thành base64 string một cách an toàn
            const uint8Array = new Uint8Array(arrayBuffer);
            let binaryString = '';
            const chunkSize = 8192; // Xử lý theo chunks để tránh stack overflow
            
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.slice(i, i + chunkSize);
              binaryString += String.fromCharCode.apply(null, Array.from(chunk));
            }
            
            const base64String = btoa(binaryString);
            resolve(base64String);
          } else {
            // Đối với file text, đọc bình thường
            const content = e.target?.result as string;
            resolve(content || '');
          }
        } catch (error) {
          console.error('Lỗi khi xử lý nội dung file:', error);
          reject(new Error('Lỗi khi xử lý nội dung file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Không thể đọc file'));
      
      // Chọn phương thức đọc phù hợp
      if (fileExtension === 'doc' || fileExtension === 'docx') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Xác định loại file
  const getFileType = (fileName: string): 'docs' | 'json' | 'txt' => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'doc' || extension === 'docx') return 'docs';
    if (extension === 'json') return 'json';
    return 'txt'; // File .txt và các file khác
  };

  // Xử lý download file
  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a');
    
    if (file.type === 'docs') {
      try {
        // Đối với file Word, chuyển base64 về binary một cách an toàn
        const base64Content = file.content || '';
        
        // Kiểm tra xem content có phải là base64 hợp lệ không
        if (!base64Content) {
          alert('File không có nội dung để tải về');
          return;
        }
        
        // Sử dụng fetch để tạo binary data từ base64
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        const blob = new Blob([byteArray], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        link.href = URL.createObjectURL(blob);
      } catch (error) {
        console.error('Lỗi khi xử lý file Word:', error);
        alert('Có lỗi xảy ra khi tải file Word. File có thể bị hỏng.');
        return;
      }
    } else {
      // Đối với file text
      const blob = new Blob([file.content || ''], { type: 'text/plain' });
      link.href = URL.createObjectURL(blob);
    }
    
    link.download = file.name;
    link.click();
    
    // Cleanup URL sau khi download
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 1000);
  };

  // Xử lý tạo lớp từ file
  const handleCreateClass = (file: UploadedFile) => {
    setSelectedFile(file);
    setClassName('');
    setClassDescription('');
    setSelectedClassId('');
    setShowClassModal(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setShowClassModal(false);
    setSelectedFile(null);
    setClassName('');
    setClassDescription('');
    setSelectedClassId('');
    setIsCreateNewClass(true);
  };

  // Xử lý submit modal
  const handleModalSubmit = async () => {
    if (!selectedFile) return;

    // Validation
    if (isCreateNewClass) {
      if (!className.trim()) {
        alert('Vui lòng nhập tên lớp học');
        return;
      }
      if (!classDescription.trim()) {
        alert('Vui lòng nhập mô tả lớp học');
        return;
      }
    } else {
      if (!selectedClassId) {
        alert('Vui lòng chọn lớp học');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Parse file để lấy câu hỏi
      const fileType = getFileType(selectedFile.name);
      let questions = [];

      if (fileType === 'docs' || fileType === 'txt') {
        if (fileType === 'docs') {
          try {
            // Đối với file Word, chuyển base64 về ArrayBuffer một cách an toàn
            const base64Content = selectedFile.content || '';
            if (!base64Content) {
              alert('File Word không có nội dung');
              return;
            }
            
            const binaryString = atob(base64Content);
            const uint8Array = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              uint8Array[i] = binaryString.charCodeAt(i);
            }
            
            const fileBlob = new Blob([uint8Array], { 
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            });
            const file = new File([fileBlob], selectedFile.name, { 
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            });
            
            const result = await parseFile(file);
            if (result.success && result.questions) {
              questions = result.questions;
            } else {
              alert(`Không thể phân tích file: ${result.error || 'Lỗi không xác định'}`);
              return;
            }
          } catch (error) {
            console.error('Lỗi khi xử lý file Word:', error);
            alert('Có lỗi xảy ra khi xử lý file Word. File có thể bị hỏng.');
            return;
          }
        } else {
          // Đối với file text
          const fileBlob = new Blob([selectedFile.content || ''], { type: 'text/plain' });
          const file = new File([fileBlob], selectedFile.name, { type: 'text/plain' });
          
          const result = await parseFile(file);
          if (result.success && result.questions) {
            questions = result.questions;
          } else {
            alert(`Không thể phân tích file: ${result.error || 'Lỗi không xác định'}`);
            return;
          }
        }
      } else {
        alert('Hiện tại chỉ hỗ trợ file .doc, .docx, .txt');
        return;
      }

      if (questions.length === 0) {
        alert('Không tìm thấy câu hỏi nào trong file');
        return;
      }

      // Tạo quiz ID
      const quizId = `file-${Date.now()}-${Math.random()}`;

      // Chuyển đến EditQuizPage với dữ liệu
      navigate('/edit-quiz', {
        state: {
          questions: questions,
          fileName: selectedFile.name,
          fileId: quizId,
          // Thông tin lớp học
          classInfo: isCreateNewClass ? {
            isNew: true,
            name: className,
            description: classDescription
          } : {
            isNew: false,
            classId: selectedClassId
          }
        }
      });

      handleCloseModal();

    } catch (error) {
      console.error('Lỗi khi xử lý file:', error);
      alert('Có lỗi xảy ra khi xử lý file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Xóa file
  const handleDeleteFile = (fileId: string, fileName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${fileName}"?`)) {
      const newDocs = documents.filter(doc => doc.id !== fileId);
      setDocuments(newDocs);
      localStorage.setItem('documents', JSON.stringify(newDocs));
      alert(`Đã xóa tài liệu "${fileName}" thành công!`);
    }
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

          {/* Upload Area */}
          <div className="card p-8 mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tải lên tài liệu mới
            </h3>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                dragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Kéo thả File vào đây hoặc click để chọn File
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Hỗ trợ File .txt, .json, .doc, .docx
                  </p>
                  
                  <label className="btn-primary cursor-pointer">
                    Chọn file
                    <input
                      type="file"
                      multiple
                      accept=".txt,.json,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {processingFile ? `Đang xử lý ${processingFile}...` : 'Đang tải lên...'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">100%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all duration-300"></div>
                </div>
              </div>
            )}
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
                        className="btn-secondary text-sm flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Tải về
                      </button>
                      <button
                        onClick={() => handleCreateClass(doc)}
                        className="btn-primary text-sm flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Tạo lớp
                      </button>
                      <button
                        onClick={() => handleDeleteFile(doc.id, doc.name)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
                        title="Xóa tài liệu"
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
        </div>

        {/* Right Section - 30% */}
        <div className="w-1/3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Thống kê tài liệu
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Số lượng tài liệu:</span>
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
                <span className="text-gray-600 dark:text-gray-400">Số lượng lớp đã tạo:</span>
                <span className="font-semibold text-green-600">{totalClasses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Số lượng bài kiểm tra:</span>
                <span className="font-semibold text-blue-600">{totalQuizzes}</span>
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

      {/* Modal tạo lớp */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tạo lớp từ tài liệu: {selectedFile?.name}
            </h3>

            {/* Radio buttons */}
            <div className="mb-6">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="classOption"
                    checked={isCreateNewClass}
                    onChange={() => setIsCreateNewClass(true)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Tạo lớp học mới
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="classOption"
                    checked={!isCreateNewClass}
                    onChange={() => setIsCreateNewClass(false)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Chọn lớp học có sẵn
                  </span>
                </label>
              </div>
            </div>

            {/* Form fields */}
            {isCreateNewClass ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên lớp học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Nhập tên lớp học"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mô tả lớp học <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={classDescription}
                    onChange={(e) => setClassDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Nhập mô tả lớp học"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chọn lớp học <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {existingClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleModalSubmit}
                disabled={isProcessing}
                className="flex-1 btn-primary flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  'Tiếp tục'
                )}
              </button>
              <button
                onClick={handleCloseModal}
                disabled={isProcessing}
                className="flex-1 btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage; 