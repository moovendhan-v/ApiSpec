'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Layout, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Endpoint, OpenAPISpec, getAllEndpoints } from '@/lib/openapi-parser';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodePanel from '@/components/CodePanel';
import { Header } from '@/components/Header';
import APISidebar from '@/components/Sidebar';
import ContentArea from '@/components/ContentArea';
import yaml from 'js-yaml';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import dynamic from 'next/dynamic';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

type ApiSpec = {
    id: string;
    content: string;
    updatedAt: string;
};

export default function OpenAPIPage() {
    const { id } = useParams();
    const router = useRouter();
    const [spec, setSpec] = useState<ApiSpec | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parsedSpec, setParsedSpec] = useState<OpenAPISpec | null>(null);
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'custom' | 'swagger'>('custom');

    useEffect(() => {
        const fetchSpec = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/spec/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch specification');
                }

                const data = await response.json();
                console.log(data.content);
                setSpec(data);

                // Parse the OpenAPI spec (handle both JSON and YAML)
                if (data.content) {
                    try {
                        let parsed: OpenAPISpec;

                        // Try to determine if it's JSON or YAML
                        const trimmedContent = data.content.trim();

                        if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
                            // It's JSON
                            parsed = JSON.parse(data.content);
                        } else {
                            // It's YAML
                            parsed = yaml.load(data.content) as OpenAPISpec;
                        }

                        setParsedSpec(parsed);

                        // Extract all endpoints
                        const allEndpoints = getAllEndpoints(parsed);
                        setEndpoints(allEndpoints);

                        // Set the first endpoint as selected by default
                        if (allEndpoints.length > 0) {
                            setSelectedEndpoint(allEndpoints[0]);
                        }
                    } catch (parseError) {
                        console.error('Error parsing OpenAPI spec:', parseError);
                        setError('Invalid OpenAPI specification format');
                    }
                }
            } catch (err) {
                console.error('Error fetching specification:', err);
                setError('Failed to load specification');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSpec();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-slate-400">Loading specification...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6 bg-background min-h-screen">
                <Alert variant="destructive" className="border-red-900 bg-red-950/50">
                    <AlertTitle className="text-red-400">Error</AlertTitle>
                    <AlertDescription className="text-red-300">
                        {error}
                    </AlertDescription>
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="border-slate-700 hover:bg-slate-800"
                        >
                            Go Back
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }

    if (!spec || !parsedSpec) {
        return (
            <div className="container mx-auto p-6 bg-background min-h-screen">
                <Alert className="border-slate-700 bg-slate-800/50">
                    <AlertTitle className="text-white">No specification found</AlertTitle>
                    <AlertDescription className="text-slate-400">
                        The requested specification could not be found or you don't have permission to view it.
                    </AlertDescription>
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="border-slate-700 hover:bg-slate-800"
                        >
                            Go Back
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }
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
    return (
        <SidebarProvider>
            <div className="flex flex-col h-screen w-full dark">
                {/* Header with View Toggle */}
                <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
                    <div className="container flex h-14 items-center justify-between px-4">
                        <h1 className="text-lg font-semibold">API Documentation</h1>
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'custom' | 'swagger')}>
                            <TabsList>
                                <TabsTrigger value="custom" className="flex items-center gap-2">
                                    <Layout className="w-4 h-4" />
                                    Custom View
                                </TabsTrigger>
                                <TabsTrigger value="swagger" className="flex items-center gap-2">
                                    <Code className="w-4 h-4" />
                                    Swagger UI
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* Content Area */}
                {viewMode === 'custom' ? (
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
                            <CodePanel endpoint={selectedEndpoint} spec={parsedSpec!} />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <div className="flex-1 overflow-auto bg-background">
                        <div className="swagger-ui-wrapper p-6">
                            <SwaggerUI spec={parsedSpec} />
                        </div>
                    </div>
                )}
            </div>
        </SidebarProvider>
    );
}