import { Metadata } from 'next';
import ArticleClient from './ArticleClient';

export const revalidate = 3600;
export const dynamicParams = true; // Bật cờ này để cho phép render động các URL chưa được build sẵn

// Thêm hàm này để tạo sẵn các route tĩnh
export async function generateStaticParams() {
    // Trả về mảng rỗng để Next.js KHÔNG pre-build 45.000+ trang tĩnh lúc deploy.
    // Nhờ có dynamicParams = true, trang sẽ tự động được build ngầm (ISR) khi user truy cập.
    return [];
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const id = params.id;
    
    // Lược bỏ fetch toàn bộ sheet khổng lồ tại Server để chống hoàn toàn lỗi 500 (Timeout/OOM).
    // ArticleClient ở phía trình duyệt sẽ vẫn fetch và hiển thị dữ liệu bình thường.

    return {
        title: `Tài liệu #${id} - SuniSVG`,
        description: `Xem chi tiết và tải xuống tài liệu #${id} chuẩn cấu trúc Bộ GD&ĐT tại SuniSVG.`,
        openGraph: {
            title: `Tài liệu #${id} - SuniSVG`,
            description: `Xem chi tiết tài liệu #${id} tại SuniSVG.`,
            type: 'article',
        }
    };
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
    return <ArticleClient actualId={params.id} />;
}