'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Eye, XCircle, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

interface SharedDocument {
  id: string;
  title: string;
  content: string;
  description: string | null;
  status: string;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDownload: boolean;
  };
  expiresAt: string;
}

export default function SharePage({ params }: { params: { token: string } }) {
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('swagger');

  useEffect(() => {
    fetchSharedDocument();
  }, [params.token]);

  const fetchSharedDocument = async () => {
    try {
      const res = await fetch(`/api/share/${params.token}`);
      
      if (res.ok) {
        const data = await res.json();
        setDocument(data);
      } else {
        const errorText = await res.text();
        setError(errorText || 'Invalid or expired share link');
      }
    } catch (error) {
      console.error('Error fetching shared document:', error);
      setError('Failed to load shared document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!document) return;

    const blob = new Blob([document.content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/\s+/g, '-').toLowerCase()}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Invalid Share Link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This link may have expired or been revoked.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const expiresAt = new Date(document.expiresAt);
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const timeRemaining = expiresAt.getTime() - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold">Shared Document</span>
            <Badge variant="outline" className="ml-2">
              Read-Only
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {document.permissions.canDownload && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Document Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
                {document.description && (
                  <p className="text-muted-foreground">{document.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <Badge variant="secondary">{document.status}</Badge>
              <Badge variant="outline">v{document.version}</Badge>
              <Badge variant="default">
                <Eye className="w-3 h-3 mr-1" />
                Shared
              </Badge>
              {document.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Expiry Warning */}
            <div className={`mt-4 flex items-start gap-2 p-4 rounded-lg ${
              isExpiringSoon 
                ? 'bg-yellow-500/10 border border-yellow-500/20' 
                : 'bg-blue-500/10 border border-blue-500/20'
            }`}>
              <Clock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                isExpiringSoon ? 'text-yellow-500' : 'text-blue-500'
              }`} />
              <div className="text-sm flex-1">
                <p className={`font-medium ${isExpiringSoon ? 'text-yellow-500' : 'text-blue-500'}`}>
                  {isExpiringSoon ? 'Link Expiring Soon' : 'Temporary Access'}
                </p>
                <p className="text-muted-foreground mt-1">
                  This share link expires on {expiresAt.toLocaleString()}
                  {hoursRemaining > 0 && (
                    <span className="ml-1">
                      ({hoursRemaining}h {minutesRemaining}m remaining)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Permissions Info */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Access Permissions
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Eye className={`w-4 h-4 ${document.permissions.canView ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">
                    View: <Badge variant={document.permissions.canView ? 'default' : 'secondary'} className="text-xs ml-1">
                      {document.permissions.canView ? 'Yes' : 'No'}
                    </Badge>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className={`w-4 h-4 ${document.permissions.canDownload ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">
                    Download: <Badge variant={document.permissions.canDownload ? 'default' : 'secondary'} className="text-xs ml-1">
                      {document.permissions.canDownload ? 'Yes' : 'No'}
                    </Badge>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Edit: <Badge variant="secondary" className="text-xs ml-1">No</Badge>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="swagger">API Docs</TabsTrigger>
              <TabsTrigger value="preview">Code Preview</TabsTrigger>
              <TabsTrigger value="raw">Raw Content</TabsTrigger>
            </TabsList>

            <TabsContent value="swagger" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive API Documentation</CardTitle>
                  <CardDescription>
                    Explore and test API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="swagger-ui-wrapper">
                    <SwaggerUI spec={document.content} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Specification</CardTitle>
                  <CardDescription>
                    OpenAPI/Swagger specification preview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden">
                    <SyntaxHighlighter
                      language="yaml"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '14px',
                      }}
                      showLineNumbers
                    >
                      {document.content}
                    </SyntaxHighlighter>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Content</CardTitle>
                  <CardDescription>
                    Plain text view of the document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                    {document.content}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Document Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Version</span>
                  <Badge variant="outline">v{document.version}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Status</span>
                  <Badge variant={document.status === 'published' ? 'default' : 'secondary'}>
                    {document.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Created</span>
                  <span className="font-medium">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Last Updated</span>
                  <span className="font-medium">
                    {new Date(document.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Link Expires:</span>
                  </div>
                  <span className="font-medium">
                    {new Date(document.expiresAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  This document is shared via a secure, time-limited HMAC-signed link.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
