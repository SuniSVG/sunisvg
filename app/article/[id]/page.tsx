import { Metadata } from 'next';
import ArticleClient from './ArticleClient';
import { fetchArticles, fetchPremiumArticles } from '@/services/googleSheetService';
import type { ScientificArticle } from '@/types';

export const revalidate = 3600;
export const dynamicParams = true; // Bật cờ này để cho phép render động các URL chưa được build sẵn

function getPreviewUrl(article: ScientificArticle): string {
    if (article.ThumbnailURL) return article.ThumbnailURL;
    if (!article.DocumentURL) return '';

    const driveMatch = article.DocumentURL.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
        return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }

    if (article.DocumentURL.includes('toanmath.com')) {
        if (article.DocumentURL.includes('/wp-content/uploads/')) {
            return article.DocumentURL.replace('.pdf', '.png');
        }
        
        const fileName = article.DocumentURL.split('/').pop()?.replace('.pdf', '.png');
        let year = '2026', month = '03';
        if (article.SubmissionDate) {
            const m = article.SubmissionDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (m) { month = m[2].padStart(2, '0'); year = m[3]; }
        }
        return `https://toanmath.com/wp-content/uploads/${year}/${month}/${fileName}`;
    }
    return '';
}

// Thêm hàm này để tạo sẵn các route tĩnh
export async function generateStaticParams() {
    // Trả về mảng rỗng để Next.js KHÔNG pre-build 45.000+ trang tĩnh lúc deploy.
    // Nhờ có dynamicParams = true, trang sẽ tự động được build ngầm (ISR) khi user truy cập.
    return [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const [allArticles, premiumArticles] = await Promise.all([
        fetchArticles(),
        fetchPremiumArticles()
    ]);
    
    const article = allArticles.find(a => a.ID === id) || premiumArticles.find(a => a.ID === id);

    if (!article) {
        return {
            title: 'Không tìm thấy tài liệu | SuniSVG',
        };
    }
    
    const ogImage = getPreviewUrl(article);

    return {
        title: `${article.Title} - SuniSVG`,
        description: article.Abstract || `Tài liệu ${article.Title} môn ${article.Category} chuẩn cấu trúc Bộ GD&ĐT.`,
        openGraph: {
            title: `${article.Title} - SuniSVG`,
            description: article.Abstract || `Tài liệu ${article.Title} môn ${article.Category}.`,
            images: ogImage ? [ogImage] : [],
            type: 'article',
        }
    };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return <ArticleClient actualId={resolvedParams.id} />;
}