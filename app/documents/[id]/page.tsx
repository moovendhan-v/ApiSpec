'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Edit, Trash2, Download, Eye, History } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import dynamic from 'next/dynamic';
import { ShareDialog } from '@/components/documents/ShareDialog';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

interface Document {
  id: string;
  title: string;
  content: string;
  description: string | null;
  isPublic: boolean;
  status: string;
  tags: string[];
  version: number;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
  User: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('current');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('swagger');
  const [viewMode, setViewMode] = useState<'tabs' | 'openapi'>('tabs');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchDocument();
    }
  }, [status, router, params.id]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocument(data);
        setCurrentContent(data.content);
        fetchVersions();
      } else if (res.status === 404) {
        toast.error('Document not found');
        router.push('/documents');
      } else if (res.status === 403) {
        toast.error('Access denied');
        router.push('/documents');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId);
    if (versionId === 'current') {
      setCurrentContent(document?.content || '');
    } else {
      const version = versions.find((v) => v.id === versionId);
      if (version) {
        setCurrentContent(version.content);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Document deleted successfully');
        router.push('/documents');
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
              {document.description && (
                <p className="text-muted-foreground">{document.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'tabs' | 'openapi')}>
                <TabsList>
                  <TabsTrigger value="tabs">Tabbed View</TabsTrigger>
                  <TabsTrigger value="openapi">OpenAPI View</TabsTrigger>
                </TabsList>
              </Tabs>
              <ShareDialog documentId={document.id} documentTitle={document.title} variant="button" />
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Link href={`/documents/${document.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{document.status}</Badge>
              <Badge variant="outline">v{document.version}</Badge>
              {document.isPublic ? (
                <Badge variant="default">
                  <Eye className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary">Private</Badge>
              )}
            </div>
            <span>•</span>
            <span>
              Created by {document.User.name || document.User.email}
            </span>
            <span>•</span>
            <span>
              {new Date(document.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Version Selector */}
          {versions.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Version:</span>
              </div>
              <Select value={selectedVersion} onValueChange={handleVersionChange}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">
                    v{document.version} (Current) - {document.title}
                  </SelectItem>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      v{version.version} - {version.title}
                      {version.changeLog && ` - ${version.changeLog.substring(0, 50)}${version.changeLog.length > 50 ? '...' : ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVersion !== 'current' && (
                <Badge variant="outline" className="text-xs">
                  Viewing Historical Version
                </Badge>
              )}
            </div>
          )}

          {document.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              {document.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {viewMode === 'openapi' ? (
          <Card>
            <CardHeader>
              <CardTitle>OpenAPI Documentation</CardTitle>
              <CardDescription>
                View your API specification in the custom OpenAPI viewer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/openapi/${document.id}`}>
                <Button size="lg" className="w-full">
                  Open in OpenAPI Viewer
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Opens the interactive 3-panel OpenAPI documentation viewer with custom design and Swagger UI options
              </p>
            </CardContent>
          </Card>
        ) : (
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
                    Explore and test your API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="swagger-ui-wrapper">
                  <SwaggerUI spec={currentContent} />
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
                    {currentContent}
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
                  {currentContent}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        {/* Metadata */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Document ID:</span>
                <p className="font-mono mt-1">{document.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span>
                <p className="mt-1">{document.version}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="mt-1">{document.status}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Visibility:</span>
                <p className="mt-1">{document.isPublic ? 'Public' : 'Private'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="mt-1">
                  {new Date(document.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <p className="mt-1">
                  {new Date(document.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
