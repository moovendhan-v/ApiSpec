import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { SubscriptionService } from '@/lib/services/subscription-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [plan, usage, subscription] = await Promise.all([
      SubscriptionService.getUserPlan(session.user.id),
      SubscriptionService.getUserUsage(session.user.id),
      SubscriptionService.getUserPlan(session.user.id),
    ]);

    return NextResponse.json({
      plan,
      usage,
      subscription,
    });
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
