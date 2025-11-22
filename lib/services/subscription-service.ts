import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export class SubscriptionService {
  // Get user's current plan
  static async getUserPlan(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { Plan: true },
    });

    if (!subscription || subscription.status === 'canceled') {
      // Return free plan
      return await prisma.plan.findUnique({
        where: { name: 'FREE' },
      });
    }

    return subscription.Plan;
  }

  // Check if user has access to feature
  static async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const plan = await this.getUserPlan(userId);
    if (!plan) return false;

    const featureMap: Record<string, keyof typeof plan> = {
      customBranding: 'customBranding',
      exportToPostman: 'exportToPostman',
      advancedPermissions: 'advancedPermissions',
      ssoIntegration: 'ssoIntegration',
      apiAccess: 'apiAccess',
      prioritySupport: 'prioritySupport',
      removeWatermark: 'removeWatermark',
    };

    const planFeature = featureMap[feature];
    return planFeature ? Boolean(plan[planFeature]) : false;
  }

  // Check if user can perform action
  static async canPerformAction(
    userId: string,
    action: 'createDocument' | 'createWorkspace' | 'inviteMember'
  ): Promise<{ allowed: boolean; limit?: number; current?: number }> {
    const plan = await this.getUserPlan(userId);
    if (!plan) {
      return { allowed: false };
    }

    const usage = await this.getUserUsage(userId);

    switch (action) {
      case 'createDocument':
        return {
          allowed: usage.documentsCount < plan.maxDocuments,
          limit: plan.maxDocuments,
          current: usage.documentsCount,
        };
      case 'createWorkspace':
        return {
          allowed: usage.workspacesCount < plan.maxWorkspaces,
          limit: plan.maxWorkspaces,
          current: usage.workspacesCount,
        };
      case 'inviteMember':
        return {
          allowed: usage.teamMembersCount < plan.maxTeamMembers,
          limit: plan.maxTeamMembers,
          current: usage.teamMembersCount,
        };
      default:
        return { allowed: false };
    }
  }

  // Get current usage
  static async getUserUsage(userId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let usage = await prisma.usageTracking.findUnique({
      where: {
        userId_periodStart: {
          userId,
          periodStart,
        },
      },
    });

    if (!usage) {
      // Calculate actual usage
      const documentsCount = await prisma.document.count({
        where: { userId },
      });
      const workspacesCount = await prisma.workspace.count({
        where: { createdById: userId },
      });
      const teamMembersCount = await prisma.workspaceMember.count({
        where: { userId },
      });

      usage = await prisma.usageTracking.create({
        data: {
          userId,
          periodStart,
          periodEnd,
          documentsCount,
          workspacesCount,
          teamMembersCount,
        },
      });
    }

    return usage;
  }

  // Update usage count
  static async incrementUsage(
    userId: string,
    type: 'documents' | 'workspaces' | 'teamMembers' | 'apiCalls'
  ) {
    const usage = await this.getUserUsage(userId);

    const updateData: any = {};
    switch (type) {
      case 'documents':
        updateData.documentsCount = usage.documentsCount + 1;
        break;
      case 'workspaces':
        updateData.workspacesCount = usage.workspacesCount + 1;
        break;
      case 'teamMembers':
        updateData.teamMembersCount = usage.teamMembersCount + 1;
        break;
      case 'apiCalls':
        updateData.apiCallsCount = usage.apiCallsCount + 1;
        break;
    }

    return await prisma.usageTracking.update({
      where: { id: usage.id },
      data: updateData,
    });
  }

  // Create checkout session
  static async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return session;
  }

  // Create customer portal session
  static async createPortalSession(userId: string, returnUrl: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return session;
  }

  // Cancel subscription
  static async cancelSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });
  }

  // Resume subscription
  static async resumeSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });
  }
}
