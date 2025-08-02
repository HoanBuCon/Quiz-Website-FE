import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadedFile } from '../types';
import { parseFile } from '../utils/docsParser';

// Component trang tạo lớp
const CreateClassPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingFile, setProcessingFile] = useState<string | null>(null);

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

  // Xử lý chuyển đến trang tạo quiz thủ công
  const handleCreateManualQuiz = () => {
    navigate('/edit-quiz', {
      state: {
        questions: [],
        fileName: 'Quiz thủ công',
        fileId: `manual-${Date.now()}-${Math.random()}`
      }
    });
  };

  // Xử lý upload files
  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    
    for (const file of files) {
      setProcessingFile(file.name);
      
      try {
        const fileType = getFileType(file.name);
        
        if (fileType === 'docs' || fileType === 'txt') {
          // Sử dụng function mới để parse file
          const result = await parseFile(file);
          
          if (!result.success) {
            const errorMessage = `File ${file.name} có lỗi định dạng:\n\n${result.error}\n\nHướng dẫn sử dụng file:\n1. Sử dụng font đơn giản (Times New Roman, Arial)\n2. Không sử dụng bullet points, chỉ dùng A. B. C. D.\n3. Không sử dụng màu sắc hoặc định dạng phức tạp\n4. Đánh dấu đáp án đúng bằng dấu *\n5. Xem template-docs.txt để biết định dạng chuẩn`;
            alert(errorMessage);
            continue;
          }
          
          // Chuyển đến trang chỉnh sửa
          navigate('/edit-quiz', {
            state: {
              questions: result.questions,
              fileName: file.name,
              fileId: `file-${Date.now()}-${Math.random()}`
            }
          });
          return; // Dừng xử lý các file khác
        }
        
        // Xử lý các loại file khác (JSON và các file khác)
        const content = await readFileContent(file);
        const newFile: UploadedFile = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: fileType,
          size: file.size,
          uploadedAt: new Date(),
          content: content
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
        
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
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Không thể đọc file'));
      reader.readAsText(file);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Left Section - 70% */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Tạo lớp học mới
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Tải lên tài liệu để tạo bài trắc nghiệm cho lớp học của bạn
            </p>
          </div>

          {/* Manual Quiz Creation */}
          <div className="card p-6">
            <div className="p-6 text-center">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Làm Quiz thủ công
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Tạo Quiz thủ công bằng cách nhập câu hỏi và đáp án trực tiếp
                  </p>
                  
                  <button
                    onClick={handleCreateManualQuiz}
                    className="btn-primary"
                  >
                    Tạo bài trắc nghiệm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">hoặc</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Upload Area */}
          <div className="card p-8">
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
                     Kéo thả file vào đây hoặc click để chọn file
                   </h3>
                                     <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Hỗ trợ file .txt, .json, .doc, .docx
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
                          {(file.size / 1024).toFixed(1)} KB • {file.uploadedAt.toLocaleDateString('vi-VN')}
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

        {/* Right Section - 30% */}
        <div className="w-1/3">
          {/* Hướng dẫn */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
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
                <p className="text-xs">• Đảm bảo định dạng: ID: 1, Câu 1:, A. B. C. D.</p>
              </div>
            </div>
          </div>

          {/* Preview Format */}
          <div className="card p-6">
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
              <p>• Dấu * = đáp án đúng</p>
              <p>• ID: số thứ tự câu hỏi</p>
              <p>• A. B. C. D. = các đáp án</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClassPage; 