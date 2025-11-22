"use client"

import * as React from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { FileText, BookOpen, Code2, Zap, Search, User, Users, Settings, Menu, LogOut, CreditCard } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  const { data: session } = useSession();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/90">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <Code2 className="h-6 w-6" />
            <span className="font-bold text-lg">API Specs</span>
          </Link>

          {/* Main Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/documents" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <FileText className="mr-2 h-4 w-4" />
                    Documents
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/workspaces" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Users className="mr-2 h-4 w-4" />
                    Workspaces
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Zap className="mr-2 h-4 w-4" />
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Documents
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    <ListItem href="/documents" title="All Documents" icon={<FileText className="h-4 w-4" />}>
                      View and manage all your API documentation
                    </ListItem>
                    <ListItem href="/createdoc" title="Create New" icon={<Zap className="h-4 w-4" />}>
                      Create a new API specification document
                    </ListItem>
                    <ListItem href="/documents?filter=recent" title="Recent" icon={<BookOpen className="h-4 w-4" />}>
                      Access your recently viewed documents
                    </ListItem>
                    <ListItem href="/documents?filter=shared" title="Shared with Me" icon={<User className="h-4 w-4" />}>
                      Documents shared by your team
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <Code2 className="mr-2 h-4 w-4" />
                  API Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 w-[400px]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/openapi"
                        >
                          <Code2 className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            OpenAPI Editor
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Design and test your APIs with our interactive editor
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/openapi/validator" title="API Validator">
                      Validate your OpenAPI specifications
                    </ListItem>
                    <ListItem href="/openapi/converter" title="Format Converter">
                      Convert between API specification formats
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search docs..."
                className="pl-8 w-[200px] xl:w-[300px]"
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'User'} />
                    <AvatarFallback>
                      {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.name || 'User Account'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email || 'No email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

function ListItem({
  title,
  children,
  href,
  icon,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { 
  href: string
  icon?: React.ReactNode 
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
            {icon}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
