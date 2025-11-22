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
  try {
    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        data: event.data as any,
      },
    });
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }

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

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
    }

    // Mark as processed
    await prisma.webhookEvent.updateMany({
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
    await prisma.webhookEvent.updateMany({
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
    console.error('No userId in subscription metadata');
    return;
  }

  // Get plan from price ID
  const plan = await prisma.plan.findFirst({
    where: { stripePriceId: subscription.items.data[0].price.id },
  });

  if (!plan) {
    console.error('Plan not found for price ID:', subscription.items.data[0].price.id);
    return;
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

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Get free plan
  const freePlan = await prisma.plan.findUnique({
    where: { name: 'FREE' },
  });

  if (!freePlan) {
    console.error('Free plan not found');
    return;
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

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Create or update invoice record
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      userId: user.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent as string,
      number: invoice.number || undefined,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status || 'paid',
      invoiceDate: new Date(invoice.created * 1000),
      paidAt: new Date(),
      invoicePdf: invoice.invoice_pdf || undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
    },
    update: {
      status: invoice.status || 'paid',
      paidAt: new Date(),
      invoicePdf: invoice.invoice_pdf || undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status
  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { status: 'past_due' },
  });

  // TODO: Send email notification
  console.log('Payment failed for user:', user.email);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // Subscription will be handled by subscription.created event
  console.log('Checkout completed for user:', userId);
}
