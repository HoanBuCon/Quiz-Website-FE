import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClassRoom, Quiz } from '../types';
import { buildShortId, isShortIdCode } from '../utils/share';

const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Statistics
  const [statsCompleted, setStatsCompleted] = useState(0);
  const [statsAverage, setStatsAverage] = useState<number>(0);

  // Share modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<{ type: 'class' | 'quiz'; id: string } | null>(null);

  // Import modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [importType, setImportType] = useState<'auto' | 'class' | 'quiz'>('auto');

  // Hàm xóa lớp học
  const handleDeleteClass = async (classId: string, className: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa lớp học "${className}"?\n\nLưu ý: Nếu là lớp được chia sẻ, thao tác này chỉ gỡ lớp khỏi danh sách của bạn.`)) {
      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) { alert('Vui lòng đăng nhập để thực hiện thao tác.'); return; }
        const { ClassesAPI, VisibilityAPI } = await import('../utils/api');
        const cls = classes.find(c => c.id === classId) as any;
        const isShared = cls && cls.accessType === 'shared';
        if (isShared) {
          await VisibilityAPI.removeAccess({ classId }, token);
        } else {
          await ClassesAPI.remove(classId, token);
        }
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
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài kiểm tra "${quizTitle}"?\n\nLưu ý: Nếu là bài được chia sẻ, thao tác này chỉ gỡ khỏi danh sách của bạn.`)) {
      try {
        const { getToken } = await import('../utils/auth');
        const token = getToken();
        if (!token) { alert('Vui lòng đăng nhập để thực hiện thao tác.'); return; }
        const { QuizzesAPI, VisibilityAPI } = await import('../utils/api');
        const host = classes.find(c => c.id === classId) as any;
        const isShared = host && host.accessType === 'shared';
        if (isShared) {
          await VisibilityAPI.removeAccess({ quizId }, token);
        } else {
          await QuizzesAPI.remove(quizId, token);
        }
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
    const newState = !current;
    const message = newState 
      ? 'Bạn có chắc muốn đặt lớp học ở trạng thái Công khai?\n\n✓ Lớp học sẽ được công khai\n✓ TẤT CẢ quiz trong lớp sẽ được công khai\n✓ Sau đó bạn có thể đặt riêng tư từng quiz riêng lẻ'
      : 'Bạn có chắc muốn đặt lớp học ở trạng thái Riêng tư?\n\n✓ Lớp học sẽ được đặt riêng tư\n✓ Các quiz đang CÔNG KHAI sẽ được đặt riêng tư\n✓ Các quiz đã riêng tư sẽ giữ nguyên';
    
    if (!window.confirm(message)) return;
    
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (!token) { alert('Vui lòng đăng nhập'); return; }
      const { VisibilityAPI } = await import('../utils/api');
      
      // Toggle class public state - backend will sync quizzes accordingly
      await VisibilityAPI.publicToggle({ targetType: 'class', targetId: classId, enabled: newState }, token);

      // Reload classes to sync all quiz published states and icons
      setLoading(true);
      await loadMyClasses();
      
      const successMsg = newState 
        ? '✅ Đã đặt công khai lớp học và TẤT CẢ quiz bên trong\n\nBạn có thể đặt riêng tư từng quiz riêng lẻ sau' 
        : '✅ Đã đặt riêng tư lớp học\n\n• Quiz đang công khai → đã chuyển riêng tư\n• Quiz đã riêng tư → giữ nguyên';
      alert(successMsg);
    } catch (e) {
      console.error('toggle public failed', e);
      alert('❌ Không thể cập nhật trạng thái công khai');
    }
  };

  const handleShareClass = async (classId: string) => {
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (token) {
        const { VisibilityAPI } = await import('../utils/api');
        await VisibilityAPI.shareToggle({ targetType: 'class', targetId: classId, enabled: true }, token);
      }
    } catch {}
    setShareData({ type: 'class', id: classId });
    setShareOpen(true);
  };

  const handleShareQuiz = async (quizId: string) => {
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (token) {
        const { VisibilityAPI } = await import('../utils/api');
        await VisibilityAPI.shareToggle({ targetType: 'quiz', targetId: quizId, enabled: true }, token);
      }
    } catch {}
    setShareData({ type: 'quiz', id: quizId });
    setShareOpen(true);
  };

// Toggle publish for quiz: if publishing and class is private -> make class public, but only this quiz is published
  const handleToggleQuizPublished = async (quizId: string, current: boolean) => {
    const newState = !current;
    const message = newState
      ? 'Bạn có chắc muốn đặt quiz ở trạng thái Công khai?\n\n✓ Quiz sẽ được công khai\n✓ Lớp học chứa quiz cũng sẽ được đặt công khai (nếu đang private)\n✓ Các quiz khác trong lớp GIỮ NGUYÊN trạng thái'
      : 'Bạn có chắc muốn đặt quiz ở trạng thái Riêng tư?\n\n✓ CHỈ quiz này sẽ được đặt riêng tư\n✓ Lớp học giữ nguyên trạng thái công khai';
    
    if (!window.confirm(message)) return;
    
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (!token) { alert('Vui lòng đăng nhập'); return; }
      const { VisibilityAPI } = await import('../utils/api');

      // Toggle public state for quiz via visibility API
      await VisibilityAPI.publicToggle({ targetType: 'quiz', targetId: quizId, enabled: newState }, token);

      // Reload classes to sync quiz and class states and update icons
      setLoading(true);
      await loadMyClasses();

      const message = newState 
        ? '✅ Đã xuất bản quiz\n\n• Quiz đã được công khai\n• Lớp học cũng đã được đặt công khai\n• Các quiz khác giữ nguyên trạng thái'
        : '✅ Đã đặt quiz ở trạng thái riêng tư\n\n• Chỉ quiz này được đặt riêng tư\n• Lớp học giữ nguyên công khai';
      alert(message);
    } catch (e) {
      console.error('toggle publish failed', e);
      alert('❌ Không thể cập nhật trạng thái quiz');
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
          accessType: (cls as any).accessType,
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

      // Compute statistics from sessions
      try {
        const { SessionsAPI } = await import('../utils/api');
        let totalDone = 0;
        let totalScore = 0;
        for (const cls of withQuizzes) {
          const quizzes = (cls.quizzes as Quiz[]) || [];
          for (const q of quizzes) {
            const sessions = await SessionsAPI.byQuiz((q as any).id, token).catch(() => []);
            // Assume backend returns only current user's sessions
            totalDone += sessions.length || 0;
            for (const s of sessions) {
              if (typeof s.score === 'number') totalScore += s.score;
            }
          }
        }
        setStatsCompleted(totalDone);
        setStatsAverage(totalDone > 0 ? Math.round((totalScore / totalDone) * 10) / 10 : 0);
      } catch (e) {
        // ignore stats errors
      }
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
      let didImport = false;

      // Fallback: clone from public by frontend if backend import route is unavailable
      const doClientClone = async (kind: 'class'|'quiz', id: string) => {
        const { ClassesAPI, QuizzesAPI } = await import('../utils/api');
        const sanitize = (raw: string, kindHint: 'class'|'quiz') => {
          if (!raw) return raw;
          if (raw.startsWith('http')) {
            const marker = kindHint === 'class' ? '/class/' : '/quiz/';
            const idx = raw.indexOf(marker);
            if (idx >= 0) return raw.substring(idx + marker.length).split(/[?#/]/)[0];
          }
          return raw;
        };
        const normId = sanitize(id, kind);
        // Load all public classes to find source
        const mine = await ClassesAPI.listMine(token).catch(() => []);
        const pub = await ClassesAPI.listPublic(token).catch(() => []);
        const all = [...pub, ...mine];

        if (kind === 'class') {
          const src = all.find((c: any) => c.id === normId);
          // Fetch quizzes of source class even if class meta not found in lists
          const qzs = await QuizzesAPI.byClass(src ? src.id : normId, token).catch(() => []);
          if (!src && (!qzs || qzs.length === 0)) throw new Error('Không tìm thấy lớp học nguồn');
          // Create new class under current user (private)
          const { ClassesAPI: CAPI } = await import('../utils/api');
          const created = await CAPI.create({ name: (src?.name) || 'Lớp đã nhập', description: (src?.description) || '', isPublic: false }, token);
          // Clone quizzes (private)
          for (const q of qzs) {
            await QuizzesAPI.create({
              classId: created.id,
              title: q.title,
              description: q.description || '',
              questions: q.questions || [],
              published: false,
            }, token).catch(() => null);
          }
          didImport = true;
        } else {
          // kind === 'quiz'
          // Use new API to get quiz directly by ID (supports published quizzes)
          const quizData = await QuizzesAPI.getById(normId, token).catch(() => null);
          if (!quizData) throw new Error('Không tìm thấy quiz nguồn hoặc quiz chưa xuất bản');
          
          // Create new class under current user (private)
          const className = quizData.class?.name || 'Lớp đã nhập';
          const classDesc = quizData.class?.description || '';
          const created = await ClassesAPI.create({ name: className, description: classDesc, isPublic: false }, token);
          
          // Clone only this quiz (private)
          await QuizzesAPI.create({
            classId: created.id,
            title: quizData.title,
            description: quizData.description || '',
            questions: quizData.questions || [],
            published: false,
          }, token);
          didImport = true;
        }
      };

      const rawUpper = raw.toUpperCase();
      if (isShortIdCode(rawUpper)) {
        // Resolve short code by scanning public, mine, and shared items
        const mine = await ClassesAPI.listMine(token).catch(() => []);
        const pub = await ClassesAPI.listPublic(token).catch(() => []);
        const { VisibilityAPI } = await import('../utils/api');
        const sharedClasses = await VisibilityAPI.listSharedClasses(token).catch(() => []);
        const sharedQuizzes = await VisibilityAPI.listSharedQuizzes(token).catch(() => []);
        
        const allClasses = [...pub, ...mine, ...sharedClasses];
        let foundClassId: string | null = null;
        for (const c of allClasses) {
          if (buildShortId(c.id).toUpperCase() === rawUpper) { foundClassId = c.id; break; }
        }
        if (foundClassId) {
          payload.classId = foundClassId;
          usedType = 'class';
        } else {
          // search quizzes under classes
          for (const c of allClasses) {
            const qzs = await QuizzesAPI.byClass(c.id, token).catch(() => []);
            const matched = qzs.find((q: any) => buildShortId(q.id).toUpperCase() === rawUpper);
            if (matched) { payload.quizId = matched.id; usedType = 'quiz'; break; }
          }
          // also check shared quizzes directly
          if (!usedType) {
            const matched = sharedQuizzes.find((q: any) => buildShortId(q.id).toUpperCase() === rawUpper);
            if (matched) { payload.quizId = matched.id; usedType = 'quiz'; }
          }
        }
        if (!usedType) throw new Error('Không tìm thấy nội dung với mã này');
      } else if (importType === 'class' || (importType === 'auto' && /\/class\//.test(raw))) {
        const idPart = extractId(raw, 'class');
        if (isShortIdCode(idPart.toUpperCase())) {
          // treat as short code embedded in link
          const mine = await ClassesAPI.listMine(token).catch(() => []);
          const pub = await ClassesAPI.listPublic(token).catch(() => []);
          const { VisibilityAPI } = await import('../utils/api');
          const sharedClasses = await VisibilityAPI.listSharedClasses(token).catch(() => []);
          const all = [...pub, ...mine, ...sharedClasses];
          const code = idPart.toUpperCase();
          let found: string | null = null;
          for (const c of all) { if (buildShortId(c.id).toUpperCase() === code) { found = c.id; break; } }
          if (found) { payload.classId = found; usedType = 'class'; }
          else throw new Error('Không tìm thấy lớp học với mã này');
        } else {
          payload.classId = idPart;
          usedType = 'class';
        }
      } else if (importType === 'quiz' || (importType === 'auto' && /\/quiz\//.test(raw))) {
        const idPart = extractId(raw, 'quiz');
        if (isShortIdCode(idPart.toUpperCase())) {
          const mine = await ClassesAPI.listMine(token).catch(() => []);
          const pub = await ClassesAPI.listPublic(token).catch(() => []);
          const { VisibilityAPI } = await import('../utils/api');
          const sharedClasses = await VisibilityAPI.listSharedClasses(token).catch(() => []);
          const sharedQuizzes = await VisibilityAPI.listSharedQuizzes(token).catch(() => []);
          const all = [...pub, ...mine, ...sharedClasses];
          const code = idPart.toUpperCase();
          let found: string | null = null;
          outer: for (const c of all) {
            const qzs = await QuizzesAPI.byClass(c.id, token).catch(() => []);
            for (const q of qzs) { if (buildShortId(q.id).toUpperCase() === code) { found = q.id; break outer; } }
          }
          // also check shared quizzes directly
          if (!found) {
            const matched = sharedQuizzes.find((q: any) => buildShortId(q.id).toUpperCase() === code);
            if (matched) found = matched.id;
          }
          if (found) { payload.quizId = found; usedType = 'quiz'; }
          else throw new Error('Không tìm thấy quiz với mã này');
        } else {
          payload.quizId = idPart;
          usedType = 'quiz';
        }
      } else {
        // Unknown format, try quiz then class (one-shot)
        try {
          await ClassesAPI.import({ quizId: raw }, token);
          didImport = true;
        } catch {
          await ClassesAPI.import({ classId: raw }, token);
          didImport = true;
        }
      }

      if (!didImport && usedType && (payload.classId || payload.quizId)) {
        try {
          const { VisibilityAPI } = await import('../utils/api');
          await VisibilityAPI.claim(payload as any, token);
          didImport = true;
        } catch (err: any) {
          try {
            await ClassesAPI.import(payload, token);
            didImport = true;
          } catch (err2: any) {
            // Backend route missing -> fallback to client clone
            if (usedType === 'class' && payload.classId) {
              await doClientClone('class', payload.classId);
              didImport = true;
            } else if (usedType === 'quiz' && payload.quizId) {
              await doClientClone('quiz', payload.quizId);
              didImport = true;
            } else {
              throw err2;
            }
          }
        }
      }

      if (!didImport) throw new Error('Không thể nhập. Vui lòng kiểm tra ID/Link và thử lại.');

      alert('Đã nhập thành công');
      setImportOpen(false);
      setImportInput('');
      setImportType('auto');
      setLoading(true);
      await loadMyClasses();
    } catch (e: any) {
      console.error('Import failed', e);
      alert(e?.message || 'Không thể nhập. Vui lòng kiểm tra ID/Link và thử lại.');
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
              <span className="font-semibold text-green-600">{statsCompleted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Điểm trung bình:</span>
              <span className="font-semibold text-blue-600">{statsAverage}</span>
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
                          disabled={(classRoom as any).accessType === 'shared'}
                          className={`btn-secondary !bg-purple-100 !text-purple-700 hover:!bg-purple-200 dark:!bg-purple-900/20 dark:!text-purple-300 dark:hover:!bg-purple-900/40 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Chia sẻ lớp học"
                        >
                          {/* Unified Share Icon */}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleClassPublic(classRoom.id, Boolean(classRoom.isPublic))}
                          disabled={(classRoom as any).accessType === 'shared'}
                          className={`btn-secondary !bg-green-100 !text-green-700 hover:!bg-green-200 dark:!bg-green-900/20 dark:!text-green-300 dark:hover:!bg-green-900/40 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={`Trạng thái: ${classRoom.isPublic ? 'Công khai' : 'Riêng tư'}\n\nNhấn để ${classRoom.isPublic ? 'đặt riêng tư' : 'công khai'} lớp học và tất cả quiz`}
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
                          disabled={(classRoom as any).accessType === 'shared'}
                          className={`btn-secondary !bg-blue-100 !text-blue-700 hover:!bg-blue-200 dark:!bg-yellow-900/20 dark:!text-yellow-400 dark:hover:!bg-yellow-900/40 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                          disabled={(classRoom as any).accessType === 'shared'}
                          className={`w-9 h-9 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Chia sẻ lớp học"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleClassPublic(classRoom.id, Boolean(classRoom.isPublic))}
                          disabled={(classRoom as any).accessType === 'shared'}
                          className={`w-9 h-9 rounded bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={`${classRoom.isPublic ? 'Công khai' : 'Riêng tư'}`}
                        >
                          {classRoom.isPublic ? (
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
                        {/* Nút chỉnh sửa & xóa lớp học - mobile */}
                        <button
                          onClick={() => navigate(`/edit-class/${classRoom.id}`, { state: { classRoom } })}
                          disabled={(classRoom as any).accessType === 'shared'}
                          className={`w-9 h-9 rounded bg-blue-100 hover:bg-blue-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 text-blue-700 dark:text-yellow-400 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                    disabled={(classRoom as any).accessType === 'shared'}
                                    className={`text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200 p-1 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Chia sẻ"
                                  >
                                    {/* Unified Share Icon */}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleToggleQuizPublished(quiz.id, Boolean((quiz as any).published))}
                                    disabled={(classRoom as any).accessType === 'shared'}
                                    className={`text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={`Trạng thái: ${(quiz as any).published ? 'Công khai' : 'Nháp (Riêng tư)'}\n\nNhấn để ${(quiz as any).published ? 'đặt nháp' : 'công khai quiz'}`}
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
                                    disabled={(classRoom as any).accessType === 'shared'}
                                    className={`text-blue-600 hover:text-blue-700 dark:text-yellow-400 dark:hover:text-yellow-300 p-1 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                    disabled={(classRoom as any).accessType === 'shared'}
                                    className={`w-9 h-9 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center transition-all duration-200 hover:scale-110 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Chia sẻ"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleToggleQuizPublished(quiz.id, Boolean((quiz as any).published))}
                                    disabled={(classRoom as any).accessType === 'shared'}
                                    className={`w-9 h-9 rounded bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center justify-center transition-all duration-200 hover:scale-110 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={`${(quiz as any).published ? 'Công khai' : 'Nháp'}`}
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
                                    disabled={(classRoom as any).accessType === 'shared'}
                                    className={`w-9 h-9 rounded bg-blue-100 hover:bg-blue-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 text-blue-700 dark:text-yellow-400 flex items-center justify-center transition-all duration-200 hover:scale-110 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <span className="font-semibold text-green-600">{statsCompleted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Điểm trung bình:</span>
                <span className="font-semibold text-blue-600">{statsAverage}</span>
              </div>
            </div>
          </div>

          {/* Guidance Box - Desktop Only */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Hướng dẫn
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4" />
                </svg>
                <span>Tạo ID và Link truy cập lớp học và bài tập trắc nghiệm người khác tham gia.</span>
              </div>

              <div className="flex items-center gap-4 mt-1">
                <svg className="w-6 h-6 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Đặt trạng thái Công khai hoặc Riêng tư cho lớp học và bài tập trắc nghiệm.</span>
              </div>

              <div className="flex items-center gap-4 mt-1">
                <svg className="w-6 h-6 text-blue-700 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17.25V21h3.75l11.06-11.06a2.121 2.121 0 10-3-3L3 17.25z" />
                </svg>
                <span>Chỉnh sửa thông tin và nội dung lớp học và bài tập trắc nghiệm.</span>
              </div>

              <div className="flex items-center gap-4 mt-1">
                <svg className="w-6 h-6 text-red-700 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Xóa lớp học và bài tập trắc nghiệm.</span>
              </div>
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
