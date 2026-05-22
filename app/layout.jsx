import { Inter } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'AI Datasheet Explainer',
  description: 'Upload any electronics datasheet PDF and get AI-powered explanations, comparisons, and chat.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
