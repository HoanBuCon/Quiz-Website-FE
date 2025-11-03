import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClassRoom, Quiz } from '../types';
import { buildShortId, isShortIdCode } from '../utils/share';
import { formatDate } from '../utils/fileUtils';
import {
  UserIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

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

  // Share status tracking (classId/quizId -> isShareable)
  const [shareStatus, setShareStatus] = useState<Record<string, boolean>>({});

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
      ? '📢 Đặt Class Public?\n\n✓ Class sẽ Public\n✓ TẤT CẢ Quiz sẽ Public\n✓ Sau đó có thể đặt Private từng Quiz'
      : '🔒 Đặt Class Private?\n\n✓ Class sẽ Private\n✓ Các Quiz Public → Private\n✓ Các Quiz Private → giữ nguyên';
    
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
        ? '✅ Đã Public Class và TẤT CẢ Quiz\n\n💡 Bạn có thể Private từng Quiz sau' 
        : '✅ Đã Private Class\n\n• Quiz Public → Private\n• Quiz Private → giữ nguyên';
      alert(successMsg);
    } catch (e) {
      console.error('toggle public failed', e);
      alert('❌ Không thể cập nhật trạng thái');
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

  // Toggle share for class - GIỐNG LOGIC PUBLIC/PRIVATE
  const handleToggleClassShare = async (classId: string, current: boolean) => {
    const newState = !current;
    const message = newState 
      ? '🔗 Bật chia sẻ Class?\n\n✓ Class có thể chia sẻ\n✓ TẤT CẢ Quiz có thể chia sẻ\n\n🎯 Quy tắc truy cập:\n• Người nhập ID/Link CLASS → truy cập TẤT CẢ Quiz\n• Người nhập ID/Link QUIZ → chỉ truy cập Quiz đó'
      : '🔒 Tắt chia sẻ Class?\n\n✓ Class không thể chia sẻ\n✓ Các Quiz đang chia sẻ → tắt\n✓ Các Quiz đã tắt → giữ nguyên\n\n⚠️ Người đã nhập ID/Link Class sẽ MẤT quyền truy cập';
    
    if (!window.confirm(message)) return;
    
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (!token) { alert('Vui lòng đăng nhập'); return; }
      const { VisibilityAPI } = await import('../utils/api');
      
      // Toggle class share state - backend will sync quizzes accordingly
      await VisibilityAPI.shareToggle({ targetType: 'class', targetId: classId, enabled: newState }, token);

      // Reload classes to sync all quiz share states and icons
      setLoading(true);
      await loadMyClasses();
      
      const successMsg = newState 
        ? '✅ Đã bật chia sẻ Class và TẤT CẢ Quiz\n\n🎯 Quyền truy cập:\n• Nhập ID/Link Class → ALL Quiz\n• Nhập ID/Link Quiz → CHỈ quiz đó' 
        : '✅ Đã tắt chia sẻ Class\n\n• Quiz đang chia sẻ → tắt\n• Quiz đã tắt → giữ nguyên';
      alert(successMsg);
    } catch (e) {
      console.error('toggle share failed', e);
      alert('❌ Không thể cập nhật trạng thái chia sẻ');
    }
  };

  // Toggle share for quiz - GIỐNG LOGIC PUBLIC/PRIVATE
  const handleToggleQuizShare = async (quizId: string, current: boolean) => {
    const newState = !current;
    const message = newState
      ? '🔗 Bật chia sẻ Quiz?\n\n✓ Quiz có thể chia sẻ\n✓ Class có thể chia sẻ (nếu đang tắt)\n✓ Quiz khác GIỮ NGUYÊN\n\n🎯 Quyền truy cập:\n• Người nhập ID/Link QUIZ này → CHỈ Quiz này\n• Người nhập ID/Link Class → TẤT CẢ Quiz'
      : '🔒 Tắt chia sẻ Quiz?\n\n✓ CHỈ Quiz này tắt chia sẻ riêng lẻ\n✓ Class giữ nguyên có thể chia sẻ\n\n⚠️ LƯU Ý:\n• Người đã nhập ID/Link QUIZ này → MẤT quyền ✗\n• Người đã nhập ID/Link CLASS → VẪN truy cập được ✓\n\n💡 Muốn revoke hoàn toàn? Tắt share CLASS!';
    
    if (!window.confirm(message)) return;
    
    try {
      const { getToken } = await import('../utils/auth');
      const token = getToken();
      if (!token) { alert('Vui lòng đăng nhập'); return; }
      const { VisibilityAPI } = await import('../utils/api');

      // Toggle share state for quiz via visibility API
      await VisibilityAPI.shareToggle({ targetType: 'quiz', targetId: quizId, enabled: newState }, token);

      // Reload classes to sync quiz and class states and update icons
      setLoading(true);
      await loadMyClasses();

      const message = newState 
        ? '✅ Đã bật chia sẻ Quiz\n\n🎯 Quyền truy cập:\n• Nhập ID/Link Quiz → CHỈ Quiz này\n• Nhập ID/Link Class → TẤT CẢ Quiz'
        : '✅ Đã tắt chia sẻ Quiz riêng lẻ\n\n⚠️ LƯU Ý:\n• User đã claim Quiz này → MẤT quyền ✗\n• User đã claim Class → VẪN truy cập ✓';
      alert(message);
    } catch (e) {
      console.error('toggle share failed', e);
      alert('❌ Không thể cập nhật trạng thái chia sẻ');
    }
  };

  // Toggle publish for quiz: if publishing and class is private -> make class public, but only this quiz is published
  const handleToggleQuizPublished = async (quizId: string, current: boolean) => {
    const newState = !current;
    const message = newState
      ? '📢 Public Quiz?\n\n✓ Quiz sẽ Public\n✓ Class sẽ Public (nếu đang Private)\n✓ Quiz khác GIỮ NGUYÊN'
      : '🔒 Private Quiz?\n\n✓ CHỈ Quiz này Private\n✓ Class giữ nguyên Public';
    
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
        ? '✅ Đã Public Quiz\n\n• Quiz Public\n• Class Public\n• Quiz khác giữ nguyên'
        : '✅ Đã Private Quiz\n\n• Chỉ Quiz này Private\n• Class giữ Public';
      alert(message);
    } catch (e) {
      console.error('toggle publish failed', e);
      alert('❌ Không thể cập nhật trạng thái');
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
        
        // ===== FILTER: Chỉ thêm class nếu có ít nhất 1 quiz accessible =====
        // Backend đã filter quizzes dựa trên quyền truy cập
        // Nếu user không có quyền truy cập quiz nào → quizzes = []
        // Chỉ hiển thị class nếu:
        // 1. User là owner (luôn thấy tất cả)
        // 2. User có ít nhất 1 quiz accessible
        const isOwner = (cls as any).accessType === 'owner';
        if (!isOwner && quizzes.length === 0) {
          // Skip class này - user không có quyền truy cập quiz nào
          continue;
        }
        
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

      // Load share status for all classes and quizzes
      try {
        const { VisibilityAPI } = await import('../utils/api');
        const statusMap: Record<string, boolean> = {};
        
        for (const cls of withQuizzes) {
          // Check class share status
          const clsStatus = await VisibilityAPI.getShareStatus('class', cls.id, token);
          statusMap[`class_${cls.id}`] = clsStatus.isShareable;
          
          // Check quiz share status
          const quizzes = (cls.quizzes as Quiz[]) || [];
          for (const q of quizzes) {
            const qzStatus = await VisibilityAPI.getShareStatus('quiz', (q as any).id, token);
            statusMap[`quiz_${(q as any).id}`] = qzStatus.isShareable;
          }
        }
        
        setShareStatus(statusMap);
      } catch (e) {
        console.error('Error loading share status:', e);
      }

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
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Hero Section */}
      <div className="mb-8 lg:hidden">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-blue-900 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              Lớp học của tôi
            </h1>
            <p className="text-sm sm:text-base text-blue-100 dark:text-blue-200">
              Chọn lớp học để bắt đầu làm bài trắc nghiệm
            </p>
            
            {/* Stats Mobile */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-8">
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl py-2 px-4 border border-gray-200 dark:border-white/20">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-white mb-1">{classes.length}</div>
                <div className="text-sm text-blue-600 dark:text-blue-100">Lớp học</div>
              </div>
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl py-2 px-4 border border-gray-200 dark:border-white/20">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-white mb-1">
                  {classes.reduce((total, cls) => total + getValidQuizzes(cls).length, 0)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-100">Bài kiểm tra</div>
              </div>
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl py-2 px-4 border border-gray-200 dark:border-white/20">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-white mb-1">{statsCompleted}</div>
                <div className="text-sm text-blue-600 dark:text-blue-100">Đã hoàn thành</div>
              </div>
              <div className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-xl py-2 px-4 border border-gray-200 dark:border-white/20">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-white mb-1">{statsAverage}</div>
                <div className="text-sm text-blue-600 dark:text-blue-100">Điểm TB</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Left Section - Main Content */}
        <div className="lg:w-[70%] min-w-0 order-1">
          {/* Desktop Banner - Only visible on lg and above */}
          <div className="hidden lg:block mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-blue-900 dark:via-slate-900 dark:to-slate-950 p-8 shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
                  Lớp học của tôi
                </h1>
                <p className="text-base text-blue-100 dark:text-blue-200 leading-relaxed">
                  Chọn lớp học để bắt đầu làm bài trắc nghiệm
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-blue-600 dark:text-white bg-white dark:bg-gradient-to-r dark:from-sky-500 dark:to-blue-500 border-2 border-blue-500 dark:border-transparent hover:bg-blue-50 dark:hover:brightness-110 shadow-lg hover:shadow-xl transition-all duration-300"
              title="Nhập ID/Link lớp học hoặc quiz"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nhập ID/Link
            </button>
          </div>

          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : classes.length > 0 ? (
            // Danh sách lớp học
            <div className="space-y-4">
              {classes.map((classRoom: ClassRoom) => {
                const validQuizzes = getValidQuizzes(classRoom);
                const quizCount = validQuizzes.length;
                
                return (
                  <div 
                    key={classRoom.id} 
                    className={`group card p-6 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 border-l-4 border-l-stone-400 dark:border-l-gray-600 hover:border-l-primary-500 dark:hover:border-l-primary-500 relative ${openDropdown === classRoom.id ? 'z-50' : 'z-0'}`}
                  >
                    {/* Desktop Layout - flex ngang */}
                    <div className="hidden sm:flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          {/* Avatar với chữ cái đầu tiên */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {classRoom.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {classRoom.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                              {classRoom.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(classRoom.createdAt)}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {quizCount} bài kiểm tra
                          </span>
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
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
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
                                  <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
                                      <p className="text-sm font-semibold text-white">
                                        Chọn bài kiểm tra
                                      </p>
                                    </div>
                                    <div className="p-2 max-h-80 overflow-y-auto">
                                      {validQuizzes.map((quiz, idx) => (
                                        <button
                                          key={quiz.id}
                                          onClick={() => {
                                            navigate(`/quiz/${quiz.id}`);
                                            setOpenDropdown(null);
                                          }}
                                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200 group"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                                              {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {quiz.title}
                                              </div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {quiz.questions.length} câu hỏi
                                              </div>
                                            </div>
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
                                  className="btn-primary flex items-center"
                                  onClick={() => {
                                    const firstQuiz = validQuizzes[0];
                                    navigate(`/quiz/${firstQuiz.id}`);
                                  }}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
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
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
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
                                    <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
                                        <p className="text-sm font-semibold text-white">
                                          Chọn bài kiểm tra
                                        </p>
                                      </div>
                                      <div className="p-2 max-h-80 overflow-y-auto">
                                        {validQuizzes.map((quiz, idx) => (
                                          <button
                                            key={quiz.id}
                                            onClick={() => {
                                              navigate(`/quiz/${quiz.id}`);
                                              setOpenDropdown(null);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200 group"
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                                                {idx + 1}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                  {quiz.title}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                  {quiz.questions.length} câu hỏi
                                                </div>
                                              </div>
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
                          onClick={() => handleToggleClassShare(classRoom.id, shareStatus[`class_${classRoom.id}`] || false)}
                          disabled={(classRoom as any).accessType === 'shared'}
                          className={`btn-secondary ${
                            shareStatus[`class_${classRoom.id}`] 
                              ? '!bg-purple-500 !text-white hover:!bg-purple-600 dark:!bg-purple-600 dark:hover:!bg-purple-700' 
                              : '!bg-purple-100 !text-purple-700 hover:!bg-purple-200 dark:!bg-purple-900/20 dark:!text-purple-300 dark:hover:!bg-purple-900/40'
                          } ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={`Trạng thái: ${shareStatus[`class_${classRoom.id}`] ? 'Có thể chia sẻ' : 'Không thể chia sẻ'}\n\nNhấn để ${shareStatus[`class_${classRoom.id}`] ? 'tắt' : 'bật'} chia sẻ lớp học`}
                        >
                          {/* Share Toggle Icon */}
                          {shareStatus[`class_${classRoom.id}`] ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M13.5 3c-1.74 0-3.41.81-4.5 2.09C8.91 3.81 7.24 3 5.5 3 2.42 3 0 5.42 0 8.5c0 3.78 3.4 6.86 8.55 11.54L12 23.35l3.45-3.32C20.6 15.36 24 12.28 24 8.5 24 5.42 21.58 3 18.5 3c-1.74 0-3.41.81-4.5 2.09C13.09 3.81 11.42 3 9.5 3z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleShareClass(classRoom.id)}
                          disabled={(classRoom as any).accessType === 'shared' || !shareStatus[`class_${classRoom.id}`]}
                          className={`btn-secondary !bg-indigo-100 !text-indigo-700 hover:!bg-indigo-200 dark:!bg-indigo-900/20 dark:!text-indigo-300 dark:hover:!bg-indigo-900/40 ${((classRoom as any).accessType === 'shared' || !shareStatus[`class_${classRoom.id}`]) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={shareStatus[`class_${classRoom.id}`] ? "Sao chép ID/Link chia sẻ" : "Bật chia sẻ trước để lấy ID/Link"}
                        >
                          {/* Copy Link Icon */}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                        <div className="flex items-start gap-3 mb-3">
                          {/* Avatar với chữ cái đầu tiên */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {classRoom.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {classRoom.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                              {classRoom.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(classRoom.createdAt)}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {quizCount} bài kiểm tra
                          </span>
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
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
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
                                  <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
                                      <p className="text-sm font-semibold text-white">
                                        Chọn bài kiểm tra
                                      </p>
                                    </div>
                                    <div className="p-2 max-h-80 overflow-y-auto">
                                      {validQuizzes.map((quiz, idx) => (
                                        <button
                                          key={quiz.id}
                                          onClick={() => {
                                            navigate(`/quiz/${quiz.id}`);
                                            setOpenDropdown(null);
                                          }}
                                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200 group"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                                              {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {quiz.title}
                                              </div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {quiz.questions.length} câu hỏi
                                              </div>
                                            </div>
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
                                  className="btn-primary flex-1 flex items-center justify-center"
                                  onClick={() => {
                                    const firstQuiz = validQuizzes[0];
                                    navigate(`/quiz/${firstQuiz.id}`);
                                  }}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
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
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
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
                                    <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
                                        <p className="text-sm font-semibold text-white">
                                          Chọn bài kiểm tra
                                        </p>
                                      </div>
                                      <div className="p-2 max-h-80 overflow-y-auto">
                                        {validQuizzes.map((quiz, idx) => (
                                          <button
                                            key={quiz.id}
                                            onClick={() => {
                                              navigate(`/quiz/${quiz.id}`);
                                              setOpenDropdown(null);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200 group"
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                                                {idx + 1}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                  {quiz.title}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                  {quiz.questions.length} câu hỏi
                                                </div>
                                              </div>
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
                        {/* Nút toggle chia sẻ & copy link cho mobile */}
                        <button
                          onClick={() => handleToggleClassShare(classRoom.id, shareStatus[`class_${classRoom.id}`] || false)}
                          disabled={(classRoom as any).accessType === 'shared'}
                          className={`w-9 h-9 rounded ${
                            shareStatus[`class_${classRoom.id}`] 
                              ? 'bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700' 
                              : 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 dark:text-purple-300'
                          } flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={`${shareStatus[`class_${classRoom.id}`] ? 'Tắt' : 'Bật'} chia sẻ lớp học`}
                        >
                          {shareStatus[`class_${classRoom.id}`] ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M13.5 3c-1.74 0-3.41.81-4.5 2.09C8.91 3.81 7.24 3 5.5 3 2.42 3 0 5.42 0 8.5c0 3.78 3.4 6.86 8.55 11.54L12 23.35l3.45-3.32C20.6 15.36 24 12.28 24 8.5 24 5.42 21.58 3 18.5 3c-1.74 0-3.41.81-4.5 2.09C13.09 3.81 11.42 3 9.5 3z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleShareClass(classRoom.id)}
                          disabled={(classRoom as any).accessType === 'shared' || !shareStatus[`class_${classRoom.id}`]}
                          className={`w-9 h-9 rounded bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center transition-all duration-200 hover:scale-110 sm:hidden ${((classRoom as any).accessType === 'shared' || !shareStatus[`class_${classRoom.id}`]) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={shareStatus[`class_${classRoom.id}`] ? 'Copy ID/Link' : 'Bật chia sẻ trước'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Bài kiểm tra trong lớp
                        </h4>
                        <div
                          className="space-y-3 max-h-72 overflow-y-auto pr-2 quiz-scrollbar-container"
                          style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#d1d5db #f3f4f6', // gray-300 thumb, gray-100 track
                          }}
                        >
                          {validQuizzes.map((quiz) => (
                            <div
                              key={quiz.id}
                              className="group/quiz p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
                            >
                              {/* Desktop Layout cho quiz items */}
                              <div className="hidden sm:flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white group-hover/quiz:text-primary-600 dark:group-hover/quiz:text-primary-400 transition-colors">
                                    {quiz.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {quiz.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/quiz/${quiz.id}`}
                                    className="btn-secondary text-sm hover:bg-primary-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                    Làm bài
                                  </Link>
                                  <button
                                    onClick={() => handleToggleQuizShare(quiz.id, shareStatus[`quiz_${quiz.id}`] || false)}
                                    disabled={(classRoom as any).accessType === 'shared'}
                                    className={`${shareStatus[`quiz_${quiz.id}`] ? 'text-purple-600 dark:text-purple-400' : 'text-purple-400 dark:text-purple-600'} hover:text-purple-700 dark:hover:text-purple-300 p-1 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={`Trạng thái: ${shareStatus[`quiz_${quiz.id}`] ? 'Có thể chia sẻ' : 'Không thể chia sẻ'}\n\nNhấn để ${shareStatus[`quiz_${quiz.id}`] ? 'tắt' : 'bật'} chia sẻ quiz`}
                                  >
                                    {/* Share Toggle Icon */}
                                    {shareStatus[`quiz_${quiz.id}`] ? (
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13.5 3c-1.74 0-3.41.81-4.5 2.09C8.91 3.81 7.24 3 5.5 3 2.42 3 0 5.42 0 8.5c0 3.78 3.4 6.86 8.55 11.54L12 23.35l3.45-3.32C20.6 15.36 24 12.28 24 8.5 24 5.42 21.58 3 18.5 3c-1.74 0-3.41.81-4.5 2.09C13.09 3.81 11.42 3 9.5 3z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                      </svg>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleShareQuiz(quiz.id)}
                                    disabled={(classRoom as any).accessType === 'shared' || !shareStatus[`quiz_${quiz.id}`]}
                                    className={`text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200 p-1 ${((classRoom as any).accessType === 'shared' || !shareStatus[`quiz_${quiz.id}`]) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={shareStatus[`quiz_${quiz.id}`] ? "Sao chép ID/Link chia sẻ" : "Bật chia sẻ trước để lấy ID/Link"}
                                  >
                                    {/* Copy Link Icon */}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                                <p className="font-medium text-gray-900 dark:text-white mb-1 group-hover/quiz:text-primary-600 dark:group-hover/quiz:text-primary-400 transition-colors">
                                  {quiz.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {quiz.description}
                                </p>
                                <div className="flex flex-row gap-2">
                                  <Link
                                    to={`/quiz/${quiz.id}`}
                                    className="btn-secondary text-sm text-center w-full hover:bg-primary-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                    Làm bài
                                  </Link>
                                  <button
                                    onClick={() => handleToggleQuizShare(quiz.id, shareStatus[`quiz_${quiz.id}`] || false)}
                                    disabled={(classRoom as any).accessType === 'shared'}
                                    className={`w-9 h-9 rounded ${
                                      shareStatus[`quiz_${quiz.id}`] 
                                        ? 'bg-purple-500 text-white hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700' 
                                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40'
                                    } flex items-center justify-center transition-all duration-200 hover:scale-110 ${(classRoom as any).accessType === 'shared' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={`${shareStatus[`quiz_${quiz.id}`] ? 'Đang chia sẻ' : 'Chưa chia sẻ'}`}
                                  >
                                    {shareStatus[`quiz_${quiz.id}`] ? (
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13.5 3c-1.74 0-3.41.81-4.5 2.09C8.91 3.81 7.24 3 5.5 3 2.42 3 0 5.42 0 8.5c0 3.78 3.4 6.86 8.55 11.54L12 23.35l3.45-3.32C20.6 15.36 24 12.28 24 8.5 24 5.42 21.58 3 18.5 3c-1.74 0-3.41.81-4.5 2.09C13.09 3.81 11.42 3 9.5 3z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                      </svg>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleShareQuiz(quiz.id)}
                                    disabled={(classRoom as any).accessType === 'shared' || !shareStatus[`quiz_${quiz.id}`]}
                                    className={`w-9 h-9 rounded bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center transition-all duration-200 hover:scale-110 ${((classRoom as any).accessType === 'shared' || !shareStatus[`quiz_${quiz.id}`]) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={shareStatus[`quiz_${quiz.id}`] ? "Sao chép ID/Link" : "Bật chia sẻ trước"}
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
        <div className="hidden lg:block lg:w-[30%] lg:flex-shrink-0 order-2">
          <div className="lg:sticky lg:top-20 space-y-6">
            {/* Stats Card */}
            <div className="card p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Thống kê học tập
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tiến độ học tập của bạn
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Lớp học</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {classes.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Bài kiểm tra</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {classes.reduce((total, cls) => total + getValidQuizzes(cls).length, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <span className="text-sm text-green-700 dark:text-green-400">Đã hoàn thành</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{statsCompleted}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm text-blue-700 dark:text-blue-400">Điểm TB</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{statsAverage}</span>
                </div>
              </div>
            </div>

            {/* Guidance Card */}
            <div className="card p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Hướng dẫn
                </h3>
              </div>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 shrink-0">
                    <svg
                      className="w-5 h-5 text-purple-700 dark:text-purple-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM4 20s1-4 8-4 8 4 8 4"
                    />
                  </svg>
                </div>
                <span>Tạo ID và LINK truy cập lớp học và bài tập trắc nghiệm người khác tham gia.</span>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  <svg
                    className="w-5 h-5 text-green-700 dark:text-green-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <span>Đặt trạng thái CÔNG KHAI hoặc RIÊNG TƯ cho lớp học và bài tập trắc nghiệm.</span>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-700 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17.25V21h3.75l11.06-11.06a2.121 2.121 0 10-3-3L3 17.25z"
                    />
                  </svg>
                </div>
                <span>Chỉnh sửa thông tin và nội dung lớp học và bài tập trắc nghiệm.</span>
              </div>

              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 shrink-0">
                  <svg
                    className="w-5 h-5 text-red-700 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <span>Xóa lớp học và bài tập trắc nghiệm.</span>
              </div>
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