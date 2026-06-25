# API Contract

The rider app should reuse the existing mobile API and auth patterns from `apps/mobile/estings-mobile/services`.

The backend already has users, orders, staff roles, and a `Delivery` model. The rider app should extend that flow instead of creating a separate delivery system.

## Planned Endpoints

| Endpoint | Role | Purpose |
| --- | --- | --- |
| `GET /deliveries/rider/me` | Delivery | List the current rider's assigned and active deliveries. |
| `GET /deliveries/rider/history` | Delivery | List completed deliveries for the current rider. |
| `GET /deliveries/{delivery_id}` | Delivery/Admin/Staff | Get one delivery with order and recipient details. |
| `PATCH /deliveries/{delivery_id}/status` | Delivery | Move a delivery through allowed rider statuses. |
| `POST /deliveries/{delivery_id}/proof` | Delivery | Upload proof photo and optional proof note. |
| `POST /deliveries/admin/assign` | Admin/Staff | Assign a ready order to a delivery rider. |
| `GET /deliveries/admin/riders` | Admin/Staff | List delivery staff with branch, availability, and workload. |
| `GET /deliveries/admin/assignable-orders` | Admin/Staff | List paid orders ready for delivery assignment. |

## Minimum Delivery Object

```ts
type RiderDelivery = {
  id: string;
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  itemSummary: string;
  handlingNotes: string[];
  deliveryNotes?: string | null;
  status: 'assigned' | 'picked_up' | 'out_for_delivery' | 'arrived' | 'delivered' | 'issue_reported' | 'failed';
  assignedRider?: {
    id: string;
    name: string;
    phoneNumber?: string | null;
  } | null;
  assignedArea?: string | null;
  scheduledAt?: string | null;
  estimatedArrival?: string | null;
  pickedUpAt?: string | null;
  inTransitAt?: string | null;
  arrivedAt?: string | null;
  deliveredAt?: string | null;
  proofPhotoUrl?: string | null;
  proofNote?: string | null;
};
```

## Assignment Rules

- Only admin/staff can assign deliveries.
- Only paid orders that are ready for delivery should appear in assignable orders.
- The first MVP is guided manual assignment:
  - filter by branch and delivery area
  - show rider availability and active workload
  - admin/staff chooses the rider
- Pampanga in-house riders are the first supported group.

## Status Update Rules

- Riders can update only their assigned deliveries.
- Status changes must follow the allowed order:
  - `assigned`
  - `picked_up`
  - `out_for_delivery`
  - `arrived`
  - `delivered`
- Proof photo is required before final `delivered`.
- Issue reporting should not erase the previous status.
