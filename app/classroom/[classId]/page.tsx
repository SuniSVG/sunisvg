'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getClassDetails, batchAddStudents } from '@/services/googleSheetService';
import { Icon } from '@/components/shared/Icon';
import { useToast } from '@/contexts/ToastContext';
import type { Classroom, ClassMember, AssignedQuiz, NewStudentCredential } from '@/types';

type Tab = 'assignments' | 'members';

const MemberList: React.FC<{ members: ClassMember[]; creatorEmail: string }> = ({ members, creatorEmail }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-4">
            {members.map(member => (
                <div key={member.email} className="text-center">
                    <div className="relative w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center font-bold text-2xl text-gray-500 mx-auto">
                        {member.name.charAt(0).toUpperCase()}
                        {member.email === creatorEmail && (
                            <span className="absolute bottom-0 right-0 bg-blue-500 p-1.5 rounded-full ring-2 ring-white" title="Giáo viên">
                                <Icon name="star" className="w-3 h-3 text-white"/>
                            </span>
                        )}
                    </div>
                    <p className="font-medium text-gray-800 mt-3 truncate" title={member.name}>{member.name}</p>
                    <p className="text-xs text-gray-500 truncate" title={member.email}>{member.email}</p>
                </div>
            ))}
        </div>
    </div>
);

const AssignmentList: React.FC<{ quizzes: AssignedQuiz[]; classId: string; isCreator: boolean }> = ({ quizzes, classId, isCreator }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        {isCreator && (
            <div className="text-right">
                <Link href={`/tests/my-tests?classIdToAssign=${classId}`} className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700">
                    <Icon name="plus" className="w-5 h-5" />
                    Giao bài kiểm tra
                </Link>
            </div>
        )}
        {quizzes.length > 0 ? (
            quizzes.map(quiz => (
                <div key={quiz.quizId} className="border p-4 rounded-md flex justify-between items-center hover:bg-gray-50">
                    <div>
                        <p className="font-bold text-gray-800">{quiz.title}</p>
                        <p className="text-sm text-gray-500">
                            {quiz.questionCount} câu hỏi • {quiz.results?.length || 0} lượt làm • Hạn chót: {quiz.dueDate ? new Date(quiz.dueDate).toLocaleDateString('vi-VN') : 'Không có'}
                        </p>
                    </div>
                    <Link href={`/tests/take?id=${quiz.quizId}`} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300">
                        Làm bài
                    </Link>
                </div>
            ))
        ) : (
            <p className="text-center text-gray-500 py-8">Chưa có bài tập nào được giao.</p>
        )}
    </div>
);

const AddStudentsModal: React.FC<{ classId: string, onClose: () => void, onStudentsAdded: () => void }> = ({ classId, onClose, onStudentsAdded }) => {
    const [names, setNames] = useState<string[]>([]);
    const [currentName, setCurrentName] = useState('');
    const [modalState, setModalState] = useState<'input' | 'creating' | 'results'>('input');
    const [createdCredentials, setCreatedCredentials] = useState<NewStudentCredential[]>([]);
    const { addToast } = useToast();

    const handleAddName = () => {
        if (currentName.trim()) {
            setNames(prev => [...prev, currentName.trim()]);
            setCurrentName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddName();
        }
    };

    const handleRemoveName = (index: number) => {
        setNames(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreateAccounts = async () => {
        if (names.length === 0) {
            addToast('Vui lòng thêm ít nhất một tên học sinh.', 'error');
            return;
        }
        setModalState('creating');
        try {
            const result = await batchAddStudents(classId, names);
            if (result.success && result.createdStudents) {
                setCreatedCredentials(result.createdStudents);
                setModalState('results');
                onStudentsAdded(); // Notify parent to refresh member list
            } else {
                addToast(result.error || 'Tạo tài khoản thất bại.', 'error');
                setModalState('input');
            }
        } catch (err: any) {
            addToast(err.message, 'error');
            setModalState('input');
        }
    };
    
    const copyCredentials = () => {
        const text = createdCredentials.map(c => `Tên: ${c.name}\nEmail: ${c.email}\nPassword: ${c.password}`).join('\n\n');
        navigator.clipboard.writeText(text);
        addToast('Đã sao chép thông tin tài khoản!', 'success');
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {modalState === 'results' ? 'Tài khoản đã tạo' : 'Thêm học sinh'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><Icon name="close" className="w-5 h-5"/></button>
                </header>
                
                <main className="p-6 overflow-y-auto">
                    {modalState === 'input' && (
                        <>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={currentName}
                                    onChange={e => setCurrentName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nhập họ và tên học sinh..."
                                    className="flex-grow p-2 border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button onClick={handleAddName} className="bg-blue-600 text-white font-semibold px-4 rounded-md hover:bg-blue-700">Thêm</button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {names.map((name, index) => (
                                    <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                        <span>{name}</span>
                                        <button onClick={() => handleRemoveName(index)} className="text-red-500 hover:text-red-700 p-1"><Icon name="trash" className="w-5 h-5"/></button>
                                    </div>
                                ))}
                                {names.length === 0 && <p className="text-center text-gray-500 py-4">Nhấn Enter hoặc nút &quot;Thêm&quot; để thêm học sinh vào danh sách.</p>}
                            </div>
                        </>
                    )}
                    {modalState === 'creating' && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Đang tạo tài khoản và ghi danh học sinh...</p>
                        </div>
                    )}
                    {modalState === 'results' && (
                        <div>
                            <p className="mb-4 text-green-700 bg-green-50 p-3 rounded-md">Đã tạo thành công <span className="font-bold">{createdCredentials.length}</span> tài khoản. Vui lòng sao chép và gửi thông tin này cho học sinh của bạn.</p>
                            <div className="max-h-80 overflow-y-auto border rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Tên</th>
                                            <th className="px-4 py-2">Email</th>
                                            <th className="px-4 py-2">Mật khẩu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {createdCredentials.map(cred => (
                                            <tr key={cred.email} className="border-b">
                                                <td className="px-4 py-2 font-medium">{cred.name}</td>
                                                <td className="px-4 py-2 font-mono">{cred.email}</td>
                                                <td className="px-4 py-2 font-mono">{cred.password}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
                
                <footer className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    {modalState === 'input' && (
                        <>
                            <button onClick={onClose} className="px-4 py-2 bg-white border rounded-md">Hủy</button>
                            <button onClick={handleCreateAccounts} disabled={names.length === 0} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400">Tạo tài khoản</button>
                        </>
                    )}
                    {modalState === 'results' && (
                        <>
                            <button onClick={onClose} className="px-4 py-2 bg-white border rounded-md">Đóng</button>
                            <button onClick={copyCredentials} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Sao chép tất cả</button>
                        </>
                    )}
                </footer>
                 <style>{`
                    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                `}</style>
            </div>
        </div>
    );
};


export default function ClassDetailPage() {
    const params = useParams();
    const classId = params.classId as string;
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const router = useRouter();

    const [classInfo, setClassInfo] = useState<Classroom | null>(null);
    const [members, setMembers] = useState<ClassMember[]>([]);
    const [quizzes, setQuizzes] = useState<AssignedQuiz[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('assignments');
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    
    const fetchDetails = useCallback(async () => {
        if (!classId) {
            setError("ID lớp học không hợp lệ.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const result = await getClassDetails(classId);
            if (result) {
                setClassInfo(result.info);
                setMembers(result.members.sort((a,b) => a.name.localeCompare(b.name)));
                setQuizzes(result.quizzes.sort((a,b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()));
            } else {
                setError("Không tìm thấy thông tin lớp học.");
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải dữ liệu lớp học.');
        } finally {
            setIsLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const isCreator = currentUser?.Email === classInfo?.CreatorEmail;
    
    if (isLoading) {
        return <div className="text-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"/></div>;
    }
    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-10">
                <div className="text-center p-10 text-red-500 bg-red-50 rounded-2xl border border-red-200">
                    <Icon name="alert-circle" className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
                    <p>{error}</p>
                    <button onClick={() => router.push('/classroom')} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg">Quay lại danh sách</button>
                </div>
            </div>
        );
    }
    if (!classInfo) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 px-4 py-12">
            <header className="bg-white p-6 rounded-2xl shadow-lg border">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-800">{classInfo.ClassName}</h1>
                        <p className="mt-2 text-gray-600">{classInfo.Subject}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2" title="Mã tham gia">
                        <span className="font-mono text-lg tracking-wider text-gray-700">{classInfo.JoinCode}</span>
                        <button onClick={() => { navigator.clipboard.writeText(classInfo.JoinCode); addToast('Đã sao chép mã!', 'info'); }} className="p-2 rounded-md hover:bg-gray-200"><Icon name="document" className="w-5 h-5"/></button>
                    </div>
                </div>
                <p className="mt-4 text-gray-500">{classInfo.Description}</p>
            </header>
            
            <div className="flex border-b">
                <button onClick={() => setActiveTab('assignments')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'assignments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Bài tập ({quizzes.length})</button>
                <button onClick={() => setActiveTab('members')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'members' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Thành viên ({members.length})</button>
                {isCreator && <button onClick={() => setIsAddStudentModalOpen(true)} className="ml-auto px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-md hover:bg-green-200 self-center">Thêm học sinh</button>}
            </div>

            <div>
                {activeTab === 'assignments' && <AssignmentList quizzes={quizzes} classId={classId!} isCreator={isCreator} />}
                {activeTab === 'members' && <MemberList members={members} creatorEmail={classInfo.CreatorEmail} />}
            </div>

            {isAddStudentModalOpen && (
                <AddStudentsModal 
                    classId={classId!} 
                    onClose={() => setIsAddStudentModalOpen(false)} 
                    onStudentsAdded={() => {
                        addToast('Đã thêm học sinh, đang làm mới danh sách...', 'info');
                        fetchDetails(); // Refetch data
                    }}
                />
            )}
        </div>
    );
}
