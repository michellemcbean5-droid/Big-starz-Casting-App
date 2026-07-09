import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import SubscriptionController from '../controllers/subscriptionController';

const router = Router();

// GET /api/v1/subscriptions/plans — List all subscription plans (public)
router.get('/plans', SubscriptionController.listPlans);

// POST /api/v1/subscriptions — Create new subscription (authenticated)
router.post('/', authMiddleware, SubscriptionController.createSubscription);

// GET /api/v1/subscriptions — Get my current subscription (authenticated)
router.get('/', authMiddleware, SubscriptionController.getCurrentSubscription);

// PUT /api/v1/subscriptions — Upgrade/downgrade subscription (authenticated)
router.put('/', authMiddleware, SubscriptionController.updateSubscription);

// DELETE /api/v1/subscriptions — Cancel subscription (authenticated)
router.delete('/', authMiddleware, SubscriptionController.cancelSubscription);

// POST /api/v1/subscriptions/webhook — Stripe webhook handler (public, but should verify signature in production)
router.post('/webhook', SubscriptionController.handleWebhook);

export default router;
