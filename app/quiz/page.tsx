'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchQuizQuestions } from '@/services/googleSheetService';
import { Icon } from '@/components/shared/Icon';
import MathRenderer from '@/components/shared/MathRenderer';
import type { MedicalQuestion } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

// ─── Helper: Normalize Subject ───────────────────────────────────────────────
const normalizeSubject = (s: string) => {
  const lower = s.toLowerCase();
  if (lower.includes('toán')) return 'toan';
  if (lower.includes('lý') || lower.includes('vật lý')) return 'ly';
  if (lower.includes('hóa')) return 'hoa';
  if (lower.includes('sinh')) return 'sinh';
  if (lower.includes('văn')) return 'van';
  if (lower.includes('anh') || lower.includes('english')) return 'anh';
  if (lower.includes('sử')) return 'su';
  if (lower.includes('địa')) return 'dia';
  if (lower.includes('gdcd')) return 'gdcd';
  return 'vocabulary';
};

// ─── Components ──────────────────────────────────────────────────────────────

function QuizIntro({ subject, onStart, loading }: { subject: string; onStart: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
        <Icon name="book-open" className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">Bài đánh giá năng lực</h1>
      <h2 className="text-xl font-bold text-blue-600 mb-6 uppercase tracking-wide">{subject}</h2>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-md w-full mb-8 text-left space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Icon name="list" className="w-4 h-4" /></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Số lượng</p><p className="font-bold text-gray-800">20 câu hỏi</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><Icon name="clock" className="w-4 h-4" /></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Thời gian</p><p className="font-bold text-gray-800">30 phút</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><Icon name="trophy" className="w-4 h-4" /></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Mục tiêu</p><p className="font-bold text-gray-800">Đánh giá tiêu chí {subject}</p></div>
        </div>
      </div>

      <button 
        onClick={onStart} 
        disabled={loading}
        className="group relative px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center gap-2">
          {loading ? 'Đang tải đề...' : 'Bắt đầu làm bài'} 
          {!loading && <Icon name="arrow-right" className="w-5 h-5" />}
        </span>
      </button>
      
      <Link href="/progress" className="mt-6 text-sm font-semibold text-gray-400 hover:text-gray-600">
        Quay lại biểu đồ
      </Link>
    </div>
  );
}

function QuizResult({ score, total, subject, onRetry }: { score: number; total: number; subject: string; onRetry: () => void }) {
  const percentage = Math.round((score / total) * 100);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
      <div className="relative mb-8">
        <svg className="w-48 h-48 transform -rotate-90">
          <circle cx="96" cy="96" r="88" stroke="#f3f4f6" strokeWidth="12" fill="none" />
          <circle cx="96" cy="96" r="88" stroke={percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#eab308' : '#ef4444'} strokeWidth="12" fill="none" strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-gray-900">{score}/{total}</span>
          <span className="text-sm font-bold text-gray-500 uppercase">Điểm số</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {percentage >= 80 ? 'Xuất sắc!' : percentage >= 50 ? 'Tạm ổn!' : 'Cần cố gắng hơn!'}
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Bạn đã hoàn thành bài đánh giá năng lực môn <strong>{subject}</strong>. 
        Kết quả này phản ánh mức độ nắm vững kiến thức hiện tại của bạn.
      </p>

      <div className="flex gap-4">
        <button onClick={onRetry} className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:border-gray-300 hover:bg-gray-50 transition-all">
          Làm lại
        </button>
        <Link href="/progress" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg">
          Về trang tiến độ
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function QuizContent() {
  const searchParams = useSearchParams();
  const subjectLabel = searchParams.get('subject') || 'Tổng hợp';
  const [questions, setQuestions] = useState<MedicalQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<'intro' | 'taking' | 'result'>('intro');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes

  // Load questions
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const key = normalizeSubject(subjectLabel);
      const data = await fetchQuizQuestions(key, { questions: 20 });
      setQuestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [subjectLabel]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Timer
  useEffect(() => {
    if (status !== 'taking') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStatus('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const handleStart = () => {
    if (questions.length === 0) {
      loadQuestions().then(() => setStatus('taking'));
    } else {
      setStatus('taking');
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setStatus('result');
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.Correct_Answer) correct++;
    });
    return correct;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === 'intro') {
    return <QuizIntro subject={subjectLabel} onStart={handleStart} loading={loading} />;
  }

  if (status === 'result') {
    return (
      <QuizResult 
        score={calculateScore()} 
        total={questions.length} 
        subject={subjectLabel} 
        onRetry={() => {
          setAnswers({});
          setCurrentIndex(0);
          setTimeLeft(30 * 60);
          setStatus('intro');
        }} 
      />
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#f8faf9] font-sans text-[#0f2419] pb-20">
      {/* Header Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/progress" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Icon name="x" className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h3 className="font-bold text-sm text-gray-900">{subjectLabel}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-mono font-bold text-blue-600">
                  {String(currentIndex + 1).padStart(2, '0')}
                </span>
                <span className="text-gray-300">/</span>
                <span>{questions.length}</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
            <Icon name="clock" className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Area */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3">
                  Câu {currentIndex + 1}
                </span>
                <div className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">
                  <MathRenderer text={currentQ?.Question_Text || 'Đang tải câu hỏi...'} />
                </div>
                {currentQ?.Image_URL && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={currentQ.Image_URL} 
                      alt="Question Illustration" 
                      className="w-full h-auto max-h-80 object-contain bg-gray-50"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const isSelected = answers[currentIndex] === opt;
                  const optionText = (currentQ as any)[`Option_${opt}`];
                  
                  if (!optionText) return null;

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                          : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0 ${
                        isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        {opt}
                      </div>
                      <div className={`flex-1 pt-1 text-sm md:text-base ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                        <MathRenderer text={optionText} />
                      </div>
                      {isSelected && (
                        <div className="pt-1 text-blue-500">
                          <Icon name="check-circle" className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-20">
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold disabled:opacity-50"
            >
              <Icon name="chevron-left" className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold shadow-lg active:scale-95 transition-transform"
            >
              {currentIndex === questions.length - 1 ? 'Nộp bài' : 'Câu tiếp theo'}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-between items-center mt-8">
          <button 
            onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Icon name="chevron-left" className="w-4 h-4" /> Quay lại
          </button>

          {/* Question Palette */}
          <div className="flex gap-1.5 overflow-x-auto max-w-md px-2 pb-2 scrollbar-hide">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                  currentIndex === idx 
                    ? 'bg-blue-600 text-white shadow-md scale-110' 
                    : answers[idx] 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="px-8 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-lg hover:-translate-y-1 flex items-center gap-2"
          >
            {currentIndex === questions.length - 1 ? 'Nộp bài' : 'Tiếp theo'}
            <Icon name="arrow-right" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}