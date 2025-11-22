import Stripe from 'stripe';

// Server-side Stripe client (only use in API routes and server components)
export const getStripeInstance = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
  });
};

// Lazy initialization to avoid errors on client-side
let stripeInstance: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    if (!stripeInstance) {
      stripeInstance = getStripeInstance();
    }
    return (stripeInstance as any)[prop];
  },
});
