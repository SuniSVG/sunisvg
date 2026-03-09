import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SuniSVG - Nền tảng học tập trực tuyến hàng đầu Việt Nam',
  description: 'Nền tảng học tập trực tuyến',
  icons: {
    icon: '/favicon1.png',
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