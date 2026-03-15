import { MetadataRoute } from 'next';
import { fetchArticlesForSitemap } from '@/services/googleSheetService';
import { slugify } from '@/components/StructuredData';

const ITEMS_PER_SITEMAP = 2000;
const MAX_SITEMAP_ITEMS = 10000; // Giới hạn chỉ đưa 10.000 bài viết vào sitemap để tránh tràn RAM

export async function generateSitemaps() {
  try {
    const articles = await fetchArticlesForSitemap();
    
    // Tính toán số lượng sitemap dựa trên giới hạn tối đa
    const totalItems = Math.min(articles.length, MAX_SITEMAP_ITEMS);
    const totalSitemaps = Math.ceil(totalItems / ITEMS_PER_SITEMAP);
    return Array.from({ length: totalSitemaps }, (_, i) => ({ id: i }));
  } catch (error) {
    return [{ id: 0 }];
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sunisvg.netlify.app';
  
  // Fetch data từ Google Sheets
  let articleUrls: MetadataRoute.Sitemap = [];
  let topicUrls: MetadataRoute.Sitemap = [];
  try {
    const allArticles = await fetchArticlesForSitemap();
    
    const limitedArticles = allArticles.slice(0, MAX_SITEMAP_ITEMS);
    
    // Cắt mảng theo ID của sitemap để không bị quá tải bộ nhớ
    const start = id * ITEMS_PER_SITEMAP;
    const end = start + ITEMS_PER_SITEMAP;
    const chunkedArticles = limitedArticles.slice(start, end);
    
    articleUrls = chunkedArticles.map((article) => ({
      url: `${baseUrl}/article/${slugify(article.Title || '')}-${article.ID}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Chỉ thêm topicUrls và static pages vào sitemap đầu tiên (id = 0)
    if (id === 0) {
      const categories = Array.from(new Set(limitedArticles.map(a => a.Category).filter(Boolean)));
      topicUrls = categories.map(cat => ({
        url: `${baseUrl}/topics/${slugify(cat || '')}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9, // Topic page rất quan trọng, ưu tiên 0.9
      }));
    }
  } catch (error) {
    console.error("Lỗi khi tạo sitemap cho articles:", error);
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = id === 0 ? [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/premium`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/my-courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/classroom`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/co-learning`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/friends`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sharing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/subscriptions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/teachers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/mobile-app`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ] : [];

  return [...staticPages, ...topicUrls, ...articleUrls];
}
