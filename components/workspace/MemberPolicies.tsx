'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Plus, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MANAGED_POLICIES, CUSTOM_POLICY_EXAMPLES, ACTIONS } from '@/lib/managed-policies';

interface MemberPoliciesProps {
  workspaceId: string;
  memberId: string;
  memberName: string;
  onClose: () => void;
}

export default function MemberPolicies({
  workspaceId,
  memberId,
  memberName,
  onClose,
}: MemberPoliciesProps) {
  const [loading, setLoading] = useState(true);
  const [attachedPolicies, setAttachedPolicies] = useState<string[]>([]);
  const [customPolicies, setCustomPolicies] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customPolicyForm, setCustomPolicyForm] = useState({
    name: '',
    description: '',
    resourcePatterns: '',
    actions: [] as string[],
  });

  useEffect(() => {
    fetchPolicies();
  }, [workspaceId, memberId]);

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}/policies`);
      if (res.ok) {
        const data = await res.json();
        setAttachedPolicies(data.attachedPolicies || []);
        setCustomPolicies(data.customPolicies || []);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachPolicy = async (policyId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId }),
      });

      if (res.ok) {
        toast.success('Policy attached successfully');
        fetchPolicies();
        setShowAddDialog(false);
      } else {
        toast.error('Failed to attach policy');
      }
    } catch (error) {
      console.error('Error attaching policy:', error);
      toast.error('Failed to attach policy');
    }
  };

  const handleDetachPolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to detach this policy?')) return;

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}/policies?policyId=${policyId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('Policy detached successfully');
        fetchPolicies();
      } else {
        toast.error('Failed to detach policy');
      }
    } catch (error) {
      console.error('Error detaching policy:', error);
      toast.error('Failed to detach policy');
    }
  };

  const handleCreateCustomPolicy = async () => {
    if (!customPolicyForm.name || customPolicyForm.actions.length === 0) {
      toast.error('Name and at least one action are required');
      return;
    }

    const resourcePatterns = customPolicyForm.resourcePatterns
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (resourcePatterns.length === 0) {
      toast.error('At least one resource pattern is required');
      return;
    }

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPolicy: {
            name: customPolicyForm.name,
            description: customPolicyForm.description,
            resourcePatterns,
            actions: customPolicyForm.actions,
            statements: [
              {
                Effect: 'Allow',
                Action: customPolicyForm.actions,
                Resource: resourcePatterns,
              },
            ],
          },
        }),
      });

      if (res.ok) {
        toast.success('Custom policy created successfully');
        fetchPolicies();
        setShowCustomDialog(false);
        setCustomPolicyForm({
          name: '',
          description: '',
          resourcePatterns: '',
          actions: [],
        });
      } else {
        toast.error('Failed to create custom policy');
      }
    } catch (error) {
      console.error('Error creating custom policy:', error);
      toast.error('Failed to create custom policy');
    }
  };

  const handleDeleteCustomPolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this custom policy?')) return;

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}/policies?customPolicyId=${policyId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('Custom policy deleted successfully');
        fetchPolicies();
      } else {
        toast.error('Failed to delete custom policy');
      }
    } catch (error) {
      console.error('Error deleting custom policy:', error);
      toast.error('Failed to delete custom policy');
    }
  };

  const toggleAction = (action: string) => {
    setCustomPolicyForm((prev) => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter((a) => a !== action)
        : [...prev.actions, action],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Policies for {memberName}</h2>
        <p className="text-muted-foreground">
          Manage access policies and permissions for this member
        </p>
      </div>

      <Tabs defaultValue="managed">
        <TabsList>
          <TabsTrigger value="managed">Managed Policies</TabsTrigger>
          <TabsTrigger value="custom">Custom Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="managed" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Attach pre-defined managed policies to this member
            </p>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Attach Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Attach Managed Policy</DialogTitle>
                  <DialogDescription>
                    Select a managed policy to attach to this member
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {MANAGED_POLICIES.map((policy) => {
                      const isAttached = attachedPolicies.includes(policy.id);
                      return (
                        <Card
                          key={policy.id}
                          className={`cursor-pointer transition-colors ${
                            isAttached ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                          }`}
                          onClick={() => !isAttached && handleAttachPolicy(policy.id)}
                        >
                          <CardHeader className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base flex items-center gap-2">
                                  {policy.name}
                                  {isAttached && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Check className="w-3 h-3 mr-1" />
                                      Attached
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="text-sm mt-1">
                                  {policy.description}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {attachedPolicies.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No managed policies attached</p>
                </CardContent>
              </Card>
            ) : (
              attachedPolicies.map((policyId) => {
                const policy = MANAGED_POLICIES.find((p) => p.id === policyId);
                if (!policy) return null;

                return (
                  <Card key={policyId}>
                    <CardContent className="p-4 flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{policy.name}</h4>
                        <p className="text-sm text-muted-foreground">{policy.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDetachPolicy(policyId)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Create custom policies with specific resource patterns
            </p>
            <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Custom Policy</DialogTitle>
                  <DialogDescription>
                    Define specific permissions with resource patterns (e.g., api-doc-*)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Policy Name</Label>
                    <Input
                      placeholder="e.g., API Doc V1 Editor"
                      value={customPolicyForm.name}
                      onChange={(e) =>
                        setCustomPolicyForm({ ...customPolicyForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe what this policy allows"
                      value={customPolicyForm.description}
                      onChange={(e) =>
                        setCustomPolicyForm({ ...customPolicyForm, description: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Resource Patterns (comma-separated)</Label>
                    <Input
                      placeholder="e.g., api-doc-*, api-doc-v1-*, *-prod"
                      value={customPolicyForm.resourcePatterns}
                      onChange={(e) =>
                        setCustomPolicyForm({
                          ...customPolicyForm,
                          resourcePatterns: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Use * as wildcard. Examples: api-doc-*, *-prod, api-doc-v1-*
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Actions</Label>
                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      <div className="space-y-2">
                        {Object.entries(ACTIONS).map(([action, description]) => (
                          <div key={action} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={action}
                              checked={customPolicyForm.actions.includes(action)}
                              onChange={() => toggleAction(action)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label htmlFor={action} className="text-sm cursor-pointer flex-1">
                              <span className="font-medium">{action}</span>
                              <span className="text-muted-foreground ml-2">- {description}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCustomPolicy}>Create Policy</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {customPolicies.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No custom policies created</p>
                  <p className="text-sm mt-2">
                    Create custom policies for fine-grained access control
                  </p>
                </CardContent>
              </Card>
            ) : (
              customPolicies.map((policy) => (
                <Card key={policy.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{policy.name}</h4>
                        <p className="text-sm text-muted-foreground">{policy.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCustomPolicy(policy.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Resources:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {policy.resourcePatterns.map((pattern: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Actions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {policy.actions.map((action: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
