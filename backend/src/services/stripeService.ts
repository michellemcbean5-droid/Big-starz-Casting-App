import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

// Mock Stripe integration for testing
// In production, this would use the actual stripe SDK

export interface StripePlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  aiCredits: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: StripePlan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    price: 0,
    interval: 'month',
    aiCredits: 3,
    features: ['Basic profile', '3 AI generations/month', 'Standard listing'],
  },
  {
    id: 'plan_bronze',
    name: 'Bronze',
    price: 9.99,
    interval: 'month',
    aiCredits: 25,
    features: ['25 AI generations/month', 'Priority listing', 'Basic analytics'],
  },
  {
    id: 'plan_silver',
    name: 'Silver',
    price: 29.99,
    interval: 'month',
    aiCredits: 100,
    features: ['100 AI generations/month', 'Featured profile', 'Advanced analytics', 'Digital twin'],
  },
  {
    id: 'plan_gold',
    name: 'Gold',
    price: 99.99,
    interval: 'month',
    aiCredits: -1, // unlimited
    features: ['Unlimited AI generations', 'Premium placement', 'Direct casting director contact', 'Revenue share'],
  },
];

interface MockStripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// In-memory mock store for Stripe subscriptions (test mode)
const mockStripeSubscriptions = new Map<string, MockStripeSubscription>();

export class StripeService {
  /**
   * Mock: Create a Stripe subscription
   */
  static async createSubscription(
    planId: string,
    _paymentMethodId: string
  ): Promise<MockStripeSubscription> {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw ApiError.badRequest('Invalid subscription plan');
    }

    // Simulate Stripe API call
    const stripeSubId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    const periodEnd = new Date(now.setMonth(now.getMonth() + 1));

    const subscription: MockStripeSubscription = {
      id: stripeSubId,
      status: 'active',
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    };

    mockStripeSubscriptions.set(stripeSubId, subscription);
    return subscription;
  }

  /**
   * Mock: Update a Stripe subscription
   */
  static async updateSubscription(
    stripeSubscriptionId: string,
    newPlanId: string
  ): Promise<MockStripeSubscription> {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === newPlanId);
    if (!plan) {
      throw ApiError.badRequest('Invalid subscription plan');
    }

    const existing = mockStripeSubscriptions.get(stripeSubscriptionId);
    if (!existing) {
      throw ApiError.notFound('Stripe subscription not found');
    }

    existing.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    mockStripeSubscriptions.set(stripeSubscriptionId, existing);
    return existing;
  }

  /**
   * Mock: Cancel a Stripe subscription (at period end)
   */
  static async cancelSubscription(stripeSubscriptionId: string): Promise<MockStripeSubscription> {
    const existing = mockStripeSubscriptions.get(stripeSubscriptionId);
    if (!existing) {
      throw ApiError.notFound('Stripe subscription not found');
    }

    existing.cancelAtPeriodEnd = true;
    existing.status = 'canceled';
    mockStripeSubscriptions.set(stripeSubscriptionId, existing);
    return existing;
  }

  /**
   * Mock: Handle Stripe webhook events
   */
  static async handleWebhookEvent(eventType: string, eventData: Record<string, unknown>): Promise<void> {
    console.log(`[STRIPE WEBHOOK] ${eventType}`, JSON.stringify(eventData, null, 2));

    switch (eventType) {
      case 'invoice.paid': {
        // Payment succeeded - subscription is active
        const subId = eventData.subscriptionId as string;
        if (subId && mockStripeSubscriptions.has(subId)) {
          const sub = mockStripeSubscriptions.get(subId)!;
          sub.status = 'active';
          mockStripeSubscriptions.set(subId, sub);
        }
        break;
      }
      case 'invoice.payment_failed': {
        // Payment failed - mark subscription as past_due
        const subId = eventData.subscriptionId as string;
        if (subId && mockStripeSubscriptions.has(subId)) {
          const sub = mockStripeSubscriptions.get(subId)!;
          sub.status = 'past_due';
          mockStripeSubscriptions.set(subId, sub);
        }
        break;
      }
      case 'customer.subscription.updated': {
        // Subscription updated (e.g., tier change)
        const subId = eventData.subscriptionId as string;
        if (subId && mockStripeSubscriptions.has(subId)) {
          const sub = mockStripeSubscriptions.get(subId)!;
          if (eventData.status) {
            sub.status = eventData.status as MockStripeSubscription['status'];
          }
          if (eventData.cancelAtPeriodEnd !== undefined) {
            sub.cancelAtPeriodEnd = eventData.cancelAtPeriodEnd as boolean;
          }
          mockStripeSubscriptions.set(subId, sub);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        // Subscription deleted
        const subId = eventData.subscriptionId as string;
        if (subId && mockStripeSubscriptions.has(subId)) {
          const sub = mockStripeSubscriptions.get(subId)!;
          sub.status = 'canceled';
          mockStripeSubscriptions.set(subId, sub);
        }
        break;
      }
      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event: ${eventType}`);
    }
  }

  /**
   * Get a mock subscription by Stripe ID
   */
  static async getSubscription(stripeSubscriptionId: string): Promise<MockStripeSubscription | null> {
    return mockStripeSubscriptions.get(stripeSubscriptionId) || null;
  }

  /**
   * Clear all mock subscriptions (for testing)
   */
  static clearMockSubscriptions(): void {
    mockStripeSubscriptions.clear();
  }
}

export default StripeService;
