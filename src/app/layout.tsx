import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { THEME_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'FleetTrack',
  description: 'Record. Analyze. Grow. Daily income, expenses and performance for your fleet.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#071a52' },
    { media: '(prefers-color-scheme: dark)', color: '#050b1f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets class="dark" before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-right" theme="system" />
      </body>
    </html>
  );
}
