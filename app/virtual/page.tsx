'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    BookOpen,
    Zap,
    Activity,
    Globe,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    RotateCcw,
    Cpu,
    Layers,
    AlertTriangle,
    Trophy,
    Flame,
    ChevronLeft,
    X,
    RefreshCw,
    Keyboard
} from 'lucide-react';
import { fetchQuizQuestions } from '@/services/googleSheetService';
import MathRenderer from '@/components/shared/MathRenderer';
import { Icon } from '@/components/shared/Icon';
import type { MedicalQuestion } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubjectKey = 'toan' | 'ly' | 'hoa' | 'sinh' | 'anh' | 'su' | 'dia' | 'gdcd';
type AnswerOption = 'A' | 'B' | 'C' | 'D';

interface SubjectConfig {
    id: SubjectKey;
    name: string;
    icon: string;
    color: string;
    gradient: string;
}

interface SessionStats {
    correct: number;
    total: number;
    streak: number;
    bestStreak: number;
}

interface AnswerRecord {
    questionId: string;
    chosen: AnswerOption;
    correct: boolean;
    timeSpent: number; // ms
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPTION_KEYS: AnswerOption[] = ['A', 'B', 'C', 'D'];
const PRELOAD_AHEAD = 5;
const QUESTION_TIME_LIMIT_MS = 0; // 0 = no limit; set > 0 to enable countdown

const SUBJECTS: SubjectConfig[] = [
    { id: 'toan', name: 'Toán Học',   icon: 'calculator', color: 'text-blue-600',   gradient: 'from-blue-500 to-indigo-600'  },
    { id: 'ly',   name: 'Vật Lý',     icon: 'zap',        color: 'text-yellow-600', gradient: 'from-yellow-500 to-amber-600' },
    { id: 'hoa',  name: 'Hóa Học',    icon: 'flask',      color: 'text-purple-600', gradient: 'from-purple-500 to-fuchsia-600'},
    { id: 'sinh', name: 'Sinh Học',   icon: 'activity',   color: 'text-green-600',  gradient: 'from-green-500 to-emerald-600'},
    { id: 'anh',  name: 'Tiếng Anh',  icon: 'globe',      color: 'text-sky-600',    gradient: 'from-sky-500 to-cyan-600'    },
    { id: 'su',   name: 'Lịch Sử',    icon: 'book-open',  color: 'text-red-600',    gradient: 'from-red-500 to-rose-600'    },
    { id: 'dia',  name: 'Địa Lý',     icon: 'map',        color: 'text-teal-600',   gradient: 'from-teal-500 to-green-600'  },
    { id: 'gdcd', name: 'GDCD',       icon: 'users',      color: 'text-orange-600', gradient: 'from-orange-500 to-red-500'  },
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle — does not mutate the input. */
function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/** Returns the value for a given option key from a question object. */
function getOptionText(question: MedicalQuestion, opt: AnswerOption): string | undefined {
    return question[`Option_${opt}` as keyof MedicalQuestion] as string | undefined;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---- Exit Confirmation Dialog ----

interface ExitDialogProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const ExitDialog: React.FC<ExitDialogProps> = ({ onConfirm, onCancel }) => (
    <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full mx-4 text-center"
        >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 id="exit-dialog-title" className="text-xl font-black text-gray-900 mb-2">
                Thoát phòng luyện tập?
            </h2>
            <p className="text-gray-500 text-sm mb-6">
                Tiến trình hiện tại sẽ không được lưu lại.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-colors"
                >
                    Ở lại
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 font-bold text-white transition-colors"
                >
                    Thoát
                </button>
            </div>
        </motion.div>
    </div>
);

// ---- Subject Card ----

interface SubjectCardProps {
    subject: SubjectConfig;
    onClick: () => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        aria-label={`Chọn môn ${subject.name}`}
        className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center justify-center gap-4 group h-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${subject.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${subject.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
            <Icon name={subject.icon as Parameters<typeof Icon>[0]['name']} className="w-8 h-8" />
        </div>
        <h3 className={`text-lg font-bold ${subject.color} group-hover:text-gray-900 transition-colors`}>
            {subject.name}
        </h3>
    </motion.button>
);

// ---- Option Button ----

type OptionState = 'idle' | 'correct' | 'wrong' | 'dimmed';

function resolveOptionState(
    opt: AnswerOption,
    userAnswer: AnswerOption | null,
    correctAnswer: string
): OptionState {
    if (!userAnswer) return 'idle';
    if (opt === correctAnswer) return 'correct';
    if (opt === userAnswer) return 'wrong';
    return 'dimmed';
}

const OPTION_STATE_CLASSES: Record<OptionState, string> = {
    idle:    'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer',
    correct: 'border-green-500 bg-green-50 ring-1 ring-green-500 cursor-default',
    wrong:   'border-red-500 bg-red-50 ring-1 ring-red-500 cursor-default',
    dimmed:  'border-gray-100 opacity-40 cursor-default',
};

const OPTION_BADGE_CLASSES: Record<OptionState, string> = {
    idle:    'bg-gray-100 text-gray-500',
    correct: 'bg-green-600 text-white',
    wrong:   'bg-red-500 text-white',
    dimmed:  'bg-gray-100 text-gray-400',
};

interface OptionButtonProps {
    opt: AnswerOption;
    text: string;
    state: OptionState;
    onClick: () => void;
    keyboardHint?: string;
}

const OptionButton: React.FC<OptionButtonProps> = ({ opt, text, state, onClick, keyboardHint }) => (
    <button
        onClick={onClick}
        disabled={state !== 'idle'}
        aria-label={`Chọn đáp án ${opt}`}
        aria-pressed={state === 'correct' || state === 'wrong'}
        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${OPTION_STATE_CLASSES[state]}`}
    >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${OPTION_BADGE_CLASSES[state]}`}>
            {opt}
        </span>
        <div className="flex-1 font-medium text-gray-800">
            <MathRenderer text={text} />
        </div>
        {keyboardHint && state === 'idle' && (
            <span className="hidden md:flex items-center justify-center w-5 h-5 rounded border border-gray-200 text-[10px] font-mono text-gray-400 shrink-0">
                {keyboardHint}
            </span>
        )}
        {state === 'correct' && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
        {state === 'wrong'   && <XCircle      className="w-5 h-5 text-red-500   shrink-0" />}
    </button>
);

// ---- Question Card ----

interface QuestionCardProps {
    question: MedicalQuestion;
    onAnswer: (opt: AnswerOption) => void;
    userAnswer: AnswerOption | null;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, userAnswer }) => {
    const KEYBOARD_HINTS: Record<AnswerOption, string> = { A: '1', B: '2', C: '3', D: '4' };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 leading-relaxed">
                        <MathRenderer text={question.Question_Text} />
                    </h3>
                    {question.Image_URL && (
                        <div className="mt-4 flex justify-center">
                            <img
                                src={question.Image_URL}
                                alt="Hình minh hoạ cho câu hỏi"
                                className="max-h-64 rounded-xl object-contain shadow-sm"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {OPTION_KEYS.map((opt) => {
                        const text = getOptionText(question, opt);
                        if (!text) return null;
                        const state = resolveOptionState(opt, userAnswer, question.Correct_Answer);
                        return (
                            <OptionButton
                                key={opt}
                                opt={opt}
                                text={text}
                                state={state}
                                onClick={() => !userAnswer && onAnswer(opt)}
                                keyboardHint={KEYBOARD_HINTS[opt]}
                            />
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {userAnswer && (
                    <motion.div
                        key="explanation"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="bg-gray-50 border-t border-gray-100 overflow-hidden"
                    >
                        <div className="p-6 flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Lời giải chi tiết</h4>
                                <div className="text-gray-600 text-sm leading-relaxed">
                                    <MathRenderer
                                        text={question.Explanation || 'Chưa có lời giải chi tiết cho câu hỏi này.'}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ---- Accuracy Ring ----

const AccuracyRing: React.FC<{ correct: number; total: number }> = ({ correct, total }) => {
    const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (pct / 100) * circumference;

    return (
        <div className="relative w-12 h-12 flex items-center justify-center" aria-label={`Độ chính xác ${pct}%`}>
            <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                <circle cx="24" cy="24" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <circle
                    cx="24" cy="24" r={radius}
                    fill="none"
                    stroke={pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
            </svg>
            <span className="absolute text-[10px] font-black text-gray-700">{pct}%</span>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function VirtualExamPage() {
    // ---- State ----
    const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
    const [allQuestions, setAllQuestions]       = useState<MedicalQuestion[]>([]);
    const [playQueue, setPlayQueue]             = useState<MedicalQuestion[]>([]);
    const [currentIndex, setCurrentIndex]       = useState(0);
    const [loadState, setLoadState]             = useState<'idle' | 'loading' | 'error'>('idle');
    const [userAnswer, setUserAnswer]           = useState<AnswerOption | null>(null);
    const [showExitDialog, setShowExitDialog]   = useState(false);
    const [stats, setStats]                     = useState<SessionStats>({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
    const [history, setHistory]                 = useState<AnswerRecord[]>([]);
    const answerTimestampRef                    = useRef<number>(Date.now());

    // ---- Derived ----
    const currentQuestion: MedicalQuestion | undefined = playQueue[currentIndex];

    /** Preloaded count shown in header — capped at PRELOAD_AHEAD. */
    const preloadedCount = useMemo(
        () => Math.min(playQueue.length - currentIndex - 1, PRELOAD_AHEAD),
        [playQueue.length, currentIndex]
    );

    // ---- Data Loading ----

    const loadQuestions = useCallback(async (subjectId: SubjectKey) => {
        setLoadState('loading');
        setAllQuestions([]);
        setPlayQueue([]);
        setCurrentIndex(0);
        setUserAnswer(null);

        try {
            const fetched = await fetchQuizQuestions(subjectId);
            if (fetched.length === 0) {
                setLoadState('idle'); // no questions — show empty state
                return;
            }
            const shuffled = shuffleArray(fetched);
            setAllQuestions(shuffled);
            // Double the deck to allow seamless "infinite" loop without resets
            setPlayQueue([...shuffled, ...shuffleArray(fetched)]);
            setLoadState('idle');
        } catch {
            setLoadState('error');
        }
    }, []);

    // ---- Handlers ----

    const handleSubjectSelect = useCallback((subject: SubjectConfig) => {
        setSelectedSubject(subject);
        setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
        setHistory([]);
        loadQuestions(subject.id);
    }, [loadQuestions]);

    const handleAnswer = useCallback((opt: AnswerOption) => {
        if (!currentQuestion || userAnswer) return;

        const isCorrect = opt === currentQuestion.Correct_Answer;
        const timeSpent = Date.now() - answerTimestampRef.current;

        setUserAnswer(opt);
        setStats((prev) => {
            const newStreak    = isCorrect ? prev.streak + 1 : 0;
            const newBestStreak = Math.max(prev.bestStreak, newStreak);
            return {
                correct:    prev.correct + (isCorrect ? 1 : 0),
                total:      prev.total + 1,
                streak:     newStreak,
                bestStreak: newBestStreak,
            };
        });
        setHistory((prev) => [
            ...prev,
            { questionId: String(currentQuestion.ID ?? currentIndex), chosen: opt, correct: isCorrect, timeSpent },
        ]);
    }, [currentQuestion, userAnswer, currentIndex]);

    const handleNext = useCallback(() => {
        const nextIndex = currentIndex + 1;

        // When we exhaust the second half of the deck, append another shuffled copy
        if (nextIndex >= playQueue.length - PRELOAD_AHEAD) {
            setPlayQueue((prev) => [...prev, ...shuffleArray(allQuestions)]);
        }

        setCurrentIndex(nextIndex);
        setUserAnswer(null);
        answerTimestampRef.current = Date.now();
    }, [currentIndex, playQueue.length, allQuestions]);

    const handleRetry = useCallback(() => {
        if (selectedSubject) {
            setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
            setHistory([]);
            loadQuestions(selectedSubject.id);
        }
    }, [selectedSubject, loadQuestions]);

    const handleExitConfirm = useCallback(() => {
        setSelectedSubject(null);
        setAllQuestions([]);
        setPlayQueue([]);
        setUserAnswer(null);
        setShowExitDialog(false);
        setLoadState('idle');
    }, []);

    // ---- Keyboard Navigation ----

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!currentQuestion) return;
            // Prevent conflicting with input fields
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (!userAnswer) {
                if (e.key === '1') handleAnswer('A');
                if (e.key === '2') handleAnswer('B');
                if (e.key === '3') handleAnswer('C');
                if (e.key === '4') handleAnswer('D');
            } else {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    handleNext();
                }
            }

            if (e.key === 'Escape') setShowExitDialog(true);
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [currentQuestion, userAnswer, handleAnswer, handleNext]);

    // Reset answer timer on question change
    useEffect(() => {
        answerTimestampRef.current = Date.now();
    }, [currentIndex]);

    // ---- Subject Selection Screen ----

    if (!selectedSubject) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                            <Cpu className="w-4 h-4" />
                            Phòng luyện thi ảo
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Chọn môn học để{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                Luyện tập
                            </span>
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                            Hệ thống tự động trích xuất câu hỏi ngẫu nhiên từ ngân hàng đề thi.
                            Luyện tập không giới hạn với chế độ tải trước thông minh.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {SUBJECTS.map((subject) => (
                            <SubjectCard
                                key={subject.id}
                                subject={subject}
                                onClick={() => handleSubjectSelect(subject)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ---- Quiz Screen ----

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    {/* Left: exit + subject name */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowExitDialog(true)}
                            aria-label="Thoát phòng luyện tập"
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className={`font-bold text-lg ${selectedSubject.color} flex items-center gap-2`}>
                            <Icon name={selectedSubject.icon as Parameters<typeof Icon>[0]['name']} className="w-5 h-5" />
                            {selectedSubject.name}
                        </h2>
                    </div>

                    {/* Right: stats */}
                    <div className="flex items-center gap-4">
                        {/* Preload indicator */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                            <Layers className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500">+{preloadedCount} sẵn sàng</span>
                        </div>

                        {/* Accuracy ring */}
                        {stats.total > 0 && <AccuracyRing correct={stats.correct} total={stats.total} />}

                        {/* Correct / total */}
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Đúng / Tổng</p>
                            <p className="text-lg font-black text-gray-900 leading-none">
                                {stats.correct}/{stats.total}
                            </p>
                        </div>

                        {/* Streak */}
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Chuỗi</p>
                            <p
                                className={`text-lg font-black leading-none ${
                                    stats.streak >= 5 ? 'text-orange-500' : 'text-gray-700'
                                }`}
                            >
                                {stats.streak >= 3 && '🔥'} {stats.streak}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Keyboard hint bar */}
            <div className="hidden md:flex items-center justify-center gap-2 bg-blue-50 border-b border-blue-100 py-1.5 text-xs text-blue-600 font-medium">
                <Keyboard className="w-3.5 h-3.5" />
                Phím tắt: <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px]">1–4</kbd> chọn đáp án &nbsp;·&nbsp;
                <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px]">Enter</kbd> câu tiếp theo &nbsp;·&nbsp;
                <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px]">Esc</kbd> thoát
            </div>

            {/* Content */}
            <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col justify-center">
                {loadState === 'loading' && (
                    <div className="text-center py-20" aria-live="polite" aria-busy="true">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-800">Đang khởi tạo phòng thi…</h3>
                        <p className="text-gray-500 mt-2">Đang trích xuất dữ liệu từ ngân hàng câu hỏi.</p>
                    </div>
                )}

                {loadState === 'error' && (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-lg border border-red-100" aria-live="assertive">
                        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Không thể tải câu hỏi</h3>
                        <p className="text-gray-500 mt-2 mb-6">Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p>
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Thử lại
                        </button>
                    </div>
                )}

                {loadState === 'idle' && allQuestions.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
                        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Không tìm thấy câu hỏi</h3>
                        <p className="text-gray-500 mt-2 mb-6">
                            Ngân hàng câu hỏi cho môn này đang được cập nhật.
                        </p>
                        <button
                            onClick={() => setSelectedSubject(null)}
                            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors"
                        >
                            Quay lại
                        </button>
                    </div>
                )}

                {loadState === 'idle' && currentQuestion && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            {/* Best streak celebration */}
                            <AnimatePresence>
                                {stats.streak > 0 && stats.streak === stats.bestStreak && stats.streak % 5 === 0 && (
                                    <motion.div
                                        key={`streak-${stats.streak}`}
                                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mb-4 flex items-center gap-2 justify-center bg-orange-50 border border-orange-200 rounded-2xl py-2 px-4 text-orange-700 font-bold text-sm"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Chuỗi mới! {stats.streak} câu đúng liên tiếp 🔥
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <QuestionCard
                                question={currentQuestion}
                                onAnswer={handleAnswer}
                                userAnswer={userAnswer}
                            />

                            {userAnswer && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 flex items-center justify-between"
                                >
                                    <p className="hidden md:block text-xs text-gray-400">
                                        Câu {stats.total} · Nhấn{' '}
                                        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">
                                            Enter
                                        </kbd>{' '}
                                        để tiếp tục
                                    </p>
                                    <button
                                        onClick={handleNext}
                                        className="ml-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                        aria-label="Câu tiếp theo"
                                    >
                                        Câu tiếp theo
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>

            {/* Exit confirmation dialog */}
            <AnimatePresence>
                {showExitDialog && (
                    <ExitDialog
                        onConfirm={handleExitConfirm}
                        onCancel={() => setShowExitDialog(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}