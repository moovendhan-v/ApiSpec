'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  policies?: any[];
}

interface WorkspaceSettingsProps {
  workspace: Workspace;
  onRefresh: () => void;
}

export default function WorkspaceSettings({
  workspace,
  onRefresh,
}: WorkspaceSettingsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: workspace.name,
    description: workspace.description || '',
    visibility: workspace.visibility,
  });

  const [policyData, setPolicyData] = useState({
    canCreateDocuments: true,
    canEditDocuments: true,
    canDeleteDocuments: false,
    canPublishDocuments: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canManageSettings: false,
  });

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Workspace updated successfully');
        onRefresh();
      } else {
        toast.error('Failed to update workspace');
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Workspace deleted successfully');
        router.push('/workspaces');
      } else {
        const error = await res.text();
        toast.error(error || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdatePolicy = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Member Policy',
          description: 'Default permissions for members',
          ...policyData,
          appliesTo: ['MEMBER'],
        }),
      });

      if (res.ok) {
        toast.success('Policy updated successfully');
        onRefresh();
      } else {
        toast.error('Failed to update policy');
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      toast.error('Failed to update policy');
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update workspace name, description, and visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value) => setFormData({ ...formData, visibility: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private - Only members can access</SelectItem>
                <SelectItem value="TEAM">Team - Team members can discover</SelectItem>
                <SelectItem value="PUBLIC">Public - Anyone can view</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Access Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Access Policies</CardTitle>
          <CardDescription>
            Configure what members can do in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Document Permissions</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="canCreateDocuments">Create Documents</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to create new documents
                  </p>
                </div>
                <Switch
                  id="canCreateDocuments"
                  checked={policyData.canCreateDocuments}
                  onCheckedChange={(checked) =>
                    setPolicyData({ ...policyData, canCreateDocuments: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="canEditDocuments">Edit Documents</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to edit existing documents
                  </p>
                </div>
                <Switch
                  id="canEditDocuments"
                  checked={policyData.canEditDocuments}
                  onCheckedChange={(checked) =>
                    setPolicyData({ ...policyData, canEditDocuments: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="canDeleteDocuments">Delete Documents</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to delete documents
                  </p>
                </div>
                <Switch
                  id="canDeleteDocuments"
                  checked={policyData.canDeleteDocuments}
                  onCheckedChange={(checked) =>
                    setPolicyData({ ...policyData, canDeleteDocuments: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="canPublishDocuments">Publish Documents</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to publish documents publicly
                  </p>
                </div>
                <Switch
                  id="canPublishDocuments"
                  checked={policyData.canPublishDocuments}
                  onCheckedChange={(checked) =>
                    setPolicyData({ ...policyData, canPublishDocuments: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Workspace Permissions</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="canInviteMembers">Invite Members</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to invite new people
                  </p>
                </div>
                <Switch
                  id="canInviteMembers"
                  checked={policyData.canInviteMembers}
                  onCheckedChange={(checked) =>
                    setPolicyData({ ...policyData, canInviteMembers: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="canRemoveMembers">Remove Members</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to remove other members
                  </p>
                </div>
                <Switch
                  id="canRemoveMembers"
                  checked={policyData.canRemoveMembers}
                  onCheckedChange={(checked) =>
                    setPolicyData({ ...policyData, canRemoveMembers: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="canManageSettings">Manage Settings</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to change workspace settings
                  </p>
                </div>
                <Switch
                  id="canManageSettings"
                  checked={policyData.canManageSettings}
                  onCheckedChange={(checked) =>
                    setPolicyData({ ...policyData, canManageSettings: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpdatePolicy}>
              <Save className="w-4 h-4 mr-2" />
              Update Policies
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Workspace</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this workspace and all its documents
              </p>
            </div>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
