import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator, Zap, Beaker, Activity, Globe, BookOpen, Map, Users,
    ChevronLeft, Layers, Keyboard, ArrowRight, Trophy, XCircle,
    RefreshCw, AlertTriangle, Cpu, Sparkles, Zap as Lightning,
    Target, Brain, Clock, TrendingUp, Award, Star, Flame,
    Volume2, VolumeX, Eye, EyeOff, BarChart3, Pause, Play,
    Lightbulb, ChevronRight, Medal, Crown, Gift, Rocket,
    Shuffle, SkipForward, RotateCcw, CheckCircle2, XCircle as Wrong
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type SubjectKey = 'toan' | 'ly' | 'hoa' | 'sinh' | 'anh' | 'su' | 'dia' | 'gdcd';
type AnswerOption = 'A' | 'B' | 'C' | 'D';
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
type GameMode = 'practice' | 'timed' | 'survival' | 'zen';

interface SubjectConfig {
    id: SubjectKey;
    name: string;
    icon: string;
    color: string;
    gradient: string;
    description: string;
}

interface MedicalQuestion {
    ID?: number;
    Question_Text: string;
    Option_A: string;
    Option_B: string;
    Option_C: string;
    Option_D: string;
    Correct_Answer: AnswerOption;
    Explanation?: string;
    difficulty?: DifficultyLevel;
    tags?: string[];
}

interface SessionStats {
    correct: number;
    total: number;
    streak: number;
    bestStreak: number;
    avgTime: number;
    perfectAnswers: number;
    hintsUsed: number;
    powerUpsUsed: number;
}

interface AnswerRecord {
    questionId: string;
    chosen: AnswerOption;
    correct: boolean;
    timeSpent: number;
    difficulty?: DifficultyLevel;
    hintUsed: boolean;
}

interface PowerUp {
    id: string;
    name: string;
    icon: any;
    description: string;
    count: number;
    cooldown: number;
    lastUsed: number;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: any;
    unlocked: boolean;
    progress: number;
    target: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRELOAD_AHEAD = 10;

const SUBJECTS: SubjectConfig[] = [
    { id: 'toan', name: 'Toán Học', icon: 'calculator', color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600', description: 'Giải tích, Đại số, Hình học' },
    { id: 'ly', name: 'Vật Lý', icon: 'zap', color: 'text-yellow-600', gradient: 'from-yellow-500 to-amber-600', description: 'Cơ học, Điện, Quang học' },
    { id: 'hoa', name: 'Hóa Học', icon: 'flask', color: 'text-purple-600', gradient: 'from-purple-500 to-fuchsia-600', description: 'Vô cơ, Hữu cơ, Phản ứng' },
    { id: 'sinh', name: 'Sinh Học', icon: 'activity', color: 'text-green-600', gradient: 'from-green-500 to-emerald-600', description: 'Di truyền, Tiến hóa, Sinh thái' },
    { id: 'anh', name: 'Tiếng Anh', icon: 'globe', color: 'text-sky-600', gradient: 'from-sky-500 to-cyan-600', description: 'Ngữ pháp, Từ vựng, Đọc hiểu' },
    { id: 'su', name: 'Lịch Sử', icon: 'book-open', color: 'text-red-600', gradient: 'from-red-500 to-rose-600', description: 'Việt Nam, Thế giới, Sự kiện' },
    { id: 'dia', name: 'Địa Lý', icon: 'map', color: 'text-teal-600', gradient: 'from-teal-500 to-green-600', description: 'Tự nhiên, Kinh tế, Dân cư' },
    { id: 'gdcd', name: 'GDCD', icon: 'users', color: 'text-orange-600', gradient: 'from-orange-500 to-red-500', description: 'Đạo đức, Pháp luật, Xã hội' },
];

const GAME_MODES = [
    { id: 'practice', name: 'Luyện tập', icon: Target, description: 'Không giới hạn thời gian, tập trung học tập', color: 'blue' },
    { id: 'timed', name: 'Đua thời gian', icon: Clock, description: '30 giây mỗi câu, thử thách tốc độ', color: 'orange' },
    { id: 'survival', name: 'Sinh tồn', icon: Flame, description: '3 mạng, sai là mất, cam go nhất', color: 'red' },
    { id: 'zen', name: 'Thiền định', icon: Brain, description: 'Không điểm, không áp lực, chỉ học', color: 'purple' },
];

const INITIAL_POWERUPS: PowerUp[] = [
    { id: 'hint', name: 'Gợi ý AI', icon: Lightbulb, description: 'Loại bỏ 2 đáp án sai', count: 3, cooldown: 5000, lastUsed: 0 },
    { id: 'time', name: 'Đóng băng', icon: Clock, description: 'Thêm 15 giây', count: 2, cooldown: 10000, lastUsed: 0 },
    { id: 'skip', name: 'Bỏ qua', icon: SkipForward, description: 'Chuyển câu khác', count: 2, cooldown: 8000, lastUsed: 0 },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const fetchQuizQuestions = async (subjectId: SubjectKey): Promise<MedicalQuestion[]> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data with difficulty and explanations
    const mockQuestions: MedicalQuestion[] = Array.from({ length: 50 }, (_, i) => ({
        ID: i + 1,
        Question_Text: `Câu hỏi ${i + 1} về môn ${subjectId}. Đây là một câu hỏi kiểm tra kiến thức của bạn?`,
        Option_A: `Đáp án A - Lựa chọn thứ nhất`,
        Option_B: `Đáp án B - Lựa chọn thứ hai`,
        Option_C: `Đáp án C - Lựa chọn thứ ba`,
        Option_D: `Đáp án D - Lựa chọn thứ tư`,
        Correct_Answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as AnswerOption,
        Explanation: `Giải thích chi tiết: Đáp án đúng vì lý do logic và phù hợp với kiến thức cơ bản.`,
        difficulty: (['easy', 'medium', 'hard', 'expert'] as DifficultyLevel[])[Math.floor(Math.random() * 4)],
        tags: [`tag${i % 3}`, `category${i % 5}`],
    }));
    
    return mockQuestions;
};

const playSound = (type: 'correct' | 'wrong' | 'powerup' | 'achievement' | 'tick') => {
    // Sound effects would be implemented here
    console.log(`🔊 Sound: ${type}`);
};

const calculateDifficultyMultiplier = (difficulty?: DifficultyLevel): number => {
    const multipliers = { easy: 1, medium: 1.5, hard: 2, expert: 3 };
    return multipliers[difficulty || 'easy'];
};

const getEncouragementMessage = (streak: number): string => {
    if (streak >= 20) return '🏆 Huyền thoại! Không gì cản nổi bạn!';
    if (streak >= 15) return '🔥 Xuất sắc! Bạn đang bất khả chiến bại!';
    if (streak >= 10) return '⚡ Tuyệt vời! Chuỗi vàng đang cháy!';
    if (streak >= 5) return '🌟 Tốt lắm! Tiếp tục như vậy!';
    return '💪 Khởi động tốt!';
};

// ============================================================================
// ICON COMPONENT
// ============================================================================

const Icon = ({ name, className = '' }: { name: string; className?: string }) => {
    const icons: Record<string, any> = {
        calculator: Calculator, zap: Zap, flask: Beaker, activity: Activity,
        globe: Globe, 'book-open': BookOpen, map: Map, users: Users,
    };
    const IconComponent = icons[name] || Calculator;
    return <IconComponent className={className} />;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Subject Selection Card
const SubjectCard = ({ subject, onClick }: { subject: SubjectConfig; onClick: () => void }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 overflow-hidden"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${subject.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
        <div className="relative z-10">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${subject.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon name={subject.icon} className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-black text-xl text-gray-900 mb-2">{subject.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{subject.description}</p>
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">50+ câu hỏi</span>
                <ChevronRight className={`w-4 h-4 ${subject.color} group-hover:translate-x-1 transition-transform`} />
            </div>
        </div>
    </motion.button>
);

// Game Mode Selection Card
const GameModeCard = ({ mode, selected, onClick }: { mode: any; selected: boolean; onClick: () => void }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
            selected
                ? `border-${mode.color}-500 bg-${mode.color}-50 shadow-lg`
                : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
    >
        <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-${mode.color}-100 flex items-center justify-center flex-shrink-0`}>
                <mode.icon className={`w-6 h-6 text-${mode.color}-600`} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-lg text-gray-900 mb-1">{mode.name}</h4>
                <p className="text-sm text-gray-600">{mode.description}</p>
            </div>
            {selected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-6 h-6 rounded-full bg-${mode.color}-500 flex items-center justify-center`}
                >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                </motion.div>
            )}
        </div>
    </motion.button>
);

// Accuracy Ring
const AccuracyRing = ({ correct, total }: { correct: number; total: number }) => {
    const percentage = (correct / total) * 100;
    const circumference = 2 * Math.PI * 18;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
        <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="18" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                <motion.circle
                    cx="24"
                    cy="24"
                    r="18"
                    stroke={percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.5 }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-gray-700">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
};

// Power-Up Button
const PowerUpButton = ({ powerUp, onUse, disabled }: { powerUp: PowerUp; onUse: () => void; disabled: boolean }) => {
    const canUse = powerUp.count > 0 && !disabled && Date.now() - powerUp.lastUsed > powerUp.cooldown;
    
    return (
        <motion.button
            onClick={onUse}
            disabled={!canUse}
            whileHover={canUse ? { scale: 1.05 } : {}}
            whileTap={canUse ? { scale: 0.95 } : {}}
            className={`relative group p-3 rounded-xl border-2 transition-all ${
                canUse
                    ? 'border-purple-300 bg-purple-50 hover:bg-purple-100 cursor-pointer'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
            }`}
        >
            <div className="flex items-center gap-2">
                <powerUp.icon className={`w-5 h-5 ${canUse ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">{powerUp.name}</p>
                    <p className="text-[10px] text-gray-500">x{powerUp.count}</p>
                </div>
            </div>
            {canUse && (
                <div className="absolute inset-0 bg-purple-400 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity" />
            )}
        </motion.button>
    );
};

// Question Card with Enhanced Features
const QuestionCard = ({
    question,
    onAnswer,
    userAnswer,
    eliminatedOptions,
    timeLeft,
    gameMode,
}: {
    question: MedicalQuestion;
    onAnswer: (opt: AnswerOption) => void;
    userAnswer: AnswerOption | null;
    eliminatedOptions: Set<AnswerOption>;
    timeLeft?: number;
    gameMode: GameMode;
}) => {
    const options: AnswerOption[] = ['A', 'B', 'C', 'D'];
    
    const getDifficultyColor = (diff?: DifficultyLevel) => {
        const colors = {
            easy: 'text-green-600 bg-green-50 border-green-200',
            medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            hard: 'text-orange-600 bg-orange-50 border-orange-200',
            expert: 'text-red-600 bg-red-50 border-red-200',
        };
        return colors[diff || 'easy'];
    };
    
    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {question.difficulty && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(question.difficulty)}`}>
                                {question.difficulty.toUpperCase()}
                            </span>
                        )}
                        {gameMode === 'timed' && timeLeft !== undefined && (
                            <motion.div
                                animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
                                transition={{ repeat: timeLeft <= 10 ? Infinity : 0, duration: 0.5 }}
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    timeLeft <= 10 ? 'bg-red-500' : 'bg-white/20'
                                }`}
                            >
                                <Clock className="w-3 h-3 inline mr-1" />
                                {timeLeft}s
                            </motion.div>
                        )}
                    </div>
                    <Star className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold leading-relaxed">{question.Question_Text}</h3>
            </div>
            
            {/* Options */}
            <div className="p-6 space-y-3">
                {options.map((opt, idx) => {
                    const isEliminated = eliminatedOptions.has(opt);
                    const isChosen = userAnswer === opt;
                    const isCorrect = question.Correct_Answer === opt;
                    const shouldShowResult = userAnswer !== null;
                    
                    let buttonClass = 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300';
                    
                    if (isEliminated) {
                        buttonClass = 'bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed';
                    } else if (shouldShowResult) {
                        if (isChosen && isCorrect) {
                            buttonClass = 'bg-green-50 border-green-500 shadow-lg shadow-green-100';
                        } else if (isChosen && !isCorrect) {
                            buttonClass = 'bg-red-50 border-red-500 shadow-lg shadow-red-100';
                        } else if (isCorrect) {
                            buttonClass = 'bg-green-50 border-green-400';
                        }
                    } else if (isChosen) {
                        buttonClass = 'bg-blue-50 border-blue-400';
                    }
                    
                    return (
                        <motion.button
                            key={opt}
                            onClick={() => !userAnswer && !isEliminated && onAnswer(opt)}
                            disabled={!!userAnswer || isEliminated}
                            whileHover={!userAnswer && !isEliminated ? { scale: 1.02, x: 4 } : {}}
                            whileTap={!userAnswer && !isEliminated ? { scale: 0.98 } : {}}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${buttonClass}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                                shouldShowResult && isCorrect
                                    ? 'bg-green-500 text-white'
                                    : shouldShowResult && isChosen && !isCorrect
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white border-2 border-gray-200 text-gray-700'
                            }`}>
                                {shouldShowResult && isCorrect ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : shouldShowResult && isChosen && !isCorrect ? (
                                    <Wrong className="w-5 h-5" />
                                ) : (
                                    opt
                                )}
                            </div>
                            <span className={`flex-1 font-medium ${isEliminated ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {question[`Option_${opt}` as keyof MedicalQuestion] as string}
                            </span>
                            {!userAnswer && !isEliminated && (
                                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500">
                                    {idx + 1}
                                </kbd>
                            )}
                        </motion.button>
                    );
                })}
            </div>
            
            {/* Explanation */}
            {userAnswer && question.Explanation && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 pb-6"
                >
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-blue-900 mb-1">Giải thích</p>
                                <p className="text-sm text-blue-800">{question.Explanation}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// Achievement Toast
const AchievementToast = ({ achievement }: { achievement: Achievement }) => (
    <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
    >
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <achievement.icon className="w-6 h-6" />
        </div>
        <div>
            <p className="font-bold text-sm">🎉 Thành tích mới!</p>
            <p className="text-lg font-black">{achievement.name}</p>
        </div>
    </motion.div>
);

// Stats Dashboard
const StatsDashboard = ({ stats, history }: { stats: SessionStats; history: AnswerRecord[] }) => {
    const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    const avgTime = stats.avgTime / 1000;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
            <h3 className="font-black text-xl text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Thống kê phiên học
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-black text-gray-900">{Math.round(accuracy)}%</p>
                    <p className="text-xs text-gray-600">Độ chính xác</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-xl">
                    <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-black text-gray-900">{stats.bestStreak}</p>
                    <p className="text-xs text-gray-600">Chuỗi tốt nhất</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-black text-gray-900">{avgTime.toFixed(1)}s</p>
                    <p className="text-xs text-gray-600">Thời gian TB</p>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <Star className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-black text-gray-900">{stats.perfectAnswers}</p>
                    <p className="text-xs text-gray-600">Hoàn hảo</p>
                </div>
            </div>
            
            {/* Recent answers timeline */}
            {history.length > 0 && (
                <div className="mt-6">
                    <p className="text-sm font-bold text-gray-600 mb-3">10 câu gần nhất</p>
                    <div className="flex gap-2">
                        {history.slice(-10).map((record, idx) => (
                            <div
                                key={idx}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    record.correct ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                title={`${record.timeSpent}ms`}
                            >
                                {record.correct ? (
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                    <Wrong className="w-4 h-4 text-white" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// Exit Dialog
const ExitDialog = ({ onConfirm, onCancel, stats }: { onConfirm: () => void; onCancel: () => void; stats: SessionStats }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onCancel}
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
        >
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Kết thúc phiên học?</h3>
                <p className="text-gray-600">Tiến trình của bạn sẽ không được lưu</p>
            </div>
            
            {stats.total > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-black text-gray-900">{stats.correct}/{stats.total}</p>
                            <p className="text-xs text-gray-600">Đúng/Tổng</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-orange-600">{stats.bestStreak}</p>
                            <p className="text-xs text-gray-600">Chuỗi tốt nhất</p>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-blue-600">
                                {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                            </p>
                            <p className="text-xs text-gray-600">Độ chính xác</p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors"
                >
                    Tiếp tục học
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white transition-colors"
                >
                    Thoát
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VirtualExamPageUltimate() {
    // ---- State ----
    const [selectedSubject, setSelectedSubject] = useState<SubjectConfig | null>(null);
    const [gameMode, setGameMode] = useState<GameMode>('practice');
    const [showModeSelection, setShowModeSelection] = useState(false);
    const [allQuestions, setAllQuestions] = useState<MedicalQuestion[]>([]);
    const [playQueue, setPlayQueue] = useState<MedicalQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle');
    const [userAnswer, setUserAnswer] = useState<AnswerOption | null>(null);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [showStatsDashboard, setShowStatsDashboard] = useState(false);
    const [stats, setStats] = useState<SessionStats>({
        correct: 0,
        total: 0,
        streak: 0,
        bestStreak: 0,
        avgTime: 0,
        perfectAnswers: 0,
        hintsUsed: 0,
        powerUpsUsed: 0,
    });
    const [history, setHistory] = useState<AnswerRecord[]>([]);
    const [powerUps, setPowerUps] = useState<PowerUp[]>(INITIAL_POWERUPS);
    const [eliminatedOptions, setEliminatedOptions] = useState<Set<AnswerOption>>(new Set());
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);
    const [lives, setLives] = useState(3);
    
    const answerTimestampRef = useRef<number>(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ---- Derived ----
    const currentQuestion: MedicalQuestion | undefined = playQueue[currentIndex];
    const preloadedCount = useMemo(
        () => Math.min(playQueue.length - currentIndex - 1, PRELOAD_AHEAD),
        [playQueue.length, currentIndex]
    );

    // ---- Timer Management ----
    useEffect(() => {
        if (gameMode === 'timed' && currentQuestion && !userAnswer && !isPaused) {
            setTimeLeft(30);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (!prev || prev <= 1) {
                        if (soundEnabled) playSound('wrong');
                        handleAnswer('A'); // Auto-answer incorrect when time runs out
                        return 0;
                    }
                    if (prev <= 10 && soundEnabled) playSound('tick');
                    return prev - 1;
                });
            }, 1000);
            
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [gameMode, currentQuestion, userAnswer, isPaused]);

    // ---- Data Loading ----
    const loadQuestions = useCallback(async (subjectId: SubjectKey) => {
        setLoadState('loading');
        setAllQuestions([]);
        setPlayQueue([]);
        setCurrentIndex(0);
        setUserAnswer(null);
        setEliminatedOptions(new Set());

        try {
            const fetched = await fetchQuizQuestions(subjectId);
            if (fetched.length === 0) {
                setLoadState('idle');
                return;
            }
            const shuffled = shuffleArray(fetched);
            setAllQuestions(shuffled);
            setPlayQueue([...shuffled, ...shuffleArray(fetched)]);
            setLoadState('idle');
        } catch {
            setLoadState('error');
        }
    }, []);

    // ---- Handlers ----
    const handleSubjectSelect = useCallback((subject: SubjectConfig) => {
        setSelectedSubject(subject);
        setShowModeSelection(true);
    }, []);
    
    const handleModeSelect = useCallback((mode: GameMode) => {
        setGameMode(mode);
        setShowModeSelection(false);
        setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0, avgTime: 0, perfectAnswers: 0, hintsUsed: 0, powerUpsUsed: 0 });
        setHistory([]);
        setPowerUps(INITIAL_POWERUPS);
        setLives(mode === 'survival' ? 3 : 999);
        if (selectedSubject) loadQuestions(selectedSubject.id);
    }, [selectedSubject, loadQuestions]);

    const handleAnswer = useCallback((opt: AnswerOption) => {
        if (!currentQuestion || userAnswer || isPaused) return;

        const isCorrect = opt === currentQuestion.Correct_Answer;
        const timeSpent = Date.now() - answerTimestampRef.current;
        const isPerfect = isCorrect && timeSpent < 5000 && !eliminatedOptions.size;

        if (soundEnabled) playSound(isCorrect ? 'correct' : 'wrong');

        setUserAnswer(opt);
        setStats((prev) => {
            const newStreak = isCorrect ? prev.streak + 1 : 0;
            const newBestStreak = Math.max(prev.bestStreak, newStreak);
            const totalTime = prev.avgTime * prev.total + timeSpent;
            
            return {
                correct: prev.correct + (isCorrect ? 1 : 0),
                total: prev.total + 1,
                streak: newStreak,
                bestStreak: newBestStreak,
                avgTime: totalTime / (prev.total + 1),
                perfectAnswers: prev.perfectAnswers + (isPerfect ? 1 : 0),
                hintsUsed: prev.hintsUsed,
                powerUpsUsed: prev.powerUpsUsed,
            };
        });
        
        setHistory((prev) => [
            ...prev,
            {
                questionId: String(currentQuestion.ID ?? currentIndex),
                chosen: opt,
                correct: isCorrect,
                timeSpent,
                difficulty: currentQuestion.difficulty,
                hintUsed: eliminatedOptions.size > 0,
            },
        ]);
        
        if (gameMode === 'survival' && !isCorrect) {
            setLives((prev) => prev - 1);
        }

        // Check achievements
        if (stats.streak + 1 === 10) {
            const newAchievement = {
                id: 'streak10',
                name: 'Chuỗi vàng',
                description: '10 câu đúng liên tiếp',
                icon: Flame,
                unlocked: true,
                progress: 10,
                target: 10,
            };
            setShowAchievement(newAchievement);
            if (soundEnabled) playSound('achievement');
            setTimeout(() => setShowAchievement(null), 3000);
        }
    }, [currentQuestion, userAnswer, isPaused, eliminatedOptions, stats.streak, gameMode, soundEnabled, currentIndex]);

    const handleNext = useCallback(() => {
        if (gameMode === 'survival' && lives <= 0) {
            setShowExitDialog(true);
            return;
        }
        
        const nextIndex = currentIndex + 1;

        if (nextIndex >= playQueue.length - PRELOAD_AHEAD) {
            setPlayQueue((prev) => [...prev, ...shuffleArray(allQuestions)]);
        }

        setCurrentIndex(nextIndex);
        setUserAnswer(null);
        setEliminatedOptions(new Set());
        answerTimestampRef.current = Date.now();
    }, [currentIndex, playQueue.length, allQuestions, gameMode, lives]);

    const handlePowerUp = useCallback((powerUpId: string) => {
        const powerUp = powerUps.find((p) => p.id === powerUpId);
        if (!powerUp || powerUp.count <= 0 || userAnswer) return;
        
        if (Date.now() - powerUp.lastUsed < powerUp.cooldown) return;

        if (soundEnabled) playSound('powerup');

        if (powerUpId === 'hint' && currentQuestion) {
            const incorrectOptions = (['A', 'B', 'C', 'D'] as AnswerOption[]).filter(
                (opt) => opt !== currentQuestion.Correct_Answer
            );
            const toEliminate = shuffleArray(incorrectOptions).slice(0, 2);
            setEliminatedOptions(new Set(toEliminate));
            setStats((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1, powerUpsUsed: prev.powerUpsUsed + 1 }));
        } else if (powerUpId === 'time' && gameMode === 'timed') {
            setTimeLeft((prev) => (prev || 0) + 15);
            setStats((prev) => ({ ...prev, powerUpsUsed: prev.powerUpsUsed + 1 }));
        } else if (powerUpId === 'skip') {
            handleNext();
            setStats((prev) => ({ ...prev, powerUpsUsed: prev.powerUpsUsed + 1 }));
        }

        setPowerUps((prev) =>
            prev.map((p) =>
                p.id === powerUpId ? { ...p, count: p.count - 1, lastUsed: Date.now() } : p
            )
        );
    }, [powerUps, userAnswer, currentQuestion, gameMode, soundEnabled, handleNext]);

    const handleRetry = useCallback(() => {
        if (selectedSubject) {
            setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0, avgTime: 0, perfectAnswers: 0, hintsUsed: 0, powerUpsUsed: 0 });
            setHistory([]);
            setPowerUps(INITIAL_POWERUPS);
            setLives(gameMode === 'survival' ? 3 : 999);
            loadQuestions(selectedSubject.id);
        }
    }, [selectedSubject, gameMode, loadQuestions]);

    const handleExitConfirm = useCallback(() => {
        setSelectedSubject(null);
        setAllQuestions([]);
        setPlayQueue([]);
        setUserAnswer(null);
        setShowExitDialog(false);
        setShowModeSelection(false);
        setLoadState('idle');
        setIsPaused(false);
    }, []);

    // ---- Keyboard Navigation ----
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!currentQuestion || isPaused) return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (!userAnswer) {
                if (e.key === '1') handleAnswer('A');
                if (e.key === '2') handleAnswer('B');
                if (e.key === '3') handleAnswer('C');
                if (e.key === '4') handleAnswer('D');
                if (e.key === 'h' && powerUps[0].count > 0) handlePowerUp('hint');
            } else {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    handleNext();
                }
            }

            if (e.key === 'Escape') setShowExitDialog(true);
            if (e.key === 'p') setIsPaused((prev) => !prev);
            if (e.key === 's') setShowStatsDashboard((prev) => !prev);
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [currentQuestion, userAnswer, isPaused, handleAnswer, handleNext, powerUps, handlePowerUp]);

    useEffect(() => {
        answerTimestampRef.current = Date.now();
    }, [currentIndex]);

    // ---- Subject Selection Screen ----
    if (!selectedSubject) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-6 shadow-lg"
                        >
                            <Sparkles className="w-4 h-4" />
                            Phòng luyện thi thế hệ mới
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">
                            Nâng cao kỹ năng với{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse">
                                AI Training
                            </span>
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg mb-8">
                            Hệ thống học tập thông minh với AI hỗ trợ, power-ups, thành tích, và nhiều chế độ chơi thú vị.
                        </p>
                        
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-12">
                            <div className="flex items-center gap-2">
                                <Lightning className="w-4 h-4 text-yellow-500" />
                                <span>Power-ups thông minh</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-orange-500" />
                                <span>Hệ thống thành tích</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-500" />
                                <span>Phân tích chi tiết</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    >
                        {SUBJECTS.map((subject, idx) => (
                            <motion.div
                                key={subject.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <SubjectCard subject={subject} onClick={() => handleSubjectSelect(subject)} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        );
    }

    // ---- Game Mode Selection Screen ----
    if (showModeSelection) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <button
                            onClick={() => {
                                setSelectedSubject(null);
                                setShowModeSelection(false);
                            }}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Quay lại
                        </button>
                        
                        <div className="text-center">
                            <div className={`inline-flex items-center gap-2 ${selectedSubject.color} mb-4`}>
                                <Icon name={selectedSubject.icon as Parameters<typeof Icon>[0]['name']} className="w-6 h-6" />
                                <h2 className="text-2xl font-black">{selectedSubject.name}</h2>
                            </div>
                            <p className="text-gray-600 text-lg">Chọn chế độ luyện tập phù hợp với bạn</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid gap-4"
                    >
                        {GAME_MODES.map((mode, idx) => (
                            <motion.div
                                key={mode.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <GameModeCard
                                    mode={mode}
                                    selected={gameMode === mode.id}
                                    onClick={() => handleModeSelect(mode.id as GameMode)}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        );
    }

    // ---- Quiz Screen ----
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowExitDialog(true)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className={`flex items-center gap-2 ${selectedSubject.color}`}>
                            <Icon name={selectedSubject.icon as Parameters<typeof Icon>[0]['name']} className="w-5 h-5" />
                            <h2 className="font-bold text-lg">{selectedSubject.name}</h2>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            {GAME_MODES.find(m => m.id === gameMode)?.name}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Lives (Survival mode) */}
                        {gameMode === 'survival' && (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            i < lives ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-300'
                                        }`}
                                    >
                                        ❤️
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Preload indicator */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                            <Layers className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-bold text-green-700">+{preloadedCount}</span>
                        </div>

                        {stats.total > 0 && <AccuracyRing correct={stats.correct} total={stats.total} />}

                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Điểm</p>
                            <p className="text-lg font-black text-gray-900">{stats.correct}/{stats.total}</p>
                        </div>

                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Chuỗi</p>
                            <p className={`text-lg font-black ${stats.streak >= 5 ? 'text-orange-500' : 'text-gray-700'}`}>
                                {stats.streak >= 3 && '🔥'} {stats.streak}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowStatsDashboard(!showStatsDashboard)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <BarChart3 className="w-5 h-5 text-gray-600" />
                        </button>

                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            {soundEnabled ? (
                                <Volume2 className="w-5 h-5 text-gray-600" />
                            ) : (
                                <VolumeX className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            {isPaused ? (
                                <Play className="w-5 h-5 text-gray-600" />
                            ) : (
                                <Pause className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Keyboard hint */}
            <div className="hidden md:flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 py-1.5 text-xs text-blue-700 font-medium">
                <Keyboard className="w-3.5 h-3.5" />
                <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded">1-4</kbd> chọn ·
                <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded">H</kbd> hint ·
                <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded">Enter</kbd> tiếp ·
                <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded">P</kbd> tạm dừng ·
                <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded">S</kbd> thống kê ·
                <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded">Esc</kbd> thoát
            </div>

            {/* Content */}
            <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex gap-6">
                <div className="flex-1 flex flex-col justify-center">
                    {loadState === 'loading' && (
                        <div className="text-center py-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"
                            />
                            <h3 className="text-xl font-bold text-gray-800">Đang khởi động AI...</h3>
                            <p className="text-gray-500 mt-2">Chuẩn bị môi trường luyện tập tối ưu</p>
                        </div>
                    )}

                    {loadState === 'error' && (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-lg border border-red-100">
                            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800">Lỗi kết nối</h3>
                            <p className="text-gray-500 mt-2 mb-6">Không thể tải câu hỏi. Vui lòng thử lại.</p>
                            <button
                                onClick={handleRetry}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Thử lại
                            </button>
                        </div>
                    )}

                    {loadState === 'idle' && allQuestions.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
                            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800">Chưa có câu hỏi</h3>
                            <p className="text-gray-500 mt-2 mb-6">Đang cập nhật ngân hàng câu hỏi.</p>
                            <button
                                onClick={() => setSelectedSubject(null)}
                                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold"
                            >
                                Quay lại
                            </button>
                        </div>
                    )}

                    {loadState === 'idle' && currentQuestion && !isPaused && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Streak celebration */}
                                <AnimatePresence>
                                    {stats.streak > 0 && stats.streak === stats.bestStreak && stats.streak % 5 === 0 && (
                                        <motion.div
                                            key={`streak-${stats.streak}`}
                                            initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                            className="mb-4 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-2xl py-3 px-6 flex items-center justify-center gap-3 shadow-xl"
                                        >
                                            <Trophy className="w-6 h-6" />
                                            <span className="font-black text-lg">
                                                {getEncouragementMessage(stats.streak)}
                                            </span>
                                            <Flame className="w-6 h-6" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <QuestionCard
                                    question={currentQuestion}
                                    onAnswer={handleAnswer}
                                    userAnswer={userAnswer}
                                    eliminatedOptions={eliminatedOptions}
                                    timeLeft={timeLeft}
                                    gameMode={gameMode}
                                />

                                {userAnswer && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 flex items-center justify-between"
                                    >
                                        <p className="hidden md:block text-xs text-gray-400">
                                            Nhấn <kbd className="px-1 py-0.5 bg-gray-100 border rounded">Enter</kbd> để tiếp tục
                                        </p>
                                        <button
                                            onClick={handleNext}
                                            className="ml-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-xl active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                        >
                                            Câu tiếp theo
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {isPaused && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 bg-white rounded-3xl shadow-lg"
                        >
                            <Pause className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Đã tạm dừng</h3>
                            <p className="text-gray-600 mb-6">Nghỉ ngơi một chút và quay lại khi sẵn sàng</p>
                            <button
                                onClick={() => setIsPaused(false)}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Tiếp tục
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block w-80 space-y-4">
                    {/* Power-ups */}
                    {gameMode !== 'zen' && (
                        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                            <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                <Lightning className="w-4 h-4 text-purple-600" />
                                Power-ups
                            </h4>
                            <div className="space-y-2">
                                {powerUps.map((powerUp) => (
                                    <PowerUpButton
                                        key={powerUp.id}
                                        powerUp={powerUp}
                                        onUse={() => handlePowerUp(powerUp.id)}
                                        disabled={!!userAnswer}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats mini */}
                    {stats.total > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                            <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                Thống kê nhanh
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-600">Độ chính xác</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {Math.round((stats.correct / stats.total) * 100)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-600">Thời gian TB</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {(stats.avgTime / 1000).toFixed(1)}s
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-600">Hoàn hảo</span>
                                    <span className="text-sm font-bold text-orange-600">{stats.perfectAnswers}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-blue-900 mb-1">💡 Mẹo học tập</p>
                                <p className="text-xs text-blue-700">
                                    Đọc kỹ câu hỏi trước khi chọn đáp án. Suy nghĩ logic sẽ giúp bạn trả lời đúng hơn!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Stats Dashboard Modal */}
            <AnimatePresence>
                {showStatsDashboard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowStatsDashboard(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-2xl w-full"
                        >
                            <StatsDashboard stats={stats} history={history} />
                            <button
                                onClick={() => setShowStatsDashboard(false)}
                                className="mt-4 w-full py-3 bg-white hover:bg-gray-50 rounded-xl font-bold text-gray-700 transition-colors"
                            >
                                Đóng
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Achievement Toast */}
            <AnimatePresence>
                {showAchievement && <AchievementToast achievement={showAchievement} />}
            </AnimatePresence>

            {/* Exit Dialog */}
            <AnimatePresence>
                {showExitDialog && (
                    <ExitDialog onConfirm={handleExitConfirm} onCancel={() => setShowExitDialog(false)} stats={stats} />
                )}
            </AnimatePresence>
        </div>
    );
}