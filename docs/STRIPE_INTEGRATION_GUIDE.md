# Stripe Integration Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for integrating Stripe payments into the API documentation platform.

---

## 📋 Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Node.js environment variables configured
3. Database migrations completed
4. Next.js API routes set up

---

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product IDs (create these in Stripe Dashboard)
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_TEAM_MONTHLY=price_...
STRIPE_PRICE_ID_TEAM_YEARLY=price_...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Create Stripe Client

Create `lib/stripe.ts`:

```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Client-side Stripe
export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};
```

### 4. Create Subscription Service

Create `lib/services/subscription-service.ts`:

```typescript
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export class SubscriptionService {
  // Get user's current plan
  static async getUserPlan(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { Plan: true },
    });

    if (!subscription) {
      // Return free plan
      return await prisma.plan.findUnique({
        where: { name: 'FREE' },
      });
    }

    return subscription.Plan;
  }

  // Check if user can perform action
  static async canPerformAction(
    userId: string,
    action: 'createDocument' | 'createWorkspace' | 'inviteMember'
  ) {
    const plan = await this.getUserPlan(userId);
    const usage = await this.getUserUsage(userId);

    switch (action) {
      case 'createDocument':
        return usage.documentsCount < plan.maxDocuments;
      case 'createWorkspace':
        return usage.workspacesCount < plan.maxWorkspaces;
      case 'inviteMember':
        return usage.teamMembersCount < plan.maxTeamMembers;
      default:
        return false;
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
      // Create new usage record
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
}
```

### 5. Create API Routes

#### Checkout Session (`app/api/stripe/checkout/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionService } from '@/lib/services/subscription-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    const checkoutSession = await SubscriptionService.createCheckoutSession(
      session.user.id,
      priceId,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
    );

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

#### Customer Portal (`app/api/stripe/portal/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionService } from '@/lib/services/subscription-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portalSession = await SubscriptionService.createPortalSession(
      session.user.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

#### Webhook Handler (`app/api/stripe/webhook/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Log webhook event
  await prisma.webhookEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      data: event.data as any,
    },
  });

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Log error
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    throw new Error('No userId in subscription metadata');
  }

  // Get plan from price ID
  const plan = await prisma.plan.findFirst({
    where: { stripePriceId: subscription.items.data[0].price.id },
  });

  if (!plan) {
    throw new Error('Plan not found for price ID');
  }

  // Upsert subscription
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      planId: plan.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) return;

  // Get free plan
  const freePlan = await prisma.plan.findUnique({
    where: { name: 'FREE' },
  });

  if (!freePlan) {
    throw new Error('Free plan not found');
  }

  // Downgrade to free plan
  await prisma.subscription.update({
    where: { userId },
    data: {
      planId: freePlan.id,
      status: 'canceled',
      canceledAt: new Date(),
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Create invoice record
  await prisma.invoice.create({
    data: {
      userId: user.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent as string,
      number: invoice.number,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status!,
      invoiceDate: new Date(invoice.created * 1000),
      paidAt: new Date(),
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Update subscription status
  await prisma.subscription.update({
    where: { userId: user.id },
    data: { status: 'past_due' },
  });

  // TODO: Send email notification
}
```

### 6. Create Pricing Page

Create `app/pricing/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const plans = [
  {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      { name: '3 API documents', included: true },
      { name: '1 workspace', included: true },
      { name: '2 team members', included: true },
      { name: 'Basic sharing (7 days)', included: true },
      { name: 'Community support', included: true },
      { name: 'Custom branding', included: false },
      { name: 'Export to Postman', included: false },
      { name: 'Advanced permissions', included: false },
    ],
  },
  {
    name: 'Pro',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
    popular: true,
    features: [
      { name: '50 API documents', included: true },
      { name: '5 workspaces', included: true },
      { name: '10 team members', included: true },
      { name: 'Advanced sharing (90 days)', included: true },
      { name: 'Email support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Export to Postman', included: true },
      { name: 'Advanced permissions', included: false },
    ],
  },
  {
    name: 'Team',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAM_MONTHLY,
    features: [
      { name: 'Unlimited documents', included: true },
      { name: 'Unlimited workspaces', included: true },
      { name: '50 team members', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced permissions', included: true },
      { name: 'SSO integration', included: true },
      { name: 'API access', included: true },
      { name: 'Advanced analytics', included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string | null) => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    if (!priceId) {
      router.push('/dashboard');
      return;
    }

    setLoading(priceId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId } = await response.json();

      const stripe = await getStripe();
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that's right for you
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`p-8 ${plan.popular ? 'border-primary border-2' : ''}`}
          >
            {plan.popular && (
              <div className="text-primary text-sm font-semibold mb-4">
                MOST POPULAR
              </div>
            )}

            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <Button
              className="w-full mb-6"
              variant={plan.popular ? 'default' : 'outline'}
              onClick={() => handleSubscribe(plan.priceId)}
              disabled={loading === plan.priceId}
            >
              {loading === plan.priceId ? 'Loading...' : 'Get Started'}
            </Button>

            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature.name} className="flex items-start gap-2">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <span
                    className={
                      feature.included ? '' : 'text-muted-foreground'
                    }
                  >
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 7. Seed Plans in Database

Create `prisma/seed-plans.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Free Plan
  await prisma.plan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: {
      name: 'FREE',
      displayName: 'Free',
      description: 'Perfect for individuals and small projects',
      price: 0,
      maxDocuments: 3,
      maxWorkspaces: 1,
      maxTeamMembers: 2,
      maxVersionHistory: 7,
      shareLinkExpiry: 7,
      removeWatermark: false,
    },
  });

  // Pro Plan
  await prisma.plan.upsert({
    where: { name: 'PRO' },
    update: {},
    create: {
      name: 'PRO',
      displayName: 'Pro',
      description: 'For professional developers and small teams',
      price: 2900, // $29.00
      stripePriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
      maxDocuments: 50,
      maxWorkspaces: 5,
      maxTeamMembers: 10,
      maxVersionHistory: 30,
      shareLinkExpiry: 90,
      customBranding: true,
      exportToPostman: true,
      removeWatermark: true,
    },
  });

  // Team Plan
  await prisma.plan.upsert({
    where: { name: 'TEAM' },
    update: {},
    create: {
      name: 'TEAM',
      displayName: 'Team',
      description: 'For growing companies and development teams',
      price: 9900, // $99.00
      stripePriceId: process.env.STRIPE_PRICE_ID_TEAM_MONTHLY,
      maxDocuments: 999999,
      maxWorkspaces: 999999,
      maxTeamMembers: 50,
      maxVersionHistory: 90,
      shareLinkExpiry: 365,
      customBranding: true,
      exportToPostman: true,
      advancedPermissions: true,
      ssoIntegration: true,
      apiAccess: true,
      prioritySupport: true,
      removeWatermark: true,
    },
  });

  console.log('Plans seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run: `npx tsx prisma/seed-plans.ts`

---

## 🧪 Testing

### Test Mode
Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Webhook Testing
Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 🚀 Production Deployment

1. Switch to live Stripe keys
2. Configure webhook endpoint in Stripe Dashboard
3. Test all payment flows
4. Monitor webhook events
5. Set up error alerts

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Next.js + Stripe Guide](https://stripe.com/docs/payments/checkout/nextjs)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
