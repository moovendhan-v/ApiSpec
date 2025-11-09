'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Share2, Save, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

// Dynamically import the code editor to avoid SSR issues
const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => {
    // Import the editor styles
    import('@uiw/react-textarea-code-editor/dist.css');
    return mod.default;
  }),
  { ssr: false }
) as any; // Temporary type assertion to avoid TypeScript errors

type Document = {
  id: string;
  title: string;
  content: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

export default function ViewDocumentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState('');

  const fetchDocument = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      const data = await response.json();
      setDocument(data);
      setContent(data.content || '');
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id, fetchDocument]);

  const handleSave = async () => {
    if (!document) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/spec`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const data = await response.json();
      setDocument(prev => prev ? { ...prev, updatedAt: data.updatedAt } : null);
      toast.success('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container bg-background mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Document not found</h1>
        <p className="text-slate-400 mb-6">The requested document could not be found or you don't have permission to view it.</p>
        <Button 
          onClick={() => router.push('/documents')}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background mx-auto py-8 px-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="-ml-2 hover:bg-background"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLink}
              className="flex items-center border-slate-700 hover:bg-background hover:border-slate-600"
            >
              {copied ? 'Copied!' : 'Copy Link'}
              <Copy className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: document.title,
                    url: window.location.href,
                  });
                } else {
                  handleCopyLink();
                }
              }}
              className="flex items-center border-slate-700 hover:bg-background hover:border-slate-600"
            >
              Share
              <Share2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{document.title}</h1>
          {document.description && (
            <p className="text-slate-400">{document.description}</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-700 overflow-hidden bg-background/50">
          <div>
            <div data-color-mode={theme}>
              <CodeEditor
                value={content}
                language="yaml"
                theme={'dark'}
                placeholder="Enter your OpenAPI specification here..."
                onChange={(evn: React.ChangeEvent<HTMLTextAreaElement>) => setContent(evn.target.value)}
                padding={16}
                style={{
                  fontSize: 14,
                  backgroundColor: '#0f172a',
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
                  minHeight: '60vh',
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-slate-400 bg-background p-4 rounded-lg border border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center">
              <span className="mr-2">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                document.isPublic 
                  ? 'bg-green-900/50 text-green-400 border border-green-700' 
                  : 'bg-blue-900/50 text-blue-400 border border-blue-700'
              }`}>
                {document.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            {document.user && (
              <div className="flex items-center">
                <span className="mr-2">Author:</span>
                <div className="flex items-center">
                  {document.user.image && (
                    <img 
                      src={document.user.image} 
                      alt={document.user.name || 'User'} 
                      className="w-5 h-5 rounded-full mr-2 ring-1 ring-slate-700"
                    />
                  )}
                  <span className="text-sm text-slate-300">
                    {document.user.name || document.user.email?.split('@')[0]}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-left sm:text-right">
            <div>Created: {new Date(document.createdAt).toLocaleDateString()}</div>
            <div>Last updated: {new Date(document.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}