'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { getAllEndpoints, Endpoint, OpenAPISpec } from '@/lib/openapi-parser';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import APISidebar from '@/components/Sidebar';
import { Header } from '@/components/Header';
import ContentArea from '@/components/ContentArea';
import CodePanel from '@/components/CodePanel';

type Document = {
  id: string;
  title: string;
  content: string;
  description: string | null;
  isPublic: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export default function ViewDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params?.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  // Load document and parse spec
  useEffect(() => {
    async function loadDocument() {
      if (status !== 'authenticated' || !documentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the document
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) {
          throw new Error('Failed to load document');
        }
        
        const data = await response.json();
        setDocument(data);
        
        // Parse the OpenAPI spec
        try {
          const parsed: OpenAPISpec = typeof data.content === 'string' 
            ? JSON.parse(data.content) 
            : data.content;
          setSpec(parsed);
          
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
        console.error('Error loading document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [status, documentId]);

  // Handle endpoint selection from URL parameters
  useEffect(() => {
    if (!searchParams || !endpoints.length) return;
    
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
  }, [searchParams, endpoints]);

  // Update URL when endpoint changes
  const handleSelectEndpoint = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    const params = new URLSearchParams(searchParams?.toString());
    params.set('path', endpoint.path);
    params.set('method', endpoint.method.toLowerCase());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Show loading state
  if (status === 'loading' || loading) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 pt-24">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Document</AlertTitle>
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
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Redirect state
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
                {spec && <CodePanel endpoint={selectedEndpoint} spec={spec} />}
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