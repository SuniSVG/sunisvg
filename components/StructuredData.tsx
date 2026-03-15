import type { ScientificArticle } from '@/types';

// Helper tạo slug (để tái sử dụng)
export const slugify = (text: string) => {
    if (!text) return '';
    return text.toString().toLowerCase()
        .normalize('NFD') 
        .replace(/[\u0300-\u036f]/g, '') 
        .replace(/[đĐ]/g, 'd')
        .replace(/\s+/g, '-') 
        .replace(/[^\w\-]+/g, '') 
        .replace(/\-\-+/g, '-') 
        .replace(/^-+/, '') 
        .replace(/-+$/, '');
};

export default function StructuredData({ article }: { article: ScientificArticle }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "headline": article.Title,
    "description": article.Abstract,
    "author": {
      "@type": "Person",
      "name": article.Authors || "SuniSVG"
    },
    "datePublished": article.SubmissionDate ? new Date(article.SubmissionDate.split(' ')[0].split('/').reverse().join('-')).toISOString() : undefined,
    "keywords": article.Keywords,
    "publisher": {
      "@type": "Organization",
      "name": "SuniSVG",
      "logo": {
        "@type": "ImageObject",
        "url": "https://sunisvg.edu.vn/favicon1.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://sunisvg.edu.vn/article/${slugify(article.Title)}-${article.ID}`
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema)
      }}
    />
  );
}