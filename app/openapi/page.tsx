'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Endpoint, OpenAPISpec, getAllEndpoints } from '@/lib/openapi-parser';
import { SidebarProvider } from '@/components/ui/sidebar';
import APISidebar from '@/components/Sidebar';
import { Header } from '@/components/Header';
import ContentArea from '@/components/ContentArea';
import CodePanel from '@/components/CodePanel';

type ApiSpec = {
  id: string;
  content: string;
  updatedAt: string;
};

function OpenAPIViewerContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [spec, setSpec] = useState<ApiSpec | null>(null);
  const [parsedSpec, setParsedSpec] = useState<OpenAPISpec | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle authentication and redirects
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  // Load and parse the OpenAPI spec
  useEffect(() => {
    const loadSpec = async () => {
      if (status !== 'authenticated') return;

      try {
        setLoading(true);
        setError(null);

        // Fetch the spec from your API
        const response = await fetch('/api/spec');
        if (!response.ok) {
          throw new Error('Failed to load API specification');
        }

        const data = await response.json();
        setSpec(data);

        // Parse the OpenAPI spec
        let parsed: OpenAPISpec;
        try {
          parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          setParsedSpec(parsed);

          // Extract endpoints
          const allEndpoints = getAllEndpoints(parsed);
          setEndpoints(allEndpoints);

          // Set initial selected endpoint
          if (allEndpoints.length > 0) {
            setSelectedEndpoint(allEndpoints[0]);
          }
        } catch (parseError) {
          console.error('Error parsing OpenAPI spec:', parseError);
          setError('Invalid OpenAPI specification format');
        }
      } catch (err) {
        console.error('Error loading spec:', err);
        setError(err instanceof Error ? err.message : 'Failed to load API specification');
      } finally {
        setLoading(false);
      }
    };

    loadSpec();
  }, [status]);

  // Handle endpoint selection from URL parameters
  useEffect(() => {
    if (!searchParams || !endpoints.length || !parsedSpec) return;

    const path = searchParams.get('path');
    const method = searchParams.get('method');

    if (path && method) {
      const endpoint = endpoints.find(
        ep => ep.path === path && ep.method.toLowerCase() === method.toLowerCase()
      );

      if (endpoint) {
        setSelectedEndpoint(endpoint);
      }
    }
  }, [searchParams, endpoints, parsedSpec]);

  // Update URL when endpoint changes
  const handleSelectEndpoint = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    const params = new URLSearchParams();
    params.set('path', endpoint.path);
    params.set('method', endpoint.method.toLowerCase());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Show loading state
  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-slate-400">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading API Documentation</AlertTitle>
            <AlertDescription className="mt-2">
              {error}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/documents')}
                  className="bg-white/5 border-white/20 hover:bg-white/10 text-white"
                >
                  Back to Documents
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show redirect state
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Header />
        <div className="flex flex-1 overflow-hidden pt-16">
          <APISidebar
            endpoints={endpoints}
            selectedEndpoint={selectedEndpoint}
            onSelectEndpoint={handleSelectEndpoint}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <main className="flex-1 overflow-auto p-6">
            {selectedEndpoint ? (
              <div className="space-y-6 max-w-7xl mx-auto">
                <ContentArea endpoint={selectedEndpoint} />
                {parsedSpec && <CodePanel endpoint={selectedEndpoint} spec={parsedSpec} />}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 mx-auto">
                    <AlertCircle className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-lg">Select an endpoint to view details</p>
                  <p className="text-slate-500 text-sm mt-2">Choose from the sidebar to get started</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Loading spinner component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}

// Main component with Suspense boundary
export default function OpenAPIViewer() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OpenAPIViewerContent />
    </Suspense>
  );
}