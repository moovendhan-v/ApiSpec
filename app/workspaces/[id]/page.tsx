'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import WorkspaceDocuments from '@/components/workspace/WorkspaceDocuments';
import WorkspaceMembers from '@/components/workspace/WorkspaceMembers';
import WorkspaceSettings from '@/components/workspace/WorkspaceSettings';
import { useWorkspace } from '@/lib/hooks/use-workspaces';
import { useWorkspaceDocuments } from '@/lib/hooks/use-documents';
import { useWorkspaceMembers } from '@/lib/hooks/use-members';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
  members: any[];
  documents: any[];
  policies: any[];
  _count: {
    documents: number;
    members: number;
  };
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('documents');
  const [refreshKey, setRefreshKey] = useState(0);

  // Use Zustand stores with caching
  const { workspace, isLoading: loading, error } = useWorkspace(params.id, refreshKey > 0);
  const { documents } = useWorkspaceDocuments(params.id, refreshKey > 0);
  const { members } = useWorkspaceMembers(params.id, refreshKey > 0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (error) {
      if (error.includes('Access denied')) {
        toast.error('Access denied');
        router.push('/workspaces');
      } else if (error.includes('not found')) {
        toast.error('Workspace not found');
        router.push('/workspaces');
      }
    }
  }, [error, router]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/workspaces">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspaces
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{workspace.name}</h1>
        {workspace.description && (
          <p className="text-muted-foreground">{workspace.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span>{workspace._count.members} members</span>
          <span>•</span>
          <span>{workspace._count.documents} documents</span>
          <span>•</span>
          <span className="px-2 py-1 rounded-full bg-muted text-xs">
            {workspace.visibility}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <WorkspaceDocuments
            workspaceId={workspace.id}
            documents={documents}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <WorkspaceMembers
            workspaceId={workspace.id}
            members={members}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <WorkspaceSettings
            workspace={workspace}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
