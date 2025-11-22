'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, History, TrendingUp, FileText, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ShareDialog } from '@/components/documents/ShareDialog';

interface Document {
  id: string;
  title: string;
  description: string | null;
  status: string;
  tags: string[];
  version: number;
  isPublic: boolean;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
  User: {
    name: string | null;
    email: string | null;
  };
}

interface Workspace {
  id: string;
  name: string;
}

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    draft: 0,
    published: 0,
    recent: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchDocuments();
      fetchWorkspaces();
    }
  }, [status, router]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents?limit=100');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        calculateStats(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const calculateStats = (docs: Document[]) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    setStats({
      total: docs.length,
      public: docs.filter((d) => d.isPublic).length,
      private: docs.filter((d) => !d.isPublic).length,
      draft: docs.filter((d) => d.status === 'draft').length,
      published: docs.filter((d) => d.status === 'published').length,
      recent: docs.filter((d) => new Date(d.updatedAt) > oneDayAgo).length,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesWorkspace =
      workspaceFilter === 'all' ||
      (workspaceFilter === 'personal' && !doc.workspaceId) ||
      doc.workspaceId === workspaceFilter;
    const matchesVisibility =
      visibilityFilter === 'all' ||
      (visibilityFilter === 'public' && doc.isPublic) ||
      (visibilityFilter === 'private' && !doc.isPublic);

    return matchesSearch && matchesStatus && matchesWorkspace && matchesVisibility;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Specifications</h1>
        <p className="text-muted-foreground">
          Manage your API documentation and specifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Public Specs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.public}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Private Specs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.private}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent}</div>
            <p className="text-xs text-green-500 mt-1">+15%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-green-500 mt-1">+20%</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Link href="/createdoc" className="flex-shrink-0">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Document
          </Button>
        </Link>
        <Link href="/documents/versions" className="flex-shrink-0">
          <Button variant="outline">
            <History className="w-4 h-4 mr-2" />
            Version History
          </Button>
        </Link>
        <div className="flex-1" />
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace</label>
              <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workspaces</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Specifications</CardTitle>
          <CardDescription>
            Your latest API documentation and specs ({filteredDocuments.length} documents)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || workspaceFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first API specification'}
              </p>
              <Link href="/createdoc">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Document
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Link href={`/documents/${doc.id}`} className="hover:underline">
                        <div className="font-medium">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {doc.description}
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">v{doc.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          doc.status === 'published'
                            ? 'default'
                            : doc.status === 'draft'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.isPublic ? (
                        <Badge variant="default">
                          <Eye className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Private</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/documents/${doc.id}`}>
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/documents/${doc.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <ShareDialog documentId={doc.id} documentTitle={doc.title} />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(doc.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
