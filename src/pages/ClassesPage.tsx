import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClassRoom, Quiz } from '../types';
import { buildShortId, isShortIdCode } from '../utils/share';

const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Share modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<{ type: 'class' | 'quiz'; id: string } | null>(null);

  // Import modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importType, setImportType] = useState<'auto' | 'class' | 'quiz'>('auto');

  // Hàm xóa lớp học
  const handleDeleteClass = async (classId: string, className: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa lớp học "${className}"?\n\nLưu ý: Tất cả bài kiểm tra trong lớp học này cũng sẽ bị xóa.`)) {
      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) {
          alert('Vui lòng đăng nhập để thực hiện thao tác.');
          return;
        }
        const { ClassesAPI } = await import('../utils/api');
        await ClassesAPI.remove(classId, token);
        setClasses(prev => prev.filter(cls => cls.id !== classId));
        alert(`Đã xóa lớp học "${className}" thành công!`);
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Có lỗi xảy ra khi xóa lớp học. Vui lòng thử lại.');
      }
    }
  };

  // Hàm xóa quiz khỏi lớp học
  const handleDeleteQuiz = async (classId: string, quizId: string, quizTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài kiểm tra "${quizTitle}"?`)) {
      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) {
          alert('Vui lòng đăng nhập để thực hiện thao tác.');
          return;
        }
        const { QuizzesAPI } = await import('../utils/api');
        await QuizzesAPI.remove(quizId, token);
        // Cập nhật state cục bộ
        setClasses(prev => prev.map(cls => {
          if (cls.id === classId) {
            return {
              ...cls,
              quizzes: (cls.quizzes as Quiz[])?.filter(quiz => quiz.id !== quizId) || []
            };
          }
          return cls;
        }));
        alert(`Đã xóa bài kiểm tra "${quizTitle}" thành công!`);
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Có lỗi xảy ra khi xóa bài kiểm tra. Vui lòng thử lại.');
      }
    }
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (classId: string) => {    
    if (openDropdown === classId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(classId);
    }
  };

// Toggle public for class
  const handleToggleClassPublic = async (classId: string, current: boolean) => {
    if (!window.confirm(`Bạn có chắc muốn đặt lớp học ở trạng thái ${current ? 'Riêng tư' : 'Công khai'}?`)) return;
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (!token) { alert('Vui lòng đăng nhập'); return; }
      const { ClassesAPI, QuizzesAPI } = await import('../utils/api');
      const updated = await ClassesAPI.update(classId, { isPublic: !current }, token);

      // When class public/private toggled, sync all quizzes' published accordingly
      const target = classes.find(c => c.id === classId);
      const quizzes = (target?.quizzes as Quiz[]) || [];
      await Promise.all(quizzes.map(q => QuizzesAPI.update((q as any).id, { published: !current }, token).catch(() => null)));

      setClasses(prev => prev.map(c =>
        c.id === classId
          ? {
              ...c,
              isPublic: updated?.isPublic ?? !current,
              quizzes: c.quizzes ? (c.quizzes as Quiz[]).map(q => ({ ...q, published: !current } as any)) : c.quizzes,
              updatedAt: updated?.updatedAt ? new Date(updated.updatedAt) : new Date(),
            }
          : c
      ));
      alert(!current ? 'Đã đặt công khai lớp học' : 'Đã đặt riêng tư lớp học');
    } catch (e) {
      console.error('toggle public failed', e);
      alert('Không thể cập nhật công khai');
    }
  };

  const handleShareClass = (classId: string) => {
    setShareData({ type: 'class', id: classId });
    setShareOpen(true);
  };

  const handleShareQuiz = (quizId: string) => {
    setShareData({ type: 'quiz', id: quizId });
    setShareOpen(true);
  };

// Toggle publish for quiz (does NOT affect class public/private)
  const handleToggleQuizPublished = async (quizId: string, current: boolean) => {
    if (!window.confirm(`Bạn có chắc muốn đặt quiz ở trạng thái ${current ? 'Nháp (riêng tư)' : 'Công khai'}?`)) return;
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (!token) { alert('Vui lòng đăng nhập'); return; }
      const { QuizzesAPI } = await import('../utils/api');
      const updated = await QuizzesAPI.update(quizId, { published: !current }, token);

      setClasses(prev => prev.map(cls => ({
        ...cls,
        quizzes: (cls.quizzes as Quiz[])?.map(q => (q && (q as any).id === quizId ? { ...q, ...(updated || {}), updatedAt: new Date() } : q))
      })));
      alert(!current ? 'Đã xuất bản quiz' : 'Đã đặt quiz ở trạng thái nháp');
    } catch (e) {
      console.error('toggle publish failed', e);
      alert('Không thể cập nhật trạng thái quiz');
    }
  };

  // Helper: get valid quizzes in a class
  const getValidQuizzes = (classRoom: ClassRoom): Quiz[] => {
    if (!classRoom.quizzes) return [];
    const quizzes = classRoom.quizzes as Quiz[];
    const validQuizzes = quizzes.filter(quiz => quiz && (quiz as any).id && (quiz as any).title);
    return validQuizzes;
  };

// Fetch classes helper
  const loadMyClasses = async () => {
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (!token) {
        setClasses([]);
        setLoading(false);
        return;
      }
      const { ClassesAPI, QuizzesAPI } = await import('../utils/api');
      const myClasses = await ClassesAPI.listMine(token);
      const withQuizzes: ClassRoom[] = [] as any;
      for (const cls of myClasses) {
        const quizzes = await QuizzesAPI.byClass(cls.id, token);
        withQuizzes.push({
          id: cls.id,
          name: cls.name,
          description: cls.description,
          isPublic: cls.isPublic,
          quizzes: quizzes.map((q: any) => ({
            ...q,
            createdAt: new Date(q.createdAt),
            updatedAt: new Date(q.updatedAt),
          })),
          createdAt: new Date(cls.createdAt),
          updatedAt: cls.updatedAt ? new Date(cls.updatedAt) : undefined,
        } as unknown as ClassRoom);
      }
      setClasses(withQuizzes);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy dữ liệu từ backend
  useEffect(() => {
    (async () => {
      await loadMyClasses();
    })();
  }, []);

  // Handle click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const buildShareLink = (type: 'class' | 'quiz', id: string) =>
    `${window.location.origin}/${type === 'class' ? 'class' : 'quiz'}/${id}`;

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard?.writeText(text); } catch {}
  };

  const handleImport = async () => {
    const raw = importInput.trim();
    if (!raw) { alert('Vui lòng nhập ID hoặc Link'); return; }
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (!token) { alert('Vui lòng đăng nhập'); return; }
      const { ClassesAPI, QuizzesAPI } = await import('../utils/api');

      const extractId = (val: string, kind: 'class'|'quiz') => {
        const marker = `/${kind}/`;
        const idx = val.indexOf(marker);
        if (idx >= 0) return val.substring(idx + marker.length).split(/[?#/]/)[0];
        return val;
      };

      let usedType: 'class'|'quiz'|null = null;
      let payload: { classId?: string; quizId?: string } = {};

      if (isShortIdCode(raw)) {
        // Resolve short code by scanning public (and mine as fallback)
        const mine = await ClassesAPI.listMine(token).catch(() => []);
        const pub = await ClassesAPI.listPublic(token).catch(() => []);
        const all = [...pub, ...mine];
        let foundClassId: string | null = null;
        for (const c of all) {
          if (buildShortId(c.id) === raw) { foundClassId = c.id; break; }
        }
        if (foundClassId) {
          payload.classId = foundClassId;
          usedType = 'class';
        } else {
          // search quizzes under classes
          for (const c of all) {
            const qzs = await QuizzesAPI.byClass(c.id, token).catch(() => []);
            const matched = qzs.find((q: any) => buildShortId(q.id) === raw);
            if (matched) { payload.quizId = matched.id; usedType = 'quiz'; break; }
          }
        }
      } else if (importType === 'class' || (importType === 'auto' && /\/class\//.test(raw))) {
        payload.classId = extractId(raw, 'class');
        usedType = 'class';
      } else if (importType === 'quiz' || (importType === 'auto' && /\/quiz\//.test(raw))) {
        payload.quizId = extractId(raw, 'quiz');
        usedType = 'quiz';
      } else {
        // Unknown format, try quiz then class
        try {
          await ClassesAPI.import({ quizId: raw }, token);
          usedType = 'quiz';
        } catch {
          await ClassesAPI.import({ classId: raw }, token);
          usedType = 'class';
        }
      }

      if (usedType && (payload.classId || payload.quizId)) {
        await ClassesAPI.import(payload, token);
      }

      alert('Đã nhập thành công');
      setImportOpen(false);
      setImportInput('');
      setImportType('auto');
      setLoading(true);
      await loadMyClasses();
    } catch (e: any) {
      console.error('Import failed', e);
      alert('Không thể nhập. Vui lòng kiểm tra ID/Link và thử lại.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile: Statistics Box First */}
      <div className="lg:hidden mb-6">
        <div className="card p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Thống kê học tập
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Số lượng lớp học:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{classes.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Số lượng bài kiểm tra:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {classes.reduce((total, cls) => total + getValidQuizzes(cls).length, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Đã hoàn thành:</span>
              <span className="font-semibold text-green-600">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Điểm trung bình:</span>
              <span className="font-semibold text-blue-600">0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Left Section - Main Content */}
        <div className="flex-1 order-1">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">
              Lớp học của tôi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              Chọn lớp học để bắt đầu làm bài trắc nghiệm
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 mb-6">
            <button
              onClick={() => setImportOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 border border-sky-300 shadow-sm hover:shadow-md transition-all duration-300"
              title="Nhập ID/Link lớp học hoặc quiz"
            >
              Nhập ID/Link
            </button>
          </div>

          {loading ? (
            // Loading skeleton
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : classes.length > 0 ? (
            // Danh sách lớp học
            <div className="space-y-6">
              {classes.map((classRoom: ClassRoom) => {
                const validQuizzes = getValidQuizzes(classRoom);
                const quizCount = validQuizzes.length;
                
                return (
                  <div 
                    key={classRoom.id} 
                    className={`card p-6 relative ${openDropdown === classRoom.id ? 'z-50' : 'z-0'}`}
                  >
                    {/* Desktop Layout - flex ngang */}
                    <div className="hidden sm:flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {classRoom.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {classRoom.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>Tạo ngày: {classRoom.createdAt.toLocaleDateString('vi-VN')}</span>
                          <span className="mx-2">•</span>
                          <span>{quizCount} bài kiểm tra</span>
                        </div>
                      </div>
                      
                      {/* Desktop buttons - bên phải */}
                      <div className="flex items-center gap-2">
                        {(() => {
                          if (quizCount > 3) {
                            // Nếu có hơn 3 quiz, hiện dropdown để xem tất cả
                            return (
                              <div className="relative dropdown-container">
                                <button 
                                  className="btn-primary flex items-center"
                                  onClick={() => handleDropdownToggle(classRoom.id)}
                                >
                                  Tham gia ({quizCount})
                                  <svg 
                                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                                      openDropdown === classRoom.id ? 'rotate-180' : ''
                                    }`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                {/* Dropdown Menu - Hiện tất cả quiz */}
                                {openDropdown === classRoom.id && (
                                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                    <div className="p-2">
                                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                        Tất cả bài kiểm tra:
                                      </div>
                                      {validQuizzes.map((quiz) => (
                                        <button
                                          key={quiz.id}
                                          onClick={() => {
                                            navigate(`/quiz/${quiz.id}`);
                                            setOpenDropdown(null);
                                          }}
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                                        >
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            {quiz.title}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {quiz.questions.length} câu hỏi
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          } else if (quizCount >= 1) {
                            // Có từ 1-3 quiz
                            if (quizCount === 1) {
                              return (
                                <button 
                                  className="btn-primary"
                                  onClick={() => {
                                    const firstQuiz = validQuizzes[0];
                                    navigate(`/quiz/${firstQuiz.id}`);
                                  }}
                                >
                                  Tham gia
                                </button>
                              );
                            } else {
                              return (
                                <div className="relative dropdown-container">
                                  <button 
                                    className="btn-primary flex items-center"
                                    onClick={() => handleDropdownToggle(classRoom.id)}
                                  >
                                    Tham gia ({quizCount})
                                    <svg 
                                      className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                                        openDropdown === classRoom.id ? 'rotate-180' : ''
                                      }`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {/* Dropdown Menu */}
                                  {openDropdown === classRoom.id && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                      <div className="p-2">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                          Tất cả bài kiểm tra:
                                        </div>
                                        {validQuizzes.map((quiz) => (
                                          <button
                                            key={quiz.id}
                                            onClick={() => {
                                              navigate(`/quiz/${quiz.id}`);
                                              setOpenDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                                          >
                                            <div className="font-medium text-gray-900 dark:text-white">
                                              {quiz.title}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              {quiz.questions.length} câu hỏi
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          } else {
                            // Không có quiz nào
                            return (
                              <button className="btn-primary" disabled>
                                Chưa có bài tập
                              </button>
                            );
                          }
                        })()}
                        
<button
                          onClick={() => handleShareClass(classRoom.id)}
                          className="btn-secondary !bg-purple-100 !text-purple-700 hover:!bg-purple-200 dark:!bg-purple-900/20 dark:!text-purple-300 dark:hover:!bg-purple-900/40"
                          title="Chia sẻ lớp học"
                        >
                          {/* Unified Share Icon */}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                          </svg>
                        </button>
      <button
                          onClick={() => handleToggleClassPublic(classRoom.id, Boolean(classRoom.isPublic))}
                          className="btn-secondary !bg-green-100 !text-green-700 hover:!bg-green-200 dark:!bg-green-900/20 dark:!text-green-300 dark:hover:!bg-green-900/40"
                          title="Công khai/ Riêng tư lớp học"
                        >
                          {/* Public vs Private Icon */}
                          {classRoom.isPublic ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14v10H5z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/edit-class/${classRoom.id}`, { state: { classRoom } })}
                          className="btn-secondary !bg-blue-100 !text-blue-700 hover:!bg-blue-200 dark:!bg-yellow-900/20 dark:!text-yellow-400 dark:hover:!bg-yellow-900/40"
                          title="Chỉnh sửa lớp học"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17.25V21h3.75l11.06-11.06a2.121 2.121 0 10-3-3L3 17.25z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClass(classRoom.id, classRoom.name)}
                          className="btn-secondary !bg-red-100 !text-red-700 hover:!bg-red-200 dark:!bg-red-900/20 dark:!text-red-400 dark:hover:!bg-red-900/40"
                          title="Xóa lớp học"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mobile Layout - flex dọc, nút xóa cùng hàng với Vào lớp */}
                    <div className="sm:hidden mb-4">
                      <div className="pr-8">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {classRoom.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {classRoom.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <span>Tạo ngày: {classRoom.createdAt.toLocaleDateString('vi-VN')}</span>
                          <span className="mx-2">•</span>
                          <span>{quizCount} bài kiểm tra</span>
                        </div>
                      </div>
{/* Mobile buttons - Vào lớp và Xóa lớp cùng hàng */}
                      <div className="flex flex-row gap-2 mt-2">
                        {(() => {
                          if (quizCount > 3) {
                            return (
                              <div className="relative dropdown-container flex-1">
                                <button
                                  className="btn-primary flex items-center justify-center w-full"
                                  onClick={() => handleDropdownToggle(classRoom.id)}
                                >
                                  Tham gia ({quizCount})
                                  <svg
                                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                                      openDropdown === classRoom.id ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                {/* Dropdown Menu - Hiện tất cả quiz (mobile) */}
                                {openDropdown === classRoom.id && (
                                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                    <div className="p-2">
                                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                        Tất cả bài kiểm tra:
                                      </div>
                                      {validQuizzes.map((quiz) => (
                                        <button
                                          key={quiz.id}
                                          onClick={() => {
                                            navigate(`/quiz/${quiz.id}`);
                                            setOpenDropdown(null);
                                          }}
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                                        >
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            {quiz.title}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {quiz.questions.length} câu hỏi
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          } else if (quizCount >= 1) {
                            if (quizCount === 1) {
                              return (
                                <button
                                  className="btn-primary flex-1"
                                  onClick={() => {
                                    const firstQuiz = validQuizzes[0];
                                    navigate(`/quiz/${firstQuiz.id}`);
                                  }}
                                >
                                  Tham gia
                                </button>
                              );
                            } else {
                              // 2-3 quiz
                              return (
                                <div className="relative dropdown-container flex-1">
                                  <button
                                    className="btn-primary flex items-center justify-center w-full"
                                    onClick={() => handleDropdownToggle(classRoom.id)}
                                  >
                                    Tham gia ({quizCount})
                                    <svg
                                      className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                                        openDropdown === classRoom.id ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {openDropdown === classRoom.id && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-stone-300 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                      <div className="p-2">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                          Tất cả bài kiểm tra:
                                        </div>
                                        {validQuizzes.map((quiz) => (
                                          <button
                                            key={quiz.id}
                                            onClick={() => {
                                              navigate(`/quiz/${quiz.id}`);
                                              setOpenDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                                          >
                                            <div className="font-medium text-gray-900 dark:text-white">
                                              {quiz.title}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              {quiz.questions.length} câu hỏi
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          } else {
                            return (
                              <button className="btn-primary flex-1" disabled>
                                Chưa có bài tập
                              </button>
                            );
                          }
                        })()}
{/* Nút chia sẻ & công khai cho mobile */}
                        <button
                          onClick={() => handleShareClass(classRoom.id)}
                          className="w-9 h-9 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden"
                          title="Chia sẻ lớp học"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleClassPublic(classRoom.id, Boolean(classRoom.isPublic))}
                          className="w-9 h-9 rounded bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden"
                          title="Công khai / Riêng tư"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a8 8 0 10-14.8 0" />
                          </svg>
                        </button>
                        {/* Nút chỉnh sửa & xóa lớp học - mobile */}
                        <button
                          onClick={() => navigate(`/edit-class/${classRoom.id}`, { state: { classRoom } })}
                          className="w-9 h-9 rounded bg-blue-100 hover:bg-blue-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 text-blue-700 dark:text-yellow-400 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden"
                          title="Chỉnh sửa lớp học"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17.25V21h3.75l11.06-11.06a2.121 2.121 0 10-3-3L3 17.25z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClass(classRoom.id, classRoom.name)}
                          className="w-9 h-9 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden"
                          title="Xóa lớp học"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Danh sách bài kiểm tra - scrollable toàn bộ */}
                    {quizCount > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Bài kiểm tra trong lớp:
                        </h4>
                        <div
                          className="space-y-2 max-h-72 overflow-y-auto pr-2 quiz-scrollbar-container"
                          style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#d1d5db #f3f4f6', // gray-300 thumb, gray-100 track
                          }}
                        >
                          {validQuizzes.map((quiz) => (
                            <div
                              key={quiz.id}
                              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg relative"
                            >
                              {/* Desktop Layout cho quiz items */}
                              <div className="hidden sm:flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {quiz.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {quiz.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/quiz/${quiz.id}`}
                                    className="btn-secondary text-sm"
                                  >
                                    Làm bài
                                  </Link>
<button
                                    onClick={() => handleShareQuiz(quiz.id)}
                                    className="text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200 p-1"
                                    title="Chia sẻ"
                                  >
                                    {/* Unified Share Icon */}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleToggleQuizPublished(quiz.id, Boolean((quiz as any).published))}
                                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1"
                                    title="Công khai / Riêng tư"
                                  >
                                    {/* Public vs Private Icon */}
                                    {(quiz as any).published ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14v10H5z" />
                                      </svg>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => navigate('/edit-quiz', { state: {
                                      questions: quiz.questions,
                                      fileName: quiz.title,
                                      fileId: quiz.id,
                                      quizTitle: quiz.title,
                                      quizDescription: quiz.description,
                                      isEdit: true
                                    } })}
                                    className="text-blue-600 hover:text-blue-700 dark:text-yellow-400 dark:hover:text-yellow-300 p-1"
                                    title="Chỉnh sửa bài kiểm tra"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17.25V21h3.75l11.06-11.06a2.121 2.121 0 10-3-3L3 17.25z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuiz(classRoom.id, quiz.id, quiz.title)}
                                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                    title="Xóa bài kiểm tra"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

{/* Mobile Layout cho quiz items - nút Làm bài và xóa cùng hàng */}
                              <div className="sm:hidden">
                                <p className="font-medium text-gray-900 dark:text-white mb-1">
                                  {quiz.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {quiz.description}
                                </p>
<div className="flex flex-row gap-2">
                                  <Link
                                    to={`/quiz/${quiz.id}`}
                                    className="btn-secondary text-sm text-center w-full"
                                  >
                                    Làm bài
                                  </Link>
                                  <button
                                    onClick={() => handleShareQuiz(quiz.id)}
                                    className="w-9 h-9 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    title="Chia sẻ"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleToggleQuizPublished(quiz.id, Boolean((quiz as any).published))}
                                    className="w-9 h-9 rounded bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    title="Công khai / Riêng tư"
                                  >
                                    {(quiz as any).published ? (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14v10H5z" />
                                      </svg>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => navigate('/edit-quiz', { state: {
                                      questions: quiz.questions,
                                      fileName: quiz.title,
                                      fileId: quiz.id,
                                      quizTitle: quiz.title,
                                      quizDescription: quiz.description,
                                      isEdit: true
                                    } })}
                                    className="w-9 h-9 rounded bg-blue-100 hover:bg-blue-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 text-blue-700 dark:text-yellow-400 flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    title="Chỉnh sửa bài kiểm tra"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17.25V21h3.75l11.06-11.06a2.121 2.121 0 10-3-3L3 17.25z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuiz(classRoom.id, quiz.id, quiz.title)}
                                    className="w-9 h-9 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all duration-200 hover:scale-110"
                                    title="Xóa bài kiểm tra"
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty state
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Chưa có lớp học nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Tạo lớp học đầu tiên để bắt đầu
              </p>
              <Link to="/create" className="btn-primary">
                Tạo lớp học mới
              </Link>
            </div>
          )}
        </div>

        {/* Right Section - Desktop Only (Statistics + Guidance) */}
        <div className="hidden lg:block lg:w-1/3 order-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Thống kê học tập
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Số lượng lớp học:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {classes.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Số lượng bài kiểm tra:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {classes.reduce((total, cls) => total + getValidQuizzes(cls).length, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Đã hoàn thành:</span>
                <span className="font-semibold text-green-600">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Điểm trung bình:</span>
                <span className="font-semibold text-blue-600">0</span>
              </div>
            </div>
          </div>

          {/* Guidance Box - Desktop Only */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Hướng dẫn
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>• Chọn lớp học để xem danh sách bài kiểm tra</p>
              <p>• Click "Làm bài" để bắt đầu làm  bài tập trắc nghiệm</p>
              <p>• Theo dõi tiến độ học tập của bạn</p>
              <p>• Xóa lớp học hoặc bài kiểm tra nếu không cần thiết</p>
            </div>
          </div>
        </div>
      </div>
      {/* Share Modal */}
      {shareOpen && shareData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chia sẻ {shareData.type === 'class' ? 'lớp học' : 'quiz'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">ID</label>
                <div className="flex gap-2">
                  <input readOnly value={buildShortId(shareData.id)} className="flex-1 input text-gray-900 dark:text-gray-900" />
                  <button className="btn-secondary" onClick={() => copyToClipboard(buildShortId(shareData.id))}>Copy</button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Link</label>
                <div className="flex gap-2">
                  <input readOnly value={buildShareLink(shareData.type, shareData.id)} className="flex-1 input text-gray-900 dark:text-gray-900" />
                  <button className="btn-secondary" onClick={() => copyToClipboard(buildShareLink(shareData.type, shareData.id))}>Copy</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-secondary" onClick={() => { setShareOpen(false); setShareData(null); }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nhập ID/Link lớp học hoặc quiz</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Kiểu</label>
                  <select
                    value={importType}
                    onChange={e => setImportType(e.target.value as any)}
                    className="select w-full text-black"
                  >
                  <option value="auto">Tự động (dựa theo link)</option>
                  <option value="class">Lớp học</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">ID hoặc Link</label>
                <input value={importInput} onChange={e => setImportInput(e.target.value)} placeholder="Ví dụ: https://.../class/abc123 hoặc abc123" className="input w-full text-black" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-secondary" onClick={() => { setImportOpen(false); setImportInput(''); setImportType('auto'); }}>Hủy</button>
              <button className="btn-primary" onClick={handleImport}>Nhập</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
