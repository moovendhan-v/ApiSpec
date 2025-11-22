import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding plans...');

  // Free Plan
  const freePlan = await prisma.plan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: {
      name: 'FREE',
      displayName: 'Free',
      description: 'Perfect for individuals and small projects',
      price: 0,
      currency: 'usd',
      interval: 'month',
      maxDocuments: 3,
      maxWorkspaces: 1,
      maxTeamMembers: 2,
      maxVersionHistory: 7,
      shareLinkExpiry: 7,
      customBranding: false,
      exportToPostman: false,
      advancedPermissions: false,
      ssoIntegration: false,
      apiAccess: false,
      prioritySupport: false,
      dedicatedSupport: false,
      onPremiseDeployment: false,
      advancedAnalytics: false,
      customIntegrations: false,
      removeWatermark: false,
      isActive: true,
      sortOrder: 0,
    },
  });
  console.log('✓ Free plan created/updated');

  // Pro Plan
  const proPlan = await prisma.plan.upsert({
    where: { name: 'PRO' },
    update: {},
    create: {
      name: 'PRO',
      displayName: 'Pro',
      description: 'For professional developers and small teams',
      price: 2900, // $29.00 in cents
      currency: 'usd',
      interval: 'month',
      stripePriceId: null, // Set this after creating products in Stripe
      stripeProductId: null, // Set this after creating products in Stripe
      maxDocuments: 50,
      maxWorkspaces: 5,
      maxTeamMembers: 10,
      maxVersionHistory: 30,
      shareLinkExpiry: 90,
      customBranding: true,
      exportToPostman: true,
      advancedPermissions: false,
      ssoIntegration: false,
      apiAccess: false,
      prioritySupport: false,
      dedicatedSupport: false,
      onPremiseDeployment: false,
      advancedAnalytics: false,
      customIntegrations: false,
      removeWatermark: true,
      isActive: true,
      sortOrder: 1,
    },
  });
  console.log('✓ Pro plan created/updated');

  // Team Plan
  const teamPlan = await prisma.plan.upsert({
    where: { name: 'TEAM' },
    update: {},
    create: {
      name: 'TEAM',
      displayName: 'Team',
      description: 'For growing companies and development teams',
      price: 9900, // $99.00 in cents
      currency: 'usd',
      interval: 'month',
      stripePriceId: null, // Set this after creating products in Stripe
      stripeProductId: null, // Set this after creating products in Stripe
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
      dedicatedSupport: false,
      onPremiseDeployment: false,
      advancedAnalytics: true,
      customIntegrations: false,
      removeWatermark: true,
      isActive: true,
      sortOrder: 2,
    },
  });
  console.log('✓ Team plan created/updated');

  // Enterprise Plan
  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'ENTERPRISE' },
    update: {},
    create: {
      name: 'ENTERPRISE',
      displayName: 'Enterprise',
      description: 'For large organizations with custom needs',
      price: 0, // Custom pricing
      currency: 'usd',
      interval: 'month',
      maxDocuments: 999999,
      maxWorkspaces: 999999,
      maxTeamMembers: 999999,
      maxVersionHistory: 999999,
      shareLinkExpiry: 999999,
      customBranding: true,
      exportToPostman: true,
      advancedPermissions: true,
      ssoIntegration: true,
      apiAccess: true,
      prioritySupport: true,
      dedicatedSupport: true,
      onPremiseDeployment: true,
      advancedAnalytics: true,
      customIntegrations: true,
      removeWatermark: true,
      isActive: true,
      sortOrder: 3,
    },
  });
  console.log('✓ Enterprise plan created/updated');

  console.log('\n✅ All plans seeded successfully!');
  console.log('\nPlans created:');
  console.log(`- ${freePlan.displayName} (${freePlan.name})`);
  console.log(`- ${proPlan.displayName} (${proPlan.name})`);
  console.log(`- ${teamPlan.displayName} (${teamPlan.name})`);
  console.log(`- ${enterprisePlan.displayName} (${enterprisePlan.name})`);
}

main()
  .catch((e) => {
    console.error('Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
