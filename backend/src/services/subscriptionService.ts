import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import StripeService, { SUBSCRIPTION_PLANS } from './stripeService';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

export class SubscriptionService {
  /**
   * List all available subscription plans
   */
  static async listPlans() {
    return SUBSCRIPTION_PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      aiCredits: plan.aiCredits === -1 ? 'unlimited' : plan.aiCredits,
      features: plan.features,
    }));
  }

  /**
   * Create a new subscription for a user
   */
  static async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string
  ) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw ApiError.badRequest('Invalid subscription plan');
    }

    // Check if user already has an active subscription
    const existingSub = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (existingSub) {
      throw ApiError.conflict('User already has an active subscription. Please upgrade instead.');
    }

    // Create Stripe subscription (mock)
    const stripeSub = await StripeService.createSubscription(planId, paymentMethodId);

    // Map plan ID to tier
    const tierMap: Record<string, SubscriptionTier> = {
      plan_free: 'FREE',
      plan_bronze: 'BRONZE',
      plan_silver: 'SILVER',
      plan_gold: 'GOLD',
    };

    const tier = tierMap[planId] || 'FREE';

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        price: plan.price,
        stripeSubscriptionId: stripeSub.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: stripeSub.currentPeriodEnd,
      },
    });

    return {
      subscription,
      stripeSubscription: stripeSub,
    };
  }

  /**
   * Get user's current subscription
   */
  static async getCurrentSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => {
      const tierMap: Record<string, string> = {
        FREE: 'plan_free',
        BRONZE: 'plan_bronze',
        SILVER: 'plan_silver',
        GOLD: 'plan_gold',
      };
      return p.id === tierMap[subscription.tier];
    });

    return {
      ...subscription,
      plan: plan || null,
    };
  }

  /**
   * Upgrade or downgrade subscription
   */
  static async updateSubscription(userId: string, planId: string) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw ApiError.badRequest('Invalid subscription plan');
    }

    const currentSub = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSub) {
      throw ApiError.notFound('No active subscription found');
    }

    const tierMap: Record<string, SubscriptionTier> = {
      plan_free: 'FREE',
      plan_bronze: 'BRONZE',
      plan_silver: 'SILVER',
      plan_gold: 'GOLD',
    };

    const newTier = tierMap[planId] || 'FREE';

    // Update Stripe subscription if there's a stripe ID
    let stripeSub = null;
    if (currentSub.stripeSubscriptionId) {
      stripeSub = await StripeService.updateSubscription(
        currentSub.stripeSubscriptionId,
        planId
      );
    }

    // Update subscription in DB
    const updated = await prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        tier: newTier,
        price: plan.price,
        endDate: stripeSub?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      subscription: updated,
      stripeSubscription: stripeSub,
    };
  }

  /**
   * Cancel subscription (set to expire at period end)
   */
  static async cancelSubscription(userId: string) {
    const currentSub = await prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSub) {
      throw ApiError.notFound('No active subscription found');
    }

    let stripeSub = null;
    if (currentSub.stripeSubscriptionId) {
      stripeSub = await StripeService.cancelSubscription(currentSub.stripeSubscriptionId);
    }

    // Mark as cancelled but keep until endDate
    const updated = await prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        status: 'CANCELLED',
      },
    });

    return {
      subscription: updated,
      stripeSubscription: stripeSub,
      message: 'Subscription will remain active until the end of the current billing period',
    };
  }

  /**
   * Handle Stripe webhook
   */
  static async handleWebhook(eventType: string, eventData: Record<string, unknown>) {
    await StripeService.handleWebhookEvent(eventType, eventData);

    // Update local DB based on webhook event
    if (eventData.subscriptionId) {
      const stripeSub = await StripeService.getSubscription(eventData.subscriptionId as string);
      if (stripeSub) {
        const localSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        });

        if (localSub) {
          let newStatus: SubscriptionStatus = 'ACTIVE';
          if (stripeSub.status === 'canceled') newStatus = 'CANCELLED';
          if (stripeSub.status === 'past_due' || stripeSub.status === 'unpaid') newStatus = 'EXPIRED';

          await prisma.subscription.update({
            where: { id: localSub.id },
            data: { status: newStatus },
          });
        }
      }
    }

    return { received: true };
  }
}

export default SubscriptionService;
