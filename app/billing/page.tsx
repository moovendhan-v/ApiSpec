'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, FileText, Users, FolderOpen, ArrowUpRight } from 'lucide-react';

interface SubscriptionStatus {
  plan: {
    name: string;
    displayName: string;
    maxDocuments: number;
    maxWorkspaces: number;
    maxTeamMembers: number;
  };
  usage: {
    documentsCount: number;
    workspacesCount: number;
    teamMembersCount: number;
  };
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/billing');
      return;
    }

    if (status === 'authenticated') {
      fetchSubscriptionStatus();
    }
  }, [status, router]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!subscriptionStatus) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load subscription information</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { plan, usage } = subscriptionStatus;

  const getUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and view usage
          </p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription plan</CardDescription>
              </div>
              <Badge variant={plan.name === 'FREE' ? 'secondary' : 'default'} className="text-lg px-4 py-1">
                {plan.displayName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.name !== 'FREE' ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription, update payment methods, and view invoices
                </p>
                <Button onClick={handleManageBilling} disabled={portalLoading}>
                  {portalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Billing
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock more features and increase your limits
                </p>
                <Button onClick={() => router.push('/pricing')}>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>Track your current usage against plan limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Documents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">API Documents</span>
                </div>
                <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usage.documentsCount, plan.maxDocuments))}`}>
                  {usage.documentsCount} / {plan.maxDocuments}
                </span>
              </div>
              <Progress value={getUsagePercentage(usage.documentsCount, plan.maxDocuments)} />
            </div>

            {/* Workspaces */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Workspaces</span>
                </div>
                <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usage.workspacesCount, plan.maxWorkspaces))}`}>
                  {usage.workspacesCount} / {plan.maxWorkspaces}
                </span>
              </div>
              <Progress value={getUsagePercentage(usage.workspacesCount, plan.maxWorkspaces)} />
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Team Members</span>
                </div>
                <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usage.teamMembersCount, plan.maxTeamMembers))}`}>
                  {usage.teamMembersCount} / {plan.maxTeamMembers}
                </span>
              </div>
              <Progress value={getUsagePercentage(usage.teamMembersCount, plan.maxTeamMembers)} />
            </div>

            {/* Upgrade prompt if near limits */}
            {(getUsagePercentage(usage.documentsCount, plan.maxDocuments) >= 80 ||
              getUsagePercentage(usage.workspacesCount, plan.maxWorkspaces) >= 80 ||
              getUsagePercentage(usage.teamMembersCount, plan.maxTeamMembers) >= 80) && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  You're approaching your plan limits. Consider upgrading to avoid interruptions.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push('/pricing')}
                >
                  View Plans
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
