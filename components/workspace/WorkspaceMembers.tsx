'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserPlus, MoreVertical, Trash2, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface WorkspaceMembersProps {
  workspaceId: string;
  members: Member[];
  onRefresh: () => void;
}

export default function WorkspaceMembers({
  workspaceId,
  members,
  onRefresh,
}: WorkspaceMembersProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'MEMBER',
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData),
      });

      if (res.ok) {
        toast.success('Invitation sent successfully');
        setInviteDialogOpen(false);
        setInviteData({ email: '', role: 'MEMBER' });
        onRefresh();
      } else {
        const error = await res.text();
        toast.error(error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Member removed successfully');
        onRefresh();
      } else {
        const error = await res.text();
        toast.error(error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        toast.success('Role updated successfully');
        onRefresh();
      } else {
        const error = await res.text();
        toast.error(error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500/10 text-purple-500';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-500';
      case 'EDITOR':
        return 'bg-green-500/10 text-green-500';
      case 'VIEWER':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Members</h2>
          <p className="text-muted-foreground">
            Manage workspace members and permissions
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleInvite}>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this workspace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteData.role}
                    onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting}>
                  {inviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>
                    {member.user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.user.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{member.user.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getRoleBadgeColor(member.role)}>
                  {member.role}
                </Badge>
                {member.role !== 'OWNER' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'ADMIN')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'EDITOR')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Make Editor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'MEMBER')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
