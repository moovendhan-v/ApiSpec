'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceDocumentsProps {
  workspaceId: string;
  documents: Document[];
  onRefresh: () => void;
}

export default function WorkspaceDocuments({
  workspaceId,
  documents,
  onRefresh,
}: WorkspaceDocumentsProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">
            API specifications in this workspace ({documents.length})
          </p>
        </div>
        <Link href={`/createdoc?workspace=${workspaceId}`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first API specification document
            </p>
            <Link href={`/createdoc?workspace=${workspaceId}`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{doc.title}</span>
                  <Link href={`/documents/${doc.id}`}>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {doc.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="px-2 py-1 rounded-full bg-muted text-xs">
                    {doc.status}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
