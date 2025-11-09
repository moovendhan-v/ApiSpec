'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getAllEndpoints, Endpoint, OpenAPISpec } from '@/lib/openapi-parser';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import APISidebar from '@/components/Sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';
import ContentArea from '@/components/ContentArea';
import CodePanel from '@/components/CodePanel';

// This is the main page component that handles authentication
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // This will be shown very briefly before redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

// This component will be used in the dashboard page
export function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load spec on mount
  useEffect(() => {
    async function loadSpec() {
      try {
        setLoading(true);
        // Your existing spec loading logic here
        // const loadedSpec = await loadYourSpec();
        // setSpec(loadedSpec);
        // setEndpoints(getAllEndpoints(loadedSpec));
      } catch (error) {
        console.error('Failed to load spec:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      loadSpec();
    }
  }, [status]);

  // Show loading state while checking authentication or loading data
  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will be redirected)
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <APISidebar 
            endpoints={endpoints}
            selectedEndpoint={selectedEndpoint}
            onSelectEndpoint={setSelectedEndpoint}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <main className="flex-1 overflow-auto p-4">
            {selectedEndpoint ? (
              <div className="space-y-4">
                <ContentArea endpoint={selectedEndpoint} />
                <CodePanel endpoint={selectedEndpoint} spec={spec!} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">Select an endpoint to view details</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}