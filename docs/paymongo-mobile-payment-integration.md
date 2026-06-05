# PayMongo Mobile Payment Integration Notes

## Scope

This work prepares the Bloomora customer mobile app for PayMongo Hosted Checkout in test mode.

The intended flow is:

1. Customer adds products to cart.
2. Customer taps checkout in the mobile cart.
3. Mobile app creates backend order records.
4. Backend creates a PayMongo Hosted Checkout session.
5. Mobile app opens the PayMongo checkout URL.
6. PayMongo redirects back to the app success or cancel route.
7. PayMongo webhook is the source of truth for marking payment as paid.

## Backend Changes

- `apps/backend/app/core/config.py`
  - Added PayMongo settings for secret key, base URL, redirect URLs, and webhook secret.

- `apps/backend/app/core/security.py`
  - Updated access token expiry to use `ACCESS_TOKEN_EXPIRE_MINUTES` instead of a hardcoded 15-minute expiry.

- `apps/backend/app/models/order.py`
  - Extended `Transaction` with PayMongo/provider fields.

- `apps/backend/alembic/versions/h8i9j0k1l2m3_add_paymongo_fields_to_transactions.py`
  - Added pending migration for PayMongo transaction fields.
  - This migration has not been applied yet.

- `apps/backend/app/services/paymongo_service.py`
  - Added PayMongo checkout session client using `httpx`.

- `apps/backend/app/api/v1/routes/payments.py`
  - Added PayMongo checkout, payment status, and webhook endpoints.

- `apps/backend/app/main.py`
  - Registered the payments router.

## Mobile Changes

- `apps/mobile/estings-mobile/services/payments-api.ts`
  - Added mobile API methods for order creation and PayMongo checkout creation.

- `apps/mobile/estings-mobile/app/(tabs)/cart.tsx`
  - Wired signed-in checkout button to:
    - create backend orders,
    - create PayMongo checkout,
    - open Hosted Checkout with `expo-web-browser`,
    - handle expired-token checkout errors.

- `apps/mobile/estings-mobile/app/payment/_layout.tsx`
  - Added payment route layout.

- `apps/mobile/estings-mobile/app/payment/success.tsx`
  - Added PayMongo success return screen.

- `apps/mobile/estings-mobile/app/payment/cancel.tsx`
  - Added PayMongo cancel return screen.

- `apps/mobile/estings-mobile/app/_layout.tsx`
  - Registered the payment route group.

## Local Configuration

Mobile API URL is configured through:

```env
EXPO_PUBLIC_API_URL=http://<computer-lan-ip>:8000/api/v1
```

For Expo Go, do not use `127.0.0.1` unless the backend is running on the same device. Use the computer's LAN IP.

Backend PayMongo test mode config is local-only in `apps/backend/.env`:

```env
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_BASE_URL=https://api.paymongo.com
PAYMONGO_SUCCESS_URL=<app-scheme>://payment/success
PAYMONGO_CANCEL_URL=<app-scheme>://payment/cancel
```

Do not commit secret keys.

## Endpoint Contract

Create Hosted Checkout:

```text
POST /api/v1/payments/paymongo/checkout
Authorization: Bearer <access_token>
```

Request:

```json
{
  "order_ids": ["order-uuid"],
  "payment_method_types": ["card", "gcash", "qrph"]
}
```

Response:

```json
{
  "status": "pending",
  "provider": "paymongo",
  "checkout_session_id": "cs_...",
  "checkout_url": "https://checkout.paymongo.com/...",
  "reference_number": "PMO-...",
  "order_ids": ["order-uuid"]
}
```

Webhook:

```text
POST /api/v1/payments/paymongo/webhook
```

The webhook handles `checkout_session.payment.paid` and updates the matching transaction/order.

## Pass-On Fees Note

PayMongo Hosted Checkout supports `pass_on_fees`.

If enabled, PayMongo processing fees are added to the customer's payable total. If disabled, the customer pays the exact order total and Bloomora absorbs the fee.

Current recommendation for testing: keep disabled until the base checkout and webhook flow are proven.

Possible future options:

- Developer/admin env toggle: `PAYMONGO_PASS_ON_FEES=false`
- Admin settings UI toggle stored in the database

## Pending Work

- Apply the pending Alembic migration locally when ready to test database-backed checkout:

```powershell
cd apps\backend
alembic upgrade head
```

- Confirm the app redirect scheme in PayMongo redirect URLs.
- Test Checkout in PayMongo test mode.
- Add webhook secret verification once the PayMongo webhook secret is configured.
- Decide whether to enable pass-on fees.
