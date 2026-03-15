import { Metadata } from 'next';
import Link from 'next/link';
import { fetchArticles } from '@/services/googleSheetService';
import { slugify } from '@/components/StructuredData';
import { Folder, FileText, ArrowLeft, Calendar, User } from 'lucide-react';

// Cache trang topic trong 1 giờ
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const articles = await fetchArticles();
    
    // Tìm tên Category gốc từ slug
    const sampleArticle = articles.find(a => slugify(a.Category || '') === resolvedParams.topic);
    const categoryName = sampleArticle ? sampleArticle.Category : resolvedParams.topic;

    return {
        title: `Tổng hợp Tài liệu & Đề thi ${categoryName} | SuniSVG`,
        description: `Khám phá chuyên đề, tài liệu học tập, và đề thi thử mới nhất môn ${categoryName} được chọn lọc chuẩn cấu trúc Bộ GD&ĐT.`,
        alternates: {
            canonical: `https://sunisvg.edu.vn/topics/${resolvedParams.topic}`
        }
    };
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
    const resolvedParams = await params;
    const articles = await fetchArticles();
    
    // Lọc ra các bài viết thuộc chủ đề này & đã được duyệt
    const topicArticles = articles.filter(
        a => slugify(a.Category || '') === resolvedParams.topic && a.Status === 'Approved'
    ).sort((a, b) => new Date(b.SubmissionDate).getTime() - new Date(a.SubmissionDate).getTime()); // Mới nhất lên đầu

    const categoryName = topicArticles.length > 0 ? topicArticles[0].Category : resolvedParams.topic;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb & Header */}
                <div className="mb-8 space-y-4">
                    <Link href="/articles" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại Thư viện
                    </Link>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
                            <Folder className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">Tài liệu {categoryName}</h1>
                            <p className="text-gray-500 font-medium mt-1">Tổng hợp {topicArticles.length} tài liệu, chuyên đề và đề thi thử.</p>
                        </div>
                    </div>
                </div>

                {/* Article List - Semantic HTML cho SEO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topicArticles.map(article => (
                        <article key={article.ID} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                            <Link href={`/article/${slugify(article.Title)}-${article.ID}`} className="flex gap-4 h-full">
                                <div className="w-12 h-14 bg-red-50 rounded-xl flex items-center justify-center shrink-0 border border-red-100 group-hover:bg-red-100 transition-colors">
                                    <FileText className="w-6 h-6 text-red-500" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <h2 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mb-2">
                                        {article.Title}
                                    </h2>
                                    <div className="mt-auto flex items-center gap-4 text-xs font-semibold text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[100px]">{article.Authors || 'SuniSVG'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{article.SubmissionDate.split(' ')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </article>
                    ))}
                </div>

            </div>
        </div>
    );
}