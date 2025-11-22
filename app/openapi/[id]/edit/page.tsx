'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

type DocumentData = {
  id: string;
  title: string;
  description: string | null;
  content: string;
  isPublic: boolean;
  password: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [document, setDocument] = useState<DocumentData | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    isPublic: false,
    password: '',
  });

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        const data = await response.json();
        setDocument(data);
        setFormData({
          title: data.title,
          description: data.description || '',
          content: data.content,
          isPublic: data.isPublic,
          password: data.password || '',
        });
      } catch (error) {
        console.error('Error fetching document:', error);
        toast.error('Failed to load document');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [params.id, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/documents/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      toast.success('Document updated successfully!');
      router.push(`/openapi/${params.id}`);
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(formData.content);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormData((prev) => ({ ...prev, content: formatted }));
      toast.success('JSON formatted successfully!');
    } catch (error) {
      toast.error('Invalid JSON format');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit API Specification</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Update your OpenAPI specification details
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/openapi/${params.id}`)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Edit the basic details of your API specification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter specification title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter specification description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* OpenAPI Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>OpenAPI Specification</CardTitle>
                    <CardDescription>Edit your OpenAPI JSON specification</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={formatJSON}>
                    Format YAML
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Paste your OpenAPI specification here (JSON format)"
                  rows={20}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Visibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Visibility</CardTitle>
                <CardDescription>Control who can access this specification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public">Public Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this specification publicly visible
                    </p>
                  </div>
                  <Switch
                    id="public"
                    checked={formData.isPublic}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>

                {!formData.isPublic && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password Protection</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (optional)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to remove password protection
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle>Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document ID:</span>
                  <span className="font-mono text-xs">{document.id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/openapi/${params.id}`)}
                >
                  View Specification
                </Button>
                {/* <Button 
                  variant="outline" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  Delete Specification
                </Button> */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}