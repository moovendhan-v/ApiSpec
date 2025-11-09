import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from "@/components/theme-provider"
// import { Toast } from '@/components/ui/use-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'API Specs Manager',
  description: 'Manage and share your API specifications with your team',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-white">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <SessionProvider>
          <ThemeProvider attribute="class">
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
          </ThemeProvider>
          {/* <Toast /> */}
        </SessionProvider>
      </body>
    </html>
  );
}

