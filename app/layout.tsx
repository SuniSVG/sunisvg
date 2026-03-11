import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://sunisvg.edu.vn'),
  title: {
    default: 'SuniSVG - Nền tảng học tập trực tuyến hàng đầu Việt Nam',
    template: '%s | SuniSVG',
  },
  description: 'SuniSVG - Nền tảng học tập trực tuyến hàng đầu Việt Nam. Học online với khóa học chất lượng cao, tài liệu miễn phí, lớp học trực tuyến và cộng đồng học tập năng động.',
  keywords: ['học tập online', 'khóa học trực tuyến', 'học miễn phí', 'tài liệu học tập', 'lớp học online', 'giáo dục Việt Nam', 'luyện thi', 'học nhóm', 'SuniSVG'],
  authors: [{ name: 'SuniSVG Team' }],
  creator: 'SuniSVG',
  publisher: 'SuniSVG',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://sunisvg.edu.vn',
    siteName: 'SuniSVG',
    title: 'SuniSVG - Nền tảng học tập trực tuyến hàng đầu Việt Nam',
    description: 'SuniSVG - Nền tảng học tập trực tuyến hàng đầu Việt Nam. Học online với khóa học chất lượng cao, tài liệu miễn phí, lớp học trực tuyến và cộng đồng học tập năng động.',
    images: [
      {
        url: 'https://sunisvg.edu.vn/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SuniSVG - Nền tảng học tập trực tuyến',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SuniSVG - Nền tảng học tập trực tuyến hàng đầu Việt Nam',
    description: 'SuniSVG - Nền tảng học tập trực tuyến hàng đầu Việt Nam. Học online với khóa học chất lượng cao.',
    images: ['https://sunisvg.edu.vn/og-image.png'],
    creator: '@sunisvg',
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
  alternates: {
    canonical: 'https://sunisvg.edu.vn',
    languages: {
      'vi': 'https://sunisvg.edu.vn',
    },
  },
  category: 'education',
  classification: 'Learning Management System',
  icons: {
    icon: '/favicon1.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className} suppressHydrationWarning={true}>
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}