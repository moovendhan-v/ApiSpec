'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

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
            <LayoutContent>{children}</LayoutContent>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define paths where header should be hidden
  const hideHeaderPaths = [
    '/openapi/',
    // Add more paths here as needed
  ];
  
  // Check if current path starts with any of the hide header paths
  const hideHeader = hideHeaderPaths.some(path => pathname?.startsWith(path));
  
  return (
    <div className={hideHeader ? "h-screen flex flex-col overflow-hidden" : "min-h-screen flex flex-col"}>
      {!hideHeader && <Header />}
      <main className={hideHeader ? "flex-1 overflow-hidden" : "flex-1"}>
        {children}
      </main>
    </div>
  );
}