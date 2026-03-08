'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { fetchQuizzesByAuthor, assignTestToClass, assignDocumentToClass } from '@/services/googleSheetService';
import { Icon } from '@/components/shared/Icon';
import type { UserQuiz } from '@/types';

export default function MyTestsPage() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classIdToAssign = searchParams.get('classIdToAssign');

  const [quizzes, setQuizzes] = useState<UserQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'upload'>(searchParams.get('tab') === 'upload' ? 'upload' : 'quizzes');
  
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docDueDate, setDocDueDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Assign Quiz state
  const [assigningQuizId, setAssigningQuizId] = useState<string | null>(null);
  const [quizDueDate, setQuizDueDate] = useState('');

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const data = await fetchQuizzesByAuthor(currentUser.Email);
        setQuizzes(data);
      } catch (error) {
        console.error(error);
        addToast('Không thể tải danh sách bài kiểm tra.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadQuizzes();
  }, [currentUser, addToast]);

  const handleAssignQuiz = async (quizId: string) => {
    if (!classIdToAssign) return;
    if (!quizDueDate) {
      addToast('Vui lòng chọn hạn nộp bài.', 'info');
      return;
    }

    setAssigningQuizId(quizId);
    try {
      const result = await assignTestToClass(classIdToAssign, quizId, quizDueDate);
      if (result.success) {
        addToast('Đã giao bài kiểm tra thành công!', 'success');
        router.push(`/classroom/${classIdToAssign}`);
      } else {
        addToast(result.error || 'Giao bài thất bại.', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối.', 'error');
    } finally {
      setAssigningQuizId(null);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classIdToAssign) return;
    if (!file) {
      addToast('Vui lòng chọn file.', 'info');
      return;
    }
    if (!docTitle.trim()) {
      addToast('Vui lòng nhập tiêu đề tài liệu.', 'info');
      return;
    }

    setIsUploading(true);
    try {
      const result = await assignDocumentToClass(classIdToAssign, file, docTitle, docDesc, docDueDate, currentUser?.Email || '');
      if (result.success) {
        addToast('Đã giao tài liệu thành công!', 'success');
        router.push(`/classroom/${classIdToAssign}`);
      } else {
        addToast(result.error || 'Giao tài liệu thất bại.', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-gray-600">Vui lòng đăng nhập để quản lý bài kiểm tra.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {classIdToAssign ? (
            <Link href={`/classroom/${classIdToAssign}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors font-medium">
              <Icon name="arrowLeft" className="w-4 h-4" />
              Quay lại lớp học
            </Link>
          ) : (
            <Link href="/classroom" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors font-medium">
              <Icon name="arrowLeft" className="w-4 h-4" />
              Quay lại danh sách lớp
            </Link>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kho bài kiểm tra & Tài liệu</h1>
              {classIdToAssign && (
                <p className="text-blue-600 font-medium mt-1">
                  Đang giao bài cho lớp: <span className="font-bold">{classIdToAssign}</span>
                </p>
              )}
            </div>
            {!classIdToAssign && (
              <Link href="/tests/create" className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2">
                <Icon name="plus" className="w-4 h-4" />
                Tạo đề thi mới
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`pb-3 px-4 font-bold text-sm transition-colors relative ${
              activeTab === 'quizzes' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bài kiểm tra của tôi
            {activeTab === 'quizzes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
          </button>
          {classIdToAssign && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-4 font-bold text-sm transition-colors relative ${
                activeTab === 'upload' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Giao tài liệu mới
              {activeTab === 'upload' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Đang tải...</div>
            ) : quizzes.length > 0 ? (
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.quizId} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{quiz.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{quiz.description || 'Không có mô tả'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Icon name="clock" className="w-3 h-3" /> {quiz.timeLimit} phút</span>
                        <span className="flex items-center gap-1"><Icon name="list" className="w-3 h-3" /> {quiz.questions.length} câu hỏi</span>
                        <span className="flex items-center gap-1"><Icon name="calendar" className="w-3 h-3" /> {new Date(quiz.createdAt || '').toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    {classIdToAssign && (
                      <div className="flex flex-col sm:items-end gap-2 min-w-[200px]">
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Hạn nộp:</span>
                          <input 
                            type="date" 
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) => setQuizDueDate(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => handleAssignQuiz(quiz.quizId)}
                          disabled={assigningQuizId === quiz.quizId}
                          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {assigningQuizId === quiz.quizId ? 'Đang xử lý...' : 'Giao bài này'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Icon name="file-text" className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có bài kiểm tra nào</h3>
                <p className="text-gray-500 mb-6">Hãy tạo bài kiểm tra đầu tiên của bạn để bắt đầu.</p>
                <Link href="/tests/create" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                  Tạo đề thi ngay
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && classIdToAssign && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Icon name="upload-cloud" className="w-6 h-6 text-blue-600" />
              Tải lên tài liệu cho lớp học
            </h2>
            
            <form onSubmit={handleUploadDocument} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề tài liệu <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="Ví dụ: Đề cương ôn tập Toán chương 1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả (Tùy chọn)</label>
                <textarea 
                  value={docDesc}
                  onChange={e => setDocDesc(e.target.value)}
                  placeholder="Mô tả nội dung tài liệu..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hạn xem/nộp (Tùy chọn)</label>
                <input 
                  type="date" 
                  value={docDueDate}
                  onChange={e => setDocDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Chọn file <span className="text-red-500">*</span></label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        if (!docTitle) setDocTitle(f.name);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="pointer-events-none">
                    <Icon name="upload" className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    {file ? (
                      <div>
                        <p className="font-bold text-blue-600">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Kéo thả hoặc click để chọn file (PDF, Word, Excel...)</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isUploading || !file || !docTitle}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Icon name="send" className="w-5 h-5" />
                      Giao tài liệu ngay
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}