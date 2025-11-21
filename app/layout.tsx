import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="dark" 
            enableSystem
            disableTransitionOnChange
          >
          <div className="min-h-screen flex flex-col">
            <Header />
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

