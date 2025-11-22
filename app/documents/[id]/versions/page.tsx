'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface DocumentVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  description: string | null;
  changeLog: string | null;
  createdAt: string;
}

export default function VersionHistoryPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchVersions();
    }
  }, [status, router, params.id]);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
        if (data.versions.length > 0) {
          setDocumentTitle(data.versions[0].title);
        }
      } else {
        toast.error('Failed to load version history');
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (version: DocumentVersion) => {
    const blob = new Blob([version.content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${version.title}-v${version.version}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Version ${version.version} downloaded`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/documents/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Document
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Version History</h1>
        <p className="text-muted-foreground">
          {documentTitle} - {versions.length} versions
        </p>
      </div>

      {versions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No version history available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {versions.map((version, idx) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Version {version.version}
                      {idx === 0 && <Badge>Current</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(version)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {idx !== 0 && (
                      <Button variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {version.changeLog && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Changes:</h4>
                    <p className="text-sm text-muted-foreground">{version.changeLog}</p>
                  </div>
                )}
                {version.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description:</h4>
                    <p className="text-sm text-muted-foreground">{version.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
