'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Menu, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-black/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Left side - Navigation */}
        <div className="flex items-center gap-6 md:gap-10">
          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
            {session && (
              <>
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-white/80 text-white/60"
                >
                  Dashboard
                </Link>
                <Link
                  href="/documents"
                  className="transition-colors hover:text-white/80 text-white/60"
                >
                  Documents
                </Link>
                <Link
                  href="/createdoc"
                  className="transition-colors hover:text-white/80 text-white/60"
                >
                  Create Document
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-3 py-4">
                  {session ? (
                    <>
                      <Link href="/dashboard" className="px-4 py-2 hover:bg-white/10 rounded-md">
                        Dashboard
                      </Link>
                      <Link href="/documents" className="px-4 py-2 hover:bg-white/10 rounded-md">
                        Documents
                      </Link>
                      <Link href="/createdoc" className="px-4 py-2 hover:bg-white/10 rounded-md">
                        Create Document
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="justify-start"
                        onClick={() => signOut()}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <Link 
                      href="/auth/signin" 
                      className="px-4 py-2 hover:bg-white/10 rounded-md"
                    >
                      Sign in
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Right side - Logo and User Menu */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-lg">API Specs</span>
          </Link>

          {/* Desktop user menu */}
          <div className="hidden md:flex items-center">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback>
                        {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}