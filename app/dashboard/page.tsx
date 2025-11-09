// app/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner"
import { Icons } from '@/components/icons';
import { useApiStore } from '@/lib/store';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiSpec, setApiSpec] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');

  const { addDocument, documents } = useApiStore();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handlePublish = async () => {
    if (!apiSpec.trim() || !docTitle.trim()) {
      toast("Error", {
        description: 'Please provide both a title and API specification',
      });
      return;
    }

    try {
      setLoading(true);
      // Here you would typically make an API call to save the document
      const newDoc = {
        id: Math.random().toString(36).substring(2, 9),
        title: docTitle,
        content: apiSpec,
        isPublic,
        password: isPublic ? undefined : password,
        createdAt: new Date(),
      };

      addDocument(newDoc);
      
      toast("Success", {
        description: 'Your API documentation has been published successfully!',
      });

      // Reset form
      setApiSpec('');
      setDocTitle('');
      setPassword('');
      setIsPublic(true);
    } catch (error) {
      console.error('Error publishing document:', error);
      toast("Error", {
        description: 'Failed to publish document. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Publish New Doc Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Publish New Documentation</CardTitle>
              <CardDescription>
                Upload your OpenAPI YAML/JSON file to generate beautiful documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Documentation Title</Label>
                <Input
                  id="title"
                  placeholder="My Awesome API"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSpec">OpenAPI Specification (YAML/JSON)</Label>
                <Textarea
                  id="apiSpec"
                  placeholder="Paste your OpenAPI specification here..."
                  className="min-h-[300px] font-mono text-sm"
                  value={apiSpec}
                  onChange={(e) => setApiSpec(e.target.value)}
                />
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isPublic">Make this documentation public</Label>
                </div>

                {!isPublic && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (Optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Set a password to protect this documentation"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Only people with the password will be able to access this documentation.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handlePublish} disabled={loading}>
                  {loading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Documentation'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Documents</h2>
            {documents.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>No documents yet. Publish your first documentation!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <Card key={doc.id} className="hover:bg-accent/50 transition-colors">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{doc.title}</CardTitle>
                          <CardDescription className="text-xs">
                            Created {new Date(doc.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8">
                          View
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}