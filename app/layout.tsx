import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

export const metadata: Metadata = {
  title: 'Cloud Portfolio Vault | منصة المحافظ الرقمية والتخزين السحابي',
  description: 'منصة احترافية لإدارة مساحات الأعمال السحابية، رفع المجلدات المتداخلة، وتوليد روابط المشاركة الآمنة برمز PIN',
};

const cairo = localFont({
  src: [
    {
      path: '../fonts/Cairo-ExtraLight.ttf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../fonts/Cairo-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/Cairo-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Cairo-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Cairo-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/Cairo-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/Cairo-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../fonts/Cairo-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-cairo',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${cairo.variable}`}>
      <body className={`${cairo.className} bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white font-sans`}>
        {children}
      </body>
    </html>
  );
}
