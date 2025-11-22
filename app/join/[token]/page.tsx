'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Users, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    avatar: string | null;
  };
  invitedBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export default function JoinWorkspacePage({ params }: { params: { token: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [params.token]);

  const fetchInvitation = async () => {
    try {
      const res = await fetch(`/api/workspaces/invitations/${params.token}`);
      
      if (res.ok) {
        const data = await res.json();
        setInvitation(data.invitation);
      } else {
        const errorText = await res.text();
        setError(errorText || 'Invitation not found or expired');
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (status !== 'authenticated') {
      // Redirect to sign in with return URL
      router.push(`/auth/signin?callbackUrl=/join/${params.token}`);
      return;
    }

    setAccepting(true);

    try {
      const res = await fetch(`/api/workspaces/invitations/${params.token}`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        toast.success('Successfully joined workspace!');
        
        // Redirect to workspace after 2 seconds
        setTimeout(() => {
          router.push(`/workspaces/${data.member.workspace.id}`);
        }, 2000);
      } else {
        const errorText = await res.text();
        toast.error(errorText || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    try {
      const res = await fetch(`/api/workspaces/invitations/${params.token}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Invitation declined');
        router.push('/');
      } else {
        toast.error('Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>Welcome to {invitation?.workspace.name}!</CardTitle>
            <CardDescription>
              You've successfully joined the workspace. Redirecting...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workspace Info */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              {invitation.workspace.avatar ? (
                <img
                  src={invitation.workspace.avatar}
                  alt={invitation.workspace.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{invitation.workspace.name}</h3>
                {invitation.workspace.description && (
                  <p className="text-muted-foreground mt-1">
                    {invitation.workspace.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">
                    Role: {invitation.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Invited By */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Avatar>
              <AvatarImage src={invitation.invitedBy.image || undefined} />
              <AvatarFallback>
                {invitation.invitedBy.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Invited by</p>
              <p className="text-sm text-muted-foreground">
                {invitation.invitedBy.name || invitation.invitedBy.email}
              </p>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invited to:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Warning if not signed in */}
          {status !== 'authenticated' && (
            <div className="flex items-start gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-500">Sign in required</p>
                <p className="text-muted-foreground mt-1">
                  You need to sign in with <strong>{invitation.email}</strong> to accept this invitation.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1"
              size="lg"
            >
              {accepting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {status === 'authenticated' ? 'Accept Invitation' : 'Sign In & Accept'}
            </Button>
            <Button
              onClick={handleDecline}
              variant="outline"
              disabled={accepting}
              size="lg"
            >
              Decline
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground">
            By accepting, you agree to collaborate in this workspace and follow its policies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
