import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import Providers from '@/components/Providers';
import { GlobalTools } from '@/components/GlobalTools';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'SuniSVG - Nền tảng học tập trực tuyến',
  description: 'Thư viện học tập lớn, cung cấp tài liệu, đề thi và luyện tập.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://qr.sepay.vn" />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900" suppressHydrationWarning>
        <Providers>
          <GlobalTools />
          {children}
        </Providers>
      </body>
    </html>
  );
}
