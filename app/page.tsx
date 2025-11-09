'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {Header} from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ContentArea from '@/components/ContentArea';
import CodePanel from '@/components/CodePanel';
import { getAllEndpoints, Endpoint, OpenAPISpec } from '@/lib/openapi-parser';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import APISidebar from '@/components/Sidebar';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load spec on mount
  useEffect(() => {
    async function loadSpec() {
      try {
        const response = await fetch('/api/spec');
        if (!response.ok) {
          throw new Error('Failed to fetch spec');
        }
        const yamlText = await response.text();
        const yaml = await import('js-yaml');
        const parsed = yaml.default.load(yamlText) as OpenAPISpec;
        setSpec(parsed);
        const allEndpoints = getAllEndpoints(parsed);
        setEndpoints(allEndpoints);
        
        // Check URL parameters for specific endpoint
        const pathParam = searchParams.get('path');
        const methodParam = searchParams.get('method');
        
        if (pathParam && methodParam) {
          // Find endpoint matching URL parameters
          const matchingEndpoint = allEndpoints.find(
            ep => ep.path === pathParam && ep.method.toLowerCase() === methodParam.toLowerCase()
          );
          
          if (matchingEndpoint) {
            setSelectedEndpoint(matchingEndpoint);
          } else {
            // Fallback to first endpoint if not found
            if (allEndpoints.length > 0) {
              setSelectedEndpoint(allEndpoints[0]);
              updateURL(allEndpoints[0]);
            }
          }
        } else {
          // No URL params, select first endpoint
          if (allEndpoints.length > 0) {
            setSelectedEndpoint(allEndpoints[0]);
            updateURL(allEndpoints[0]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading spec:', error);
        setLoading(false);
      }
    }
    loadSpec();
  }, []);

  // Function to update URL when endpoint changes
  const updateURL = (endpoint: Endpoint) => {
    const params = new URLSearchParams();
    params.set('path', endpoint.path);
    params.set('method', endpoint.method.toLowerCase());
    
    // Use router.push to update URL without page reload
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle endpoint selection
  const handleSelectEndpoint = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    updateURL(endpoint);
  };

  // Function to copy shareable link
  const copyShareableLink = () => {
    if (selectedEndpoint && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('path', selectedEndpoint.path);
      url.searchParams.set('method', selectedEndpoint.method.toLowerCase());
      
      navigator.clipboard.writeText(url.toString()).then(() => {
        // Show success toast
        showToast('Link copied to clipboard!', 'success');
      }).catch((err) => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy link', 'error');
      });
    }
  };

  // Simple toast function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white animate-in slide-in-from-bottom-5 duration-300`;
    toast.innerHTML = `
      <span class="text-lg font-bold">${type === 'success' ? '✓' : '✕'}</span>
      <span class="text-sm font-medium">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 300ms';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background dark">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading API specification...</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="h-screen flex items-center justify-center bg-background dark p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Failed to load API specification</AlertTitle>
          <AlertDescription>
            Please ensure spec.yml is available and properly configured.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen w-full dark">
        {/* Header */}
        {/* <Header /> */}

        {/* Three Panel Layout - All Resizable */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 bg-background">
          {/* Left Sidebar - API Endpoints (resizable) */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <APISidebar 
              endpoints={endpoints} 
              selectedEndpoint={selectedEndpoint} 
              onSelectEndpoint={handleSelectEndpoint}
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery}
            />
          </ResizablePanel>

          {/* Resize Handle */}
          <ResizableHandle withHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Middle Panel - Content Area (resizable) */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ContentArea 
              endpoint={selectedEndpoint}
            />
          </ResizablePanel>

          {/* Resize Handle */}
          <ResizableHandle withHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Right Panel - Code Panel (resizable) */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <CodePanel endpoint={selectedEndpoint} spec={spec} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
}