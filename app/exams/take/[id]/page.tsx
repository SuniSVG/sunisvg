'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    Flag, 
    AlertTriangle, 
    Send, 
    X, 
    CheckCircle2,
    Trophy,
    Home,
    Maximize,
    Minimize,
    RotateCcw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { fetchUserQuiz, submitTestResult, updateUserQuizStats } from '@/services/googleSheetService';
import type { UserQuiz, CustomQuizQuestion } from '@/types';

import MathRenderer from '@/components/shared/MathRenderer';

// --- Components ---

const OptionButton = ({ 
    label, 
    text, 
    isSelected, 
    onClick 
}: { 
    label: string, 
    text: string, 
    isSelected: boolean, 
    onClick: () => void 
}) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
            isSelected 
                ? 'border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600' 
                : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-gray-50'
        }`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
        }`}>
            {label}
        </div>
        <div className={`flex-1 font-medium text-lg ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
            <MathRenderer text={text} />
        </div>
    </button>
);

const QuestionGridItem = ({ 
    index, 
    isAnswered, 
    isMarked, 
    isActive, 
    onClick 
}: { 
    index: number, 
    isAnswered: boolean, 
    isMarked: boolean, 
    isActive: boolean, 
    onClick: () => void 
}) => (
    <button
        onClick={onClick}
        className={`w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all relative ${
            isActive ? 'ring-2 ring-blue-600 ring-offset-2' : ''
        } ${
            isMarked ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400' :
            isAnswered ? 'bg-green-600 text-white shadow-lg shadow-green-100' :
            'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
    >
        {index + 1}
        {isMarked && <Flag className="w-2.5 h-2.5 absolute -top-1 -right-1 text-yellow-600 fill-yellow-600" />}
    </button>
);


// --- Main Page ---

export default function ExamRoom() {
    const params = useParams();
    const quizId = params.id as string;
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();
    
    const [quiz, setQuiz] = useState<UserQuiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [showReview, setShowReview] = useState(false);
    const [participantName, setParticipantName] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Load Quiz
    useEffect(() => {
        const loadQuiz = async () => {
            if (!quizId) return;
            setIsLoading(true);

            try {
                const data = await fetchUserQuiz(quizId);
                if (data) {
                    // Check one attempt only
                    if (data.oneAttemptOnly && currentUser) {
                        const userResult = data.results?.find(res => res.participantEmail?.toLowerCase() === currentUser.Email.toLowerCase());
                        if (userResult) {
                            addToast(`Bạn đã làm bài này rồi và đạt ${userResult.score}/${userResult.totalQuestions} điểm.`, 'info');
                            router.push('/exams');
                            return;
                        }
                    }
                    setQuiz(data);
                    setTimeLeft((data.timeLimit || 90) * 60);
                } else {
                    addToast('Không tìm thấy bộ đề này.', 'error');
                    router.push('/exams');
                }
            } catch (error) {
                console.error("Failed to load quiz:", error);
                addToast('Lỗi khi tải dữ liệu bài thi.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadQuiz();
    }, [quizId, router, addToast, currentUser]);

    // Pre-fill name
    useEffect(() => {
        if (currentUser) {
            setParticipantName(currentUser['Tên tài khoản']);
        }
    }, [currentUser]);

    // Define handleSubmit BEFORE timer useEffect to avoid initialization error
    const handleSubmit = useCallback(async () => {
        if (!quiz || isSubmitting) return;

        // Confirm if questions are unanswered
        const unansweredCount = quiz.questions.length - Object.keys(answers).length;
        if (unansweredCount > 0 && timeLeft > 0) {
            if (!confirm(`Bạn còn ${unansweredCount} câu chưa làm. Bạn có chắc chắn muốn nộp bài?`)) {
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // Calculate score
            let correctCount = 0;
            quiz.questions.forEach((q, idx) => {
                const userAnswer = answers[idx];
                if (userAnswer === q.correctAnswerIndex) correctCount++;
            });

            const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
            setScore(finalScore);

            const nameToSubmit = participantName || currentUser?.['Tên tài khoản'] || 'Ẩn danh';

            await submitTestResult(
                quiz.quizId,
                nameToSubmit,
                correctCount,
                quiz.questions.length,
                currentUser?.Email || '',
                answers
            );

            if (currentUser) {
                await updateUserQuizStats(currentUser.Email, quiz.questions.length, correctCount);
            }

            setIsFinished(true);
            addToast('Nộp bài thành công!', 'success');
        } catch (error) {
            console.error("Submission failed:", error);
            addToast('Lỗi khi nộp bài. Vui lòng thử lại.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [quiz, isSubmitting, answers, timeLeft, currentUser, addToast, participantName]);

    // Timer Logic - handleSubmit is now defined above
    useEffect(() => {
        if (isFinished || timeLeft <= 0 || !quiz || !isStarted) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit when time is up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isFinished, timeLeft, quiz, isStarted, handleSubmit]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    };

    const toggleMark = () => {
        setMarkedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(currentQuestionIndex)) next.delete(currentQuestionIndex);
            else next.add(currentQuestionIndex);
            return next;
        });
    };

    const handleExit = () => {
        if (!isFinished && isStarted) {
            if (confirm('Bạn đang trong quá trình làm bài. Kết quả sẽ không được lưu nếu bạn thoát bây giờ. Bạn có chắc chắn muốn thoát?')) {
                router.push('/exams');
            }
        } else {
            router.push('/exams');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold animate-pulse">Đang chuẩn bị phòng thi...</p>
            </div>
        );
    }

    if (!isStarted && quiz) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-10 h-10 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">{quiz.title}</h1>
                    <p className="text-gray-500 mb-8">{quiz.description || 'Vui lòng nhập tên để bắt đầu làm bài.'}</p>
                    
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between text-sm font-bold text-gray-500 bg-gray-50 p-4 rounded-xl">
                            <span>Số câu hỏi:</span>
                            <span className="text-gray-900">{quiz.questions.length} câu</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-bold text-gray-500 bg-gray-50 p-4 rounded-xl">
                            <span>Thời gian:</span>
                            <span className="text-gray-900">{quiz.timeLimit || 90} phút</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <input 
                            type="text"
                            placeholder="Nhập tên của bạn"
                            value={participantName}
                            onChange={(e) => setParticipantName(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none font-bold text-center"
                            disabled={!!currentUser}
                        />
                        <button 
                            onClick={() => {
                                if (!participantName.trim()) {
                                    addToast('Vui lòng nhập tên của bạn.', 'error');
                                    return;
                                }
                                setIsStarted(true);
                            }}
                            className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            Bắt đầu thi
                        </button>
                        <button 
                            onClick={() => router.push('/exams')}
                            className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
                        >
                            Quay lại
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (isFinished) {
        const correctCount = Math.round((score / 100) * (quiz?.questions.length || 0));
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full text-center mb-8"
                >
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-12 h-12 text-yellow-600" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Hoàn Thành Bài Thi!</h1>
                    <p className="text-gray-500 mb-8">Chúc mừng bạn đã hoàn thành bài thi <span className="font-bold text-gray-800">{quiz?.title}</span></p>
                    
                    <div className="bg-blue-50 rounded-2xl p-8 mb-8">
                        <div className="text-5xl font-black text-blue-600 mb-2">{score}</div>
                        <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">Điểm số của bạn</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Số câu đúng</span>
                            <span className="text-xl font-bold text-green-600">
                                {correctCount} / {quiz?.questions.length}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Thời gian làm</span>
                            <span className="text-xl font-bold text-blue-600">
                                {formatTime((quiz?.timeLimit || 90) * 60 - timeLeft)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => setShowReview(!showReview)}
                            className="flex-1 bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition-all shadow-lg shadow-gray-100 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            {showReview ? 'Ẩn đáp án' : 'Xem lại đáp án'}
                        </button>
                        <button 
                            onClick={() => router.push('/exams')}
                            className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Về trang chủ
                        </button>
                        <button 
                            onClick={() => window.location.href = `/exams/take/${quizId}`}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Thi lại
                        </button>
                    </div>
                </motion.div>

                {showReview && quiz && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl w-full space-y-6 pb-20"
                    >
                        <h3 className="text-2xl font-black text-gray-900 px-4">Chi tiết bài làm</h3>
                        {quiz.questions.map((q, i) => {
                            const userAnswer = answers[i];
                            const isCorrect = userAnswer === q.correctAnswerIndex;
                            return (
                                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {i + 1}
                                        </div>
                                        <div className="font-bold text-gray-800 text-lg">
                                            <MathRenderer text={q.questionText} />
                                        </div>
                                    </div>
                                    
                                    {q.imageUrl && (
                                        <img src={q.imageUrl} alt="" className="max-h-64 rounded-xl mb-6 mx-auto object-contain" referrerPolicy="no-referrer" />
                                    )}

                                    <div className="grid grid-cols-1 gap-3">
                                        {q.options.map((opt, optIdx) => {
                                            const isCorrectAnswer = optIdx === q.correctAnswerIndex;
                                            const isUserAnswer = optIdx === userAnswer;
                                            
                                            let statusClass = 'border-gray-100 text-gray-600';
                                            if (isCorrectAnswer) statusClass = 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500';
                                            else if (isUserAnswer && !isCorrect) statusClass = 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500';

                                            return (
                                                <div key={optIdx} className={`p-4 rounded-xl border-2 flex items-center gap-3 ${statusClass}`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                                        isCorrectAnswer ? 'bg-green-600 text-white' : 
                                                        isUserAnswer ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        {['A', 'B', 'C', 'D'][optIdx]}
                                                    </div>
                                                    <div className="font-medium">
                                                        <MathRenderer text={opt.text} />
                                                    </div>
                                                    {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 ml-auto text-green-600" />}
                                                    {isUserAnswer && !isCorrect && <AlertTriangle className="w-5 h-5 ml-auto text-red-600" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        );
    }

    const currentQuestion = quiz?.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleExit}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                        title="Thoát"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <h1 className="font-bold text-gray-800 truncate max-w-md">
                        {quiz?.title}
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 flex items-center gap-2 text-sm font-bold"
                        title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        {isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-sm font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        Báo lỗi
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-red-600 text-white font-black px-8 py-2.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="bg-blue-100 text-blue-700 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                        Câu hỏi {currentQuestionIndex + 1} / {quiz?.questions.length}
                                    </span>
                                    <button 
                                        onClick={toggleMark}
                                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                                            markedQuestions.has(currentQuestionIndex) ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'
                                        }`}
                                    >
                                        <Flag className={`w-5 h-5 ${markedQuestions.has(currentQuestionIndex) ? 'fill-yellow-600' : ''}`} />
                                        {markedQuestions.has(currentQuestionIndex) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
                                    </button>
                                </div>

                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                    <div className="text-2xl font-bold text-gray-900 leading-relaxed mb-8">
                                        <MathRenderer text={currentQuestion?.questionText || ''} />
                                    </div>

                                    {currentQuestion?.imageUrl && (
                                        <img src={currentQuestion.imageUrl} alt="" className="max-h-80 rounded-2xl mb-8 mx-auto object-contain shadow-sm" referrerPolicy="no-referrer" />
                                    )}

                                    <div className="space-y-4">
                                        {currentQuestion?.options.map((opt, idx) => (
                                            <OptionButton 
                                                key={idx}
                                                label={['A', 'B', 'C', 'D'][idx]}
                                                text={opt.text || ''}
                                                isSelected={answers[currentQuestionIndex] === idx}
                                                onClick={() => handleSelectOption(idx)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button 
                                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className="flex items-center gap-2 text-gray-500 font-bold hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                        Câu trước
                                    </button>
                                    <button 
                                        onClick={() => setCurrentQuestionIndex(prev => Math.min((quiz?.questions.length || 1) - 1, prev + 1))}
                                        disabled={currentQuestionIndex === (quiz?.questions.length || 1) - 1}
                                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold px-8 py-3 rounded-2xl hover:border-blue-600 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
                                    >
                                        Câu tiếp theo
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* Sidebar */}
                <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
                    {/* Timer */}
                    <div className="p-6 border-b border-gray-100">
                        <div className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-colors ${
                            timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
                        }`}>
                            <Clock className="w-8 h-8 mb-2" />
                            <span className="text-3xl font-black font-mono tracking-widest">
                                {formatTime(timeLeft)}
                            </span>
                            <span className="text-[10px] font-bold uppercase mt-1 opacity-60">Thời gian còn lại</span>
                        </div>
                    </div>

                    {/* Question Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Danh sách câu hỏi</h4>
                        <div className="grid grid-cols-5 gap-2">
                            {quiz?.questions.map((_, idx) => (
                                <QuestionGridItem 
                                    key={idx}
                                    index={idx}
                                    isAnswered={answers[idx] !== undefined}
                                    isMarked={markedQuestions.has(idx)}
                                    isActive={currentQuestionIndex === idx}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                <div className="w-3 h-3 rounded bg-green-600"></div>
                                Đã làm
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                <div className="w-3 h-3 rounded bg-gray-100"></div>
                                Chưa làm
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400"></div>
                                Đánh dấu
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                <div className="w-3 h-3 rounded ring-2 ring-blue-600"></div>
                                Đang chọn
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}