# Payments API

## Subscription Endpoints

### GET /subscriptions/plans
List available subscription plans.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "free",
        "name": "Free",
        "price": 0,
        "currency": "USD",
        "interval": null,
        "features": [
          "3 AI generations per month",
          "Basic profile",
          "Apply to casting calls",
          "Requires master access code"
        ],
        "limits": {
          "aiGenerations": 3,
          "storageGB": 1,
          "prioritySupport": false
        }
      },
      {
        "id": "bronze",
        "name": "Bronze",
        "price": 9.99,
        "currency": "USD",
        "interval": "month",
        "features": [
          "25 AI generations per month",
          "Priority listing in search",
          "Basic analytics dashboard",
          "Email support"
        ],
        "limits": {
          "aiGenerations": 25,
          "storageGB": 5,
          "prioritySupport": false
        }
      },
      {
        "id": "silver",
        "name": "Silver",
        "price": 29.99,
        "currency": "USD",
        "interval": "month",
        "features": [
          "100 AI generations per month",
          "Featured profile badge",
          "Advanced analytics",
          "Digital twin creation",
          "Priority support"
        ],
        "limits": {
          "aiGenerations": 100,
          "storageGB": 25,
          "prioritySupport": true
        }
      },
      {
        "id": "gold",
        "name": "Gold",
        "price": 99.99,
        "currency": "USD",
        "interval": "month",
        "features": [
          "Unlimited AI generations",
          "Premium placement in all searches",
          "Direct casting director contact",
          "Revenue share on AI content",
          "White-glove support"
        ],
        "limits": {
          "aiGenerations": null,
          "storageGB": 100,
          "prioritySupport": true
        }
      }
    ]
  }
}
```

---

### POST /subscriptions/create
Create a new subscription (initiates Stripe checkout).

#### Request
```json
{
  "planId": "silver",
  "successUrl": "https://app.bigstarz.com/subscription/success",
  "cancelUrl": "https://app.bigstarz.com/subscription/cancel"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

---

### POST /subscriptions/cancel
Cancel the current subscription at period end.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Subscription will cancel at end of billing period",
    "currentPeriodEnd": "2024-07-15T10:00:00Z"
  }
}
```

---

### POST /subscriptions/reactivate
Reactivate a canceled subscription before period end.

---

## Webhook Endpoints

### POST /webhooks/stripe
Stripe webhook handler ( Stripe -> Backend ).

#### Events Handled
- `checkout.session.completed` — Activate subscription
- `invoice.paid` — Renew subscription, record payment
- `invoice.payment_failed` — Mark subscription past_due, notify user
- `customer.subscription.deleted` — Cancel subscription
- `customer.subscription.updated` — Update tier or status

#### Security
- Signature verified using `STRIPE_WEBHOOK_SECRET`
- Idempotency checked via Stripe event ID

---

## Earnings Endpoints

### GET /earnings
Get earnings history (creators only).

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totalEarnings": 1250.00,
    "pendingPayout": 350.00,
    "lifetimeEarnings": 5000.00,
    "earnings": [
      {
        "id": "uuid",
        "amount": 125.00,
        "source": "ai_content_revenue_share",
        "description": "Revenue share — Digital Twin usage",
        "status": "paid",
        "createdAt": "2024-06-01T00:00:00Z",
        "paidAt": "2024-06-15T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /earnings/summary
Get earnings summary dashboard data.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "thisMonth": 450.00,
    "lastMonth": 380.00,
    "thisYear": 2500.00,
    "bySource": {
      "ai_content_revenue_share": 1800.00,
      "casting_referral": 500.00,
      "premium_content": 200.00
    },
    "chartData": [
      { "month": "Jan", "amount": 200 },
      { "month": "Feb", "amount": 250 },
      ...
    ]
  }
}
```

---

### POST /earnings/request-payout
Request a payout of pending earnings.

#### Request
```json
{
  "amount": 350.00,
  "method": "bank_transfer",
  "accountDetails": {
    "accountNumber": "****1234",
    "routingNumber": "****5678"
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "payoutId": "uuid",
    "amount": 350.00,
    "status": "processing",
    "estimatedArrival": "2024-06-28T00:00:00Z"
  }
}
```

#### Payout Rules
- Minimum payout: $50.00
- Processing time: 5-7 business days
- Available methods: Bank transfer, PayPal
- Tax documentation (1099/ W-9) required for US creators
