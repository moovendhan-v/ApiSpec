import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'API documentation for API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1a1a1a] text-white">{children}</body>
    </html>
  );
}

