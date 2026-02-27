import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';

export const metadata = {
  title: 'Yaruki - Japanese Language Learning for Burmese Speakers',
  description: 'Learn Japanese with confidence. A modern learning platform designed specifically for Burmese speakers.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const t = localStorage.getItem('yaruki_theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          `
        }} />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
