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

    const portalSession = await SubscriptionService.createPortalSession(
      session.user.id,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
