import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QuizzesAPI, ClassesAPI } from '../utils/api';
import { Quiz } from '../types';
import { getToken } from '../utils/auth';

const ClassViewPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Lớp học');

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token || !classId) { setLoading(false); return; }
        // optional: fetch class name from public/mine
        try {
          const mine = await ClassesAPI.listMine(token);
          const pub = await ClassesAPI.listPublic(token);
          const cls = [...mine, ...pub].find((c: any) => c.id === classId);
          if (cls) setTitle(cls.name);
        } catch {}
        const qzs = await QuizzesAPI.byClass(classId, token);
        setQuizzes(qzs);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  if (loading) return (<div className="max-w-4xl mx-auto p-6"><div className="card p-6 animate-pulse h-32"/></div>);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h1>
      {quizzes.length === 0 ? (
        <div className="card p-6 text-center">Không có bài kiểm tra nào.</div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(q => (
            <div key={q.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{q.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{q.description}</div>
              </div>
              <button onClick={() => navigate(`/quiz/${q.id}`)} className="btn-secondary">Làm bài</button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6"><Link to="/" className="text-sm text-gray-600 dark:text-gray-400">← Trang chủ</Link></div>
    </div>
  );
};

export default ClassViewPage;
