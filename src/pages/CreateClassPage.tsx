import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadedFile } from '../types';
import { parseFile } from '../utils/docsParser';
import { checkDuplicateFileName, showDuplicateModal, generateUniqueFileName, formatDate } from '../utils/fileUtils';

// Component trang tạo lớp
const CreateClassPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isCreateNewClass, setIsCreateNewClass] = useState(true);
  const [existingClasses, setExistingClasses] = useState<any[]>([]);

  // Kiểm tra xem form có hợp lệ không
  const isFormValid = () => {
    if (isCreateNewClass) {
      return className.trim() !== '' && classDescription.trim() !== '';
    } else {
      return selectedClassId !== '';
    }
  };

  // Load danh sách lớp học có sẵn (backend)
  useEffect(() => {
    (async () => {
      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) return;
        const { ClassesAPI } = await import('../utils/api');
        const mine = await ClassesAPI.listMine(token);
        setExistingClasses(mine);
      } catch (e) {
        console.error('Failed to load classes:', e);
      }
    })();
  }, []);

  // Xử lý khi file được chọn
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Kiểm tra validation trước
    if (!isFormValid()) {
      event.target.value = ''; // Reset input
      if (isCreateNewClass) {
        alert('Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz');
      } else {
        alert('Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz');
      }
      return;
    }
    
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
    
    // Kiểm tra validation trước
    if (!isFormValid()) {
      if (isCreateNewClass) {
        alert('Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz');
      } else {
        alert('Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz');
      }
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Tạo lớp học mới (để backward compatibility với các hàm khác)
  const createNewClass = (quizId: string) => {
    console.log('createNewClass called with quizId:', quizId);
    console.log('This function is deprecated - class creation now happens in EditQuizPage');
    
    // Trả về null để các hàm khác biết rằng không tạo lớp ở đây
    return null;
  };

  // Thêm quiz vào lớp học có sẵn (để backward compatibility với các hàm khác)  
  const addQuizToExistingClass = (quizId: string) => {
    console.log('addQuizToExistingClass called with quizId:', quizId);
    console.log('This function is deprecated - class creation now happens in EditQuizPage');
    
    // Trả về null để các hàm khác biết rằng không tạo lớp ở đây
    return null;
  };

  // Xử lý chuyển đến trang tạo quiz thủ công
  const handleCreateManualQuiz = () => {
    console.log('handleCreateManualQuiz called');
    
    // Kiểm tra validation trước
    if (!isFormValid()) {
      if (isCreateNewClass) {
        alert('Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz');
      } else {
        alert('Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz');
      }
      return;
    }
    
    const quizId = `manual-${Date.now()}-${Math.random()}`;
    console.log('Generated quizId:', quizId);
    
    // KHÔNG tự động tạo lớp học - chỉ chuẩn bị thông tin để tạo sau khi xuất bản
    
    console.log('About to navigate to /edit-quiz with state:', {
      questions: [],
      fileName: 'Quiz thủ công',
      fileId: quizId,
      classInfo: isCreateNewClass ? {
        isNew: true,
        name: className.trim(),
        description: classDescription.trim()
      } : {
        isNew: false,
        classId: selectedClassId
      }
    });
    
    navigate('/edit-quiz', {
      state: {
        questions: [],
        fileName: 'Quiz thủ công',
        fileId: quizId,
        classInfo: isCreateNewClass ? {
          isNew: true,
          name: className.trim(),
          description: classDescription.trim()
        } : {
          isNew: false,
          classId: selectedClassId
        }
      }
    });
    
    console.log('Navigation completed');
  };

  // Xử lý upload files
  const handleFiles = async (files: File[]) => {
    console.log('handleFiles called with files:', files);
    
    // Kiểm tra validation trước khi xử lý file
    if (isCreateNewClass) {
      if (!className.trim()) {
        alert('Vui lòng nhập tên lớp học trước khi tải file');
        return;
      }
      if (!classDescription.trim()) {
        alert('Vui lòng nhập mô tả lớp học trước khi tải file');
        return;
      }
    } else {
      if (!selectedClassId) {
        alert('Vui lòng chọn lớp học trước khi tải file');
        return;
      }
    }
    
    setIsUploading(true);
    
    for (const file of files) {
      console.log('Processing file:', file.name);
      setProcessingFile(file.name);
      
      try {
        // Lấy danh sách tài liệu đã có từ localStorage và uploadedFiles
        const savedDocs = localStorage.getItem('documents') || '[]';
        const existingDocuments = JSON.parse(savedDocs).map((doc: any) => ({
          ...doc,
          uploadedAt: new Date(doc.uploadedAt)
        }));
        
        // Kết hợp với files đã upload trong session hiện tại
        const allExistingFiles = [...existingDocuments, ...uploadedFiles];
        
        // Kiểm tra duplicate file name
        const duplicateCheck = checkDuplicateFileName(file.name, allExistingFiles);
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
        console.log('File type:', fileType);
        
        if (fileType === 'docs' || fileType === 'txt') {
          console.log('Processing as docs/txt file');
          // Sử dụng function mới để parse file
          const result = await parseFile(file);
          console.log('Parse result:', result);
          
          if (!result.success) {
            const errorMessage = `File ${finalFileName} có lỗi định dạng:\n\n${result.error}\n\nHướng dẫn sử dụng file:\n1. Sử dụng font đơn giản (Times New Roman, Arial)\n2. Không sử dụng bullet points, chỉ dùng A. B. C. D.\n3. Không sử dụng màu sắc hoặc định dạng phức tạp\n4. Đánh dấu đáp án đúng bằng dấu *\n5. Xem template-docs.txt để biết định dạng chuẩn`;
            alert(errorMessage);
            continue;
          }

          const quizId = `file-${Date.now()}-${Math.random()}`;
          
          // KHÔNG tự động lưu quiz - chỉ chuẩn bị dữ liệu
          // Quiz sẽ được tạo khi user bấm "Xuất bản" trong EditQuizPage
          
          // Lưu file vào documents (để backup) với ID riêng biệt
          const documentId = `doc-${Date.now()}-${Math.random()}`; // ID riêng cho document
          let docs = JSON.parse(savedDocs);
          
          // Tạo document mới
          const newDocument = {
            id: documentId, // Sử dụng documentId thay vì quizId
            name: finalFileName,
            type: fileType,
            size: file.size,
            uploadedAt: new Date(),
            content: await readFileContent(file)
          };
          
          if (shouldOverwrite) {
            // Xóa document cũ và thêm document mới
            docs = docs.filter((doc: any) => doc.name !== file.name);
            docs.push(newDocument);
            
            // Cập nhật state - xóa file cũ và thêm file mới
            setUploadedFiles(prev => {
              const filtered = prev.filter(f => f.name !== file.name);
              return [...filtered, newDocument];
            });
          } else {
            // Thêm document mới
            docs.push(newDocument);
            
            // Cập nhật state
            setUploadedFiles(prev => [...prev, newDocument]);
          }
          
          localStorage.setItem('documents', JSON.stringify(docs));
          
          // Kiểm tra xem có câu hỏi được parse không
          if (!result.questions || result.questions.length === 0) {
            alert(`Không tìm thấy câu hỏi nào trong file ${finalFileName}. Vui lòng kiểm tra lại định dạng file.`);
            continue;
          }

          // KHÔNG tự động tạo lớp học - chỉ chuẩn bị thông tin để tạo sau khi xuất bản

          // Chuyển đến trang chỉnh sửa với câu hỏi đã parse
          navigate('/edit-quiz', {
            state: {
              questions: result.questions,
              fileName: finalFileName,
              fileId: quizId,
              classInfo: isCreateNewClass ? {
                isNew: true,
                name: className.trim(),
                description: classDescription.trim()
              } : {
                isNew: false,
                classId: selectedClassId
              }
            }
          });
          return; // Dừng xử lý các file khác
        }
        
        // Xử lý các loại file khác (JSON và các file khác)
        // Lưu file vào documents và uploadedFiles
        let docs = JSON.parse(savedDocs);
        const content = await readFileContent(file);
        const newFile: UploadedFile = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: finalFileName,
          type: fileType,
          size: file.size,
          uploadedAt: new Date(),
          content: content
        };
        
        if (shouldOverwrite) {
          // Xóa file cũ và thêm file mới
          docs = docs.filter((doc: any) => doc.name !== file.name);
          docs.push(newFile);
          
          // Cập nhật state - xóa file cũ và thêm file mới
          setUploadedFiles(prev => {
            const filtered = prev.filter(f => f.name !== file.name);
            return [...filtered, newFile];
          });
        } else {
          // Thêm file mới
          docs.push(newFile);
          
          // Cập nhật state
          setUploadedFiles(prev => [...prev, newFile]);
        }
        
        localStorage.setItem('documents', JSON.stringify(docs));
        
      } catch (error) {
        console.error('Lỗi khi xử lý file:', error);
        alert(`Lỗi khi xử lý file ${file.name}: ${error}`);
        setIsUploading(false);
        setProcessingFile(null);
        return; // Dừng xử lý khi có lỗi
      }
    }
    
    setIsUploading(false);
    setProcessingFile(null);
  };

  // Đọc nội dung file (chuẩn hóa cho Word: đọc dạng ArrayBuffer và chuyển base64)
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      reader.onload = (e) => {
        try {
          if (fileExtension === 'doc' || fileExtension === 'docx') {
            // Đọc file Word dạng ArrayBuffer và chuyển base64
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (!arrayBuffer) {
              reject(new Error('Không thể đọc file Word'));
              return;
            }
            const uint8Array = new Uint8Array(arrayBuffer);
            let binaryString = '';
            const chunkSize = 8192;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.slice(i, i + chunkSize);
              binaryString += String.fromCharCode.apply(null, Array.from(chunk));
            }
            const base64String = btoa(binaryString);
            resolve(base64String);
          } else {
            // File text/json đọc bình thường
            const content = e.target?.result as string;
            resolve(content || '');
          }
        } catch (error) {
          console.error('Lỗi khi xử lý nội dung file:', error);
          reject(new Error('Lỗi khi xử lý nội dung file'));
        }
      };
      reader.onerror = () => reject(new Error('Không thể đọc file'));
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

  // Xóa file đã upload
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };


  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Hero Section Mobile */}
      <div className="mb-8 lg:hidden">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-amber-700 to-yellow-900 dark:from-orange-900 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
              Tạo lớp học mới
            </h1>
            <p className="text-base sm:text-lg text-orange-100 dark:text-orange-200">
              Nhập thông tin và chọn cách tạo bài kiểm tra
            </p>
          </div>
        </div>
      </div>

      {/* Dropdown Menu - Mobile Only */}
      <div className="mb-6 lg:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg shadow-md transition-all duration-200 font-medium"
            onClick={() => {
              const guideSection = document.getElementById('guidance-section');
              if (guideSection) {
                guideSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm">Hướng dẫn</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg shadow-md transition-all duration-200 font-medium"
            onClick={() => {
              const previewSection = document.getElementById('preview-section');
              if (previewSection) {
                previewSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm">Preview</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Left Section - Main Content */}
        <div className="lg:w-[70%] min-w-0 order-1">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tạo lớp học mới
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              Nhập thông tin lớp học và chọn cách tạo bài kiểm tra
            </p>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Tạo lớp học mới hoặc chọn lớp học có sẵn
              </p>
            </div>
          </div>

          {/* Class Selection/Creation Section */}
          <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-stone-400 dark:border-l-gray-600 hover:border-l-orange-500 dark:hover:border-l-orange-500">
            <div className="p-6 space-y-6">
              {/* Toggle giữa tạo mới và chọn có sẵn */}
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="classOption"
                    checked={isCreateNewClass}
                    onChange={() => setIsCreateNewClass(true)}
                    className="mr-3 w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    🆕 Tạo lớp học mới
                  </span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="classOption"
                    checked={!isCreateNewClass}
                    onChange={() => setIsCreateNewClass(false)}
                    className="mr-3 w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    📚 Chọn lớp học có sẵn
                  </span>
                </label>
              </div>

              {/* Form tạo lớp mới */}
              {isCreateNewClass ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tên lớp học <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="Ví dụ: Lớp KHMT K69A - Machine Learning"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Mô tả lớp học <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={classDescription}
                      onChange={(e) => setClassDescription(e.target.value)}
                      placeholder="Nhập mô tả chi tiết về lớp học, mục tiêu học tập..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                /* Dropdown chọn lớp có sẵn */
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Chọn lớp học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {existingClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  {existingClasses.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Chưa có lớp học nào. Hãy tạo lớp học mới.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Manual Quiz Creation */}
          <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-stone-400 dark:border-l-gray-600 hover:border-l-primary-500 dark:hover:border-l-primary-500">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tạo Quiz thủ công</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tự nhập câu hỏi và đáp án</p>
                </div>
              </div>
              {!isFormValid() && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    {isCreateNewClass 
                      ? 'Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz'
                      : 'Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz'
                    }
                  </p>
                </div>
              )}
              
              <div className={`border-2 border-solid rounded-xl p-8 text-center transition-all duration-300 ${
                !isFormValid()
                  ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 opacity-50'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
              }`}>
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-medium mb-2 ${
                      isFormValid() 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Tạo bài kiểm tra thủ công
                    </h3>
                    <p className={`mb-4 ${
                      isFormValid() 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      Tạo bài kiểm tra bằng cách nhập câu hỏi và đáp án trực tiếp vào hệ thống
                    </p>

                    <button
                      onClick={handleCreateManualQuiz}
                      disabled={!isFormValid()}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                        isFormValid() 
                          ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tạo bài trắc nghiệm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 border-t-2 border-gray-300 dark:border-gray-600"></div>
            <span className="px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full py-1">
              hoặc
            </span>
            <div className="flex-1 border-t-2 border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Upload Area */}
          <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 border-l-stone-400 dark:border-l-gray-600 hover:border-l-primary-500 dark:hover:border-l-primary-500">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tải lên File câu hỏi</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hỗ trợ .docx và .txt</p>
                </div>
              </div>
              {!isFormValid() && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                    {isCreateNewClass 
                      ? 'Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz'
                      : 'Vui lòng tạo lớp học mới hoặc chọn lớp có sẵn trước khi tạo Quiz'
                    }
                  </p>
                </div>
              )}
              
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  !isFormValid()
                    ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    : dragActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-105 shadow-lg'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                }`}
                onDragEnter={isFormValid() ? handleDrag : undefined}
                onDragLeave={isFormValid() ? handleDrag : undefined}
                onDragOver={isFormValid() ? handleDrag : undefined}
                onDrop={isFormValid() ? handleDrop : undefined}
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
                   <h3 className={`text-lg font-medium mb-2 ${
                     isFormValid() 
                       ? 'text-gray-900 dark:text-white' 
                       : 'text-gray-500 dark:text-gray-400'
                   }`}>
                     Kéo thả File vào đây hoặc click để chọn File
                   </h3>
                      <p className={`mb-4 ${
                        isFormValid() 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-gray-500 dark:text-gray-500'
                      }`}>
                    Hỗ trợ File .txt, .json, .doc, .docx
                  </p>
                  
                  <label className={`cursor-pointer inline-flex items-center gap-2 ${
                    isFormValid() 
                      ? 'btn-primary' 
                      : 'px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Chọn File
                      <input
                       type="file"
                       multiple
                       accept=".txt,.json,.doc,.docx"
                       onChange={handleFileSelect}
                       className="hidden"
                       disabled={!isFormValid()}
                     />
                  </label>
                </div>
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

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Files đã tải lên
              </h3>
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {file.type.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB • {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Desktop Only, Sticky Sidebar */}
        <div className="hidden lg:block lg:w-[30%] lg:flex-shrink-0 order-2">
          <div className="lg:sticky lg:top-20 space-y-6">
            {/* Hướng dẫn - Desktop */}
            <div className="card p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Hướng dẫn
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Định dạng file hỗ trợ:
                  </h4>
                  <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 ml-3.5">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Text files (.txt) - Khuyến nghị
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      JSON files (.json)
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Word files (.doc, .docx)
                    </li>
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Kích thước tối đa:
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-3.5">10 MB mỗi file</p>
                </div>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Lưu ý quan trọng:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 ml-3.5">
                    <li>• File sẽ được xử lý tự động</li>
                    <li>• File Word (.docx) đã được hỗ trợ</li>
                    <li>• Sử dụng font đơn giản (Times New Roman, Arial)</li>
                    <li>• Không sử dụng bullet points</li>
                    <li>• Chỉ dùng A. B. C. D. cho đáp án</li>
                    <li>• Xem preview để biết định dạng chuẩn</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview Format - Desktop */}
            <div className="card p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Preview định dạng
                </h3>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-xs font-mono text-gray-700 dark:text-gray-300 space-y-2">
                  <div className="text-gray-500 dark:text-gray-400 font-semibold">ID: 101</div>
                  <div className="font-medium">Câu 1: Thủ đô của Việt Nam là ?</div>
                  <div className="ml-4 text-green-600 dark:text-green-400">*A. Hà Nội</div>
                  <div className="ml-4">B. TP. Hồ Chí Minh</div>
                  <div className="ml-4">C. Đà Nẵng</div>
                  <div className="ml-4">D. Huế</div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600"></div>
                  
                  <div className="text-gray-500 dark:text-gray-400 font-semibold">ID: 261</div>
                  <div className="font-medium">Câu 2: Ngôn ngữ lập trình nào phổ biến nhất ?</div>
                  <div className="ml-4">A. Python</div>
                  <div className="ml-4 text-green-600 dark:text-green-400">*B. JavaScript</div>
                  <div className="ml-4">C. Java</div>
                  <div className="ml-4">D. C++</div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600"></div>
                  
                  <div className="text-gray-500 dark:text-gray-400 font-semibold">ID: 168</div>
                  <div className="font-medium">Câu 3: Ngôn ngữ nào phù hợp cho lập trình thi đấu ?</div>
                  <div className="ml-4">A. Python</div>
                  <div className="ml-4 text-green-600 dark:text-green-400">*B. C</div>
                  <div className="ml-4 text-green-600 dark:text-green-400">*C. C++</div>
                  <div className="ml-4">D. Java</div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600"></div>
                  
                  <div className="text-gray-500 dark:text-gray-400 font-semibold">ID: 421</div>
                  <div className="font-medium">Câu 4: Generative AI - GenAI là gì ?</div>
                  <div className="ml-4 text-amber-600 dark:text-amber-400 italic">(Câu hỏi "Điền đáp án đúng" - Giáo viên nhập đáp án thủ công)</div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">*</span>
                  Dấu * đánh dấu đáp án đúng
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">ID:</span>
                  Mã câu hỏi trong LMS hoặc tự đặt
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">A-D:</span>
                  Các đáp án (để trống nếu câu hỏi điền đáp án)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Guidance Section */}
      <div className="lg:hidden mt-8" id="guidance-section">
        <div className="card p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center flex items-center justify-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Hướng dẫn
          </h3>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Định dạng file hỗ trợ:</h4>
              <ul className="space-y-1">
                <li>• Text files (.txt) - Khuyến nghị</li>
                <li>• JSON files (.json)</li>
                <li>• Word files (.doc, .docx)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Kích thước tối đa:</h4>
              <p>10 MB mỗi file</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Lưu ý:</h4>
              <p>File sẽ được xử lý tự động để tạo câu hỏi trắc nghiệm</p>
              <p className="text-xs mt-2">• File Word (.docx) hiện đã được hỗ trợ trực tiếp</p>
              <p className="text-xs">• Sử dụng font đơn giản (Times New Roman, Arial)</p>
              <p className="text-xs">• Không sử dụng bullet points, chỉ dùng A. B. C. D.</p>
              <p className="text-xs">• Xem hướng dẫn để biết định dạng chuẩn</p>
              <p className="text-xs">• Đảm bảo File tài liệu được đặt theo đúng định dạng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Preview Section */}
      <div className="lg:hidden mt-6" id="preview-section">
        <div className="card p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Preview định dạng chuẩn
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-mono text-gray-700 dark:text-gray-300 space-y-1">
              <div className="text-gray-500 dark:text-gray-400">ID: 101</div>
              <div>Câu 1: Thủ đô của Việt Nam là ?</div>
              <div className="ml-4">*A. Hà Nội</div>
              <div className="ml-4">B. TP. Hồ Chí Minh</div>
              <div className="ml-4">C. Đà Nẵng</div>
              <div className="ml-4">D. Huế</div>
              <br />
              <div className="mt-2 text-gray-500 dark:text-gray-400">ID: 261</div>
              <div>Câu 2: Ngôn ngữ lập trình nào phổ biến nhất ?</div>
              <div className="ml-4">A. Python</div>
              <div className="ml-4">*B. JavaScript</div>
              <div className="ml-4">C. Java</div>
              <div className="ml-4">D. C++</div>
              <br />
              <div className="mt-2 text-gray-500 dark:text-gray-400">ID: 168</div>
              <div>Câu 3: Ngôn ngữ nào phù hợp cho lập trình thi đấu ?</div>
              <div className="ml-4">A. Python</div>
              <div className="ml-4">*B. C</div>
              <div className="ml-4">*C. C++</div>
              <div className="ml-4">D. Java</div>
              <br />
              <div className="mt-2 text-gray-500 dark:text-gray-400">ID: 421</div>
              <div>Câu 4: Generative AI - GenAI là gì ?</div>
              <div className="ml-4">(Câu hỏi không có đáp án thì website sẽ tự hiểu đó là câu hỏi "Điền đáp án đúng". Lúc này đáp án đúng cần được giáo viên nhập thủ công trong giao diện tạo / chỉnh sửa quiz trước khi xuất bản.)</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <p>• Câu hỏi có dấu * là đáp án đúng.</p>
            <p>• ID: Mã hỏi trong LMS. Hoặc tự đặt ID nếu bạn làm đề thủ công.</p>
            <p>• A. B. C. D. = các đáp án.</p>
            <p>• Nếu câu hỏi yêu cầu điền đáp án, hãy để trống phần đáp án.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClassPage; 