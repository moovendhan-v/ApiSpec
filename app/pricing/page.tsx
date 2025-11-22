'use client';

import { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const plans = [
  {
    name: 'Free',
    displayName: 'Free',
    price: 0,
    priceId: null,
    description: 'Perfect for individuals and small projects',
    features: [
      { name: '3 API documents', included: true },
      { name: '1 workspace', included: true },
      { name: '2 team members', included: true },
      { name: 'Basic sharing (7 days)', included: true },
      { name: 'Community support', included: true },
      { name: '7 days version history', included: true },
      { name: 'Custom branding', included: false },
      { name: 'Export to Postman', included: false },
      { name: 'Advanced permissions', included: false },
      { name: 'SSO integration', included: false },
    ],
  },
  {
    name: 'Pro',
    displayName: 'Pro',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
    description: 'For professional developers and small teams',
    popular: true,
    features: [
      { name: '50 API documents', included: true },
      { name: '5 workspaces', included: true },
      { name: '10 team members', included: true },
      { name: 'Advanced sharing (90 days)', included: true },
      { name: 'Email support (48h)', included: true },
      { name: '30 days version history', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Export to Postman', included: true },
      { name: 'Remove watermark', included: true },
      { name: 'Advanced permissions', included: false },
    ],
  },
  {
    name: 'Team',
    displayName: 'Team',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAM_MONTHLY,
    description: 'For growing companies and development teams',
    features: [
      { name: 'Unlimited documents', included: true },
      { name: 'Unlimited workspaces', included: true },
      { name: '50 team members', included: true },
      { name: 'Priority support (24h)', included: true },
      { name: '90 days version history', included: true },
      { name: 'Advanced permissions', included: true },
      { name: 'SSO integration', included: true },
      { name: 'API access', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'White-label options', included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Check if Stripe is configured
  const isStripeConfigured = 
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY && 
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY !== 'price_your_pro_monthly_id';

  const handleSubscribe = async (priceId: string | null | undefined, planName: string) => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    if (!priceId || priceId === 'price_your_pro_monthly_id' || priceId === 'price_your_team_monthly_id') {
      alert(
        '⚠️ Stripe Price IDs not configured yet! please contact admin.'
      );
      return;
    }

    if (planName === 'Free') {
      router.push('/dashboard');
      return;
    }

    setLoading(planName);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Use the new method: redirect to the checkout URL directly
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that's right for you
          </p>
          
          {!isStripeConfigured && (
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ <strong>Setup Required:</strong> Stripe Price IDs not configured. 
                  Payments are disabled until you complete the setup. 
                  See <code className="bg-yellow-500/20 px-1 rounded">SETUP_COMPLETE.md</code> for instructions.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 relative ${
                plan.popular ? 'border-primary border-2 shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="mb-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>

              <Button
                className="w-full mb-6"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={loading === plan.name}
              >
                {loading === plan.name
                  ? 'Loading...'
                  : plan.price === 0
                  ? 'Get Started'
                  : 'Subscribe Now'}
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

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Need more?</h2>
          <p className="text-muted-foreground mb-6">
            Contact us for Enterprise plans with custom features and pricing
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
