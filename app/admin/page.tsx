'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Settings, 
    FileText, 
    HelpCircle, 
    Search, 
    ArrowUp, 
    ArrowDown, 
    Eye, 
    Edit, 
    ChevronLeft, 
    ChevronRight 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllQuestions, fetchArticles, updateArticleStatus, updateArticleFeedback } from '@/services/googleSheetService';
import type { AnyQuestion, ScientificArticle } from '@/types';
import { parseVNDateToDate } from '@/utils/dateUtils';

type SortDirection = 'ascending' | 'descending';
type QuestionSortKeys = keyof AnyQuestion;
type ArticleSortKeys = keyof ScientificArticle;
type SortConfig<K> = { key: K | null; direction: SortDirection };

const SortableHeader = <K extends string>({
  name,
  sortConfig,
  onSort,
  children,
}: {
  name: K;
  sortConfig: SortConfig<string>;
  onSort: (key: any) => void;
  children: React.ReactNode;
}) => {
  const isSorted = sortConfig.key === name;
  const DirectionIcon = sortConfig.direction === 'ascending' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className="px-6 py-3">
      <button onClick={() => onSort(name)} className="flex items-center gap-1.5 group font-bold text-gray-700 hover:text-gray-900">
        {children}
        <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
            {isSorted ? (
              <DirectionIcon className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4 opacity-30" />
            )}
        </span>
      </button>
    </th>
  );
};

const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    return (
        <div className="mt-6 flex justify-end items-center space-x-2 p-4 border-t border-gray-100">
             <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    )
}

const FeedbackModal: React.FC<{
  article: ScientificArticle;
  onClose: () => void;
  onSave: (articleId: string, feedback: string) => Promise<void>;
}> = ({ article, onClose, onSave }) => {
    const [feedback, setFeedback] = useState(article.Feedback || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        await onSave(article.ID, feedback);
        setIsLoading(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2 text-gray-900">Góp ý cho tài liệu</h2>
              <p className="text-sm text-gray-500 mb-4 truncate font-medium" title={article.Title}>&quot;{article.Title}&quot;</p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder="Nhập phản hồi của bạn ở đây..."
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                Hủy
              </button>
              <button type="button" onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-blue-600 border border-transparent rounded-xl text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-lg shadow-blue-200">
                {isLoading ? 'Đang lưu...' : 'Lưu góp ý'}
              </button>
            </div>
        </div>
      </div>
    );
};

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'articles' | 'questions'>('articles');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [currentArticleForFeedback, setCurrentArticleForFeedback] = useState<ScientificArticle | null>(null);
  const { currentUser } = useAuth();

  // Data state
  const [questions, setQuestions] = useState<AnyQuestion[]>([]);
  const [articles, setArticles] = useState<ScientificArticle[]>([]);

  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);

  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  // Question table state
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionType, setQuestionType] = useState('All');
  const [questionPage, setQuestionPage] = useState(1);
  const [questionSort, setQuestionSort] = useState<SortConfig<QuestionSortKeys>>({ key: 'type', direction: 'ascending' });
  const QUESTIONS_PER_PAGE = 10;
  
  // Article table state
  const [articleSearch, setArticleSearch] = useState('');
  const [articleStatus, setArticleStatus] = useState('All');
  const [articlePage, setArticlePage] = useState(1);
  const [articleSort, setArticleSort] = useState<SortConfig<ArticleSortKeys>>({ key: 'SubmissionDate', direction: 'descending' });
  const ARTICLES_PER_PAGE = 10;


  useEffect(() => {
    const loadData = async () => {
      setQuestionsLoading(true);
      try {
        const questionData = await fetchAllQuestions();
        setQuestions(questionData);
      } catch (err) {
        setQuestionsError('Không thể tải danh sách câu hỏi.');
        console.error(err);
      } finally {
        setQuestionsLoading(false);
      }

      setArticlesLoading(true);
      try {
        const articleData = await fetchArticles();
        setArticles(articleData);
      } catch (err) {
        setArticlesError('Không thể tải danh sách tài liệu.');
        console.error(err);
      } finally {
        setArticlesLoading(false);
      }
    };
    loadData();
  }, []);

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    const originalArticles = articles;
    setArticles(prev => prev.map(art => art.ID === articleId ? { ...art, Status: newStatus } : art));

    const result = await updateArticleStatus(articleId, newStatus);
    if (!result.success) {
      setArticles(originalArticles);
      alert(`Lỗi khi cập nhật trạng thái: ${result.error}`);
    }
  };

  const handleSaveFeedback = async (articleId: string, feedback: string) => {
    const originalArticles = articles;
    // Optimistic update
    setArticles(prev => prev.map(art => art.ID === articleId ? { ...art, Feedback: feedback } : art));
    setIsFeedbackModalOpen(false);
    setCurrentArticleForFeedback(null);

    const result = await updateArticleFeedback(articleId, feedback);
    if (!result.success) {
      setArticles(originalArticles);
      alert(`Lỗi khi cập nhật phản hồi: ${result.error}`);
    }
  };


  // Memoized data processing for questions
  const processedQuestions = useMemo(() => {
    let filtered = questions
        .filter(q => questionType === 'All' || q.type === questionType)
        .filter(q => q.Question_Text.toLowerCase().includes(questionSearch.toLowerCase()));

    if (questionSort.key) {
        filtered.sort((a, b) => {
            const { key, direction } = questionSort;
            const asc = direction === 'ascending' ? 1 : -1;

            const aVal = a[key!];
            const bVal = b[key!];
            
            if (aVal === undefined || aVal === null) return 1 * asc;
            if (bVal === undefined || bVal === null) return -1 * asc;

            const valA = typeof aVal === 'string' ? String(aVal).toLowerCase() : aVal;
            const valB = typeof bVal === 'string' ? String(bVal).toLowerCase() : bVal;

            if (valA < valB) return -1 * asc;
            if (valA > valB) return 1 * asc;
            return 0;
        });
    }
    return filtered;
  }, [questions, questionSearch, questionType, questionSort]);

  // Memoized data processing for articles
    const processedArticles = useMemo(() => {
        let filtered = articles
            .filter(art => articleStatus === 'All' || art.Status === articleStatus)
            .filter(art =>
                art.Title.toLowerCase().includes(articleSearch.toLowerCase()) ||
                art.Authors.toLowerCase().includes(articleSearch.toLowerCase()) ||
                art.SubmitterEmail.toLowerCase().includes(articleSearch.toLowerCase())
            );

        if (articleSort.key) {
            filtered.sort((a, b) => {
                const { key, direction } = articleSort;
                const asc = direction === 'ascending' ? 1 : -1;

                if (key === 'SubmissionDate') {
                    const timeA = parseVNDateToDate(a.SubmissionDate)?.getTime() || 0;
                    const timeB = parseVNDateToDate(b.SubmissionDate)?.getTime() || 0;
                    return (timeA - timeB) * asc;
                }

                const aVal = a[key!];
                const bVal = b[key!];

                if (aVal === undefined || aVal === null) return 1 * asc;
                if (bVal === undefined || bVal === null) return -1 * asc;

                const valA = typeof aVal === 'string' ? aVal.toLowerCase() : aVal;
                const valB = typeof bVal === 'string' ? bVal.toLowerCase() : bVal;

                if (valA < valB) return -1 * asc;
                if (valA > valB) return 1 * asc;
                return 0;
            });
        }
        return filtered;
    }, [articles, articleSearch, articleStatus, articleSort]);
  
  const handleQuestionSort = (key: QuestionSortKeys) => {
    setQuestionSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
  };
  
  const handleArticleSort = (key: ArticleSortKeys) => {
    setArticleSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
  };
  
  const renderQuestionsTab = () => {
    const totalPages = Math.ceil(processedQuestions.length / QUESTIONS_PER_PAGE);
    const paginatedQuestions = processedQuestions.slice((questionPage - 1) * QUESTIONS_PER_PAGE, questionPage * QUESTIONS_PER_PAGE);
    const questionTypes = ['All', 'Anatomy', 'Medicine', 'Pharmacy'];

    return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 self-start sm:self-center flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            Danh sách câu hỏi
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Tìm câu hỏi..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={questionSearch}
                    onChange={e => { setQuestionSearch(e.target.value); setQuestionPage(1); }}
                />
             </div>
             <select
                className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                value={questionType}
                onChange={e => { setQuestionType(e.target.value); setQuestionPage(1); }}
            >
                {questionTypes.map(type => <option key={type} value={type}>{type === 'All' ? 'Tất cả loại' : type}</option>)}
            </select>
        </div>
      </div>
      {questionsLoading ? (
          <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
      ) : questionsError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">{questionsError}</div>
      ) : (
        <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader name="Question_Text" sortConfig={questionSort} onSort={handleQuestionSort}>Câu hỏi</SortableHeader>
                <SortableHeader name="type" sortConfig={questionSort} onSort={handleQuestionSort}>Loại</SortableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedQuestions.length > 0 ? paginatedQuestions.map((q, index) => (
                <tr key={`${q.ID}-${index}`} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-4xl truncate" title={q.Question_Text}>{q.Question_Text}</td>
                  <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          q.type === 'Anatomy' ? 'bg-purple-100 text-purple-800' :
                          q.type === 'Medicine' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                      }`}>
                          {q.type}
                      </span>
                  </td>
                </tr>
              )) : (
                  <tr>
                      <td colSpan={2} className="text-center py-12 text-gray-500">
                         <div className="flex flex-col items-center gap-2">
                             <HelpCircle className="w-8 h-8 text-gray-300" />
                             <p>{questions.length > 0 ? 'Không tìm thấy câu hỏi phù hợp.' : 'Chưa có câu hỏi nào.'}</p>
                         </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
          <Pagination currentPage={questionPage} totalPages={totalPages} onPageChange={setQuestionPage} />
        </div>
      )}
    </div>
  )};

   const renderArticlesTab = () => {
        const totalPages = Math.ceil(processedArticles.length / ARTICLES_PER_PAGE);
        const paginatedArticles = processedArticles.slice((articlePage - 1) * ARTICLES_PER_PAGE, articlePage * ARTICLES_PER_PAGE);
        const articleStatuses = ['All', 'Pending', 'Approved', 'Rejected'];

        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 self-start sm:self-center flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-500" />
                        Danh sách tài liệu
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={articleSearch}
                                onChange={e => { setArticleSearch(e.target.value); setArticlePage(1); }}
                            />
                        </div>
                        <select
                            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                            value={articleStatus}
                            onChange={e => { setArticleStatus(e.target.value); setArticlePage(1); }}
                        >
                            {articleStatuses.map(status => <option key={status} value={status}>{status === 'All' ? 'Tất cả trạng thái' : status}</option>)}
                        </select>
                    </div>
                </div>
                {articlesLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : articlesError ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">{articlesError}</div>
                ) : (
                    <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <SortableHeader name="Title" sortConfig={articleSort} onSort={handleArticleSort}>Tiêu đề</SortableHeader>
                                    <SortableHeader name="SubmitterEmail" sortConfig={articleSort} onSort={handleArticleSort}>Người đăng</SortableHeader>
                                    <SortableHeader name="SubmissionDate" sortConfig={articleSort} onSort={handleArticleSort}>Ngày đăng</SortableHeader>
                                    <SortableHeader name="Status" sortConfig={articleSort} onSort={handleArticleSort}>Trạng thái</SortableHeader>
                                    <th scope="col" className="px-6 py-3 font-bold text-gray-700">Phản hồi</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-gray-700 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedArticles.length > 0 ? paginatedArticles.map(article => (
                                    <tr key={article.ID} className="bg-white hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                                            <Link 
                                                href={`/article/${article.ID}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="hover:text-blue-600 hover:underline flex items-center gap-2"
                                                title={article.Title}
                                            >
                                                {article.Title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 max-w-[150px] truncate" title={article.SubmitterEmail}>{article.SubmitterEmail}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{article.SubmissionDate}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={article.Status}
                                                onChange={(e) => handleStatusChange(article.ID, e.target.value)}
                                                className={`w-full p-1.5 rounded-lg border text-xs font-bold focus:ring-2 focus:ring-blue-400 cursor-pointer transition-colors ${
                                                    article.Status === 'Approved' ? 'bg-green-100 border-green-200 text-green-700' :
                                                    article.Status === 'Pending' ? 'bg-yellow-100 border-yellow-200 text-yellow-700' :
                                                    article.Status === 'Rejected' ? 'bg-red-100 border-red-200 text-red-700' :
                                                    'bg-gray-100 border-gray-200 text-gray-700'
                                                }`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 max-w-xs">
                                                <span className="truncate text-gray-500 flex-1" title={article.Feedback}>{article.Feedback || 'Chưa có'}</span>
                                                <button onClick={() => { setCurrentArticleForFeedback(article); setIsFeedbackModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Sửa phản hồi">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                           <Link href={article.DocumentURL.startsWith('text://') ? `/article/${article.ID}` : article.DocumentURL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-medium transition-colors bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs" title="Xem nội dung">
                                              <Eye className="w-4 h-4" /> Xem
                                           </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="w-8 h-8 text-gray-300" />
                                                <p>{articles.length > 0 ? 'Không tìm thấy tài liệu phù hợp.' : 'Chưa có tài liệu nào.'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination currentPage={articlePage} totalPages={totalPages} onPageChange={setArticlePage} />
                    </div>
                )}
            </div>
        );
    };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản trị nội dung</h1>
            <p className="text-gray-500 mt-1">Quản lý tài liệu và câu hỏi trên hệ thống</p>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-blue-50 rounded-xl h-12 w-12 flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-600" />
            </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex p-1 gap-1 bg-gray-100/50 rounded-xl">
          <button
            onClick={() => setActiveTab('articles')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === 'articles' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <FileText className="w-5 h-5" />
            Tài liệu ({processedArticles.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg transition-all ${activeTab === 'questions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            <HelpCircle className="w-5 h-5" />
            Câu hỏi ({processedQuestions.length})
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {activeTab === 'articles' && renderArticlesTab()}
          {activeTab === 'questions' && renderQuestionsTab()}
        </div>
      </div>
      
      {isFeedbackModalOpen && currentArticleForFeedback && (
        <FeedbackModal
            article={currentArticleForFeedback}
            onClose={() => setIsFeedbackModalOpen(false)}
            onSave={handleSaveFeedback}
        />
      )}
    </div>
  );
};

export default AdminPage;
