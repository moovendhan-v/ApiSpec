'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SignOutButton } from '@/components/auth/sign-out-button';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          API Specs
        </Link>
        
        <nav className="flex items-center space-x-4">
          {session ? (
            <>
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link 
                href="/teams" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Teams
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link 
              href="/auth/signin" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
