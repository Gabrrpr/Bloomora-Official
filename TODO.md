# Implementation TODO

## Task: Payment-First Ordering System

### Backend Changes

- [x] 1. Remove COD (`cash_on_delivery`) from PaymentMethodEnum in `apps/backend/app/models/order.py`
- [x] 2. Add payment processing to `create_orders` endpoint in `apps/backend/app/api/v1/routes/orders.py`
- [x] 3. Add new `POST /orders/{order_id}/pay` endpoint for payment confirmation in `apps/backend/app/api/v1/routes/orders.py`

### Frontend Changes

- [x] 4. Add payment confirmation step in `apps/web/src/pages/Checkout.jsx` - require payment confirmation before order creation

### Additional Improvements Made

- [x] 5. Added "Save to address book" checkbox feature in Checkout.jsx for recipient addresses

### Follow-up Steps
- [ ] Test the checkout flow end-to-end
- [ ] Verify orders only created after payment is confirmed
