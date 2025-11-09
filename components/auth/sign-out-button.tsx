'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="text-sm font-medium text-gray-700 hover:bg-gray-100"
    >
      Sign out
    </Button>
  );
}
