import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating Stripe IDs for plans...\n');

  // Update Pro Plan
  if (process.env.STRIPE_PRICE_ID_PRO_MONTHLY) {
    await prisma.plan.update({
      where: { name: 'PRO' },
      data: {
        stripePriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
        stripeProductId: process.env.STRIPE_PRODUCT_ID_PRO || null,
      },
    });
    console.log('✓ Pro plan updated with Stripe IDs');
  } else {
    console.log('⚠ STRIPE_PRICE_ID_PRO_MONTHLY not set');
  }

  // Update Team Plan
  if (process.env.STRIPE_PRICE_ID_TEAM_MONTHLY) {
    await prisma.plan.update({
      where: { name: 'TEAM' },
      data: {
        stripePriceId: process.env.STRIPE_PRICE_ID_TEAM_MONTHLY,
        stripeProductId: process.env.STRIPE_PRODUCT_ID_TEAM || null,
      },
    });
    console.log('✓ Team plan updated with Stripe IDs');
  } else {
    console.log('⚠ STRIPE_PRICE_ID_TEAM_MONTHLY not set');
  }

  console.log('\n✅ Stripe IDs updated successfully!');
}

main()
  .catch((e) => {
    console.error('Error updating Stripe IDs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
