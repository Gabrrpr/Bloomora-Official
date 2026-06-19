# TODO

- [ ] Add a safe payment_method normalization in PayMongo webhook so it matches PaymentMethodEnum values (e.g., gcash/paymaya/card/bank_transfer/ewallet/qrph) and never sets invalid values like "PayMaya".
- [ ] Add explicit mapping from PayMongo source.type (and/or existing transaction.payment_method) to the enum values used by the database check constraint.
- [ ] Add a fallback behavior (e.g., default to "gcash" or set to NULL if allowed) when PayMongo returns an unknown payment method.
- [x] Update webhook to avoid 500 by normalizing payment_method to valid enum values and catching IntegrityError.

- [ ] Run a quick local lint/test (if available) or at least ensure code imports/types are valid.

