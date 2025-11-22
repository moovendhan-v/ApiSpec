import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { SubscriptionService } from '@/lib/services/subscription-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    const checkoutSession = await SubscriptionService.createCheckoutSession(
      session.user.id,
      priceId,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`
    );

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
