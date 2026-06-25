# Status Model

This app uses status tracking, not GPS or live map tracking. Customers see progress when staff or riders update the order status.

## Rider-Facing Statuses

| Status | Meaning | Rider Action |
| --- | --- | --- |
| `assigned` | The delivery is assigned to the rider but not yet picked up. | Confirm pickup when the item is received from the shop. |
| `picked_up` | The rider has the order from the shop. | Start delivery when leaving for the recipient. |
| `out_for_delivery` | The rider is actively traveling to the recipient. | Mark arrived after reaching the delivery location. |
| `arrived` | The rider is at or near the delivery address. | Take proof photo and complete delivery. |
| `delivered` | Delivery is completed with proof. | No further rider action. |
| `issue_reported` | Rider needs admin/staff help. | Wait for instructions or continue once issue is resolved. |
| `failed` | Delivery could not be completed. | Admin/staff review required. |

## Customer-Facing Statuses

| Status | Meaning |
| --- | --- |
| `preparing` | The order is being prepared by staff/florists. |
| `ready_for_delivery` | The order is packed and ready for delivery. |
| `out_for_delivery` | The order is on the way. |
| `delivered` | The order has been delivered. |

## Status Mapping

| Rider/Internal Status | Customer Status |
| --- | --- |
| `assigned` | `ready_for_delivery` |
| `picked_up` | `ready_for_delivery` |
| `out_for_delivery` | `out_for_delivery` |
| `arrived` | `out_for_delivery` by default |
| `delivered` | `delivered` |
| `issue_reported` | Keep previous customer status unless staff changes it. |
| `failed` | Keep previous customer status unless staff changes it. |

## Notes

- `arrived` should be rider/admin-facing by default. Expose it to customers only if product decides it is useful.
- Do not show GPS location, moving map pins, or ETA from rider movement in the MVP.
- If the app later adds WebSocket updates or polling, the source of truth is still the delivery status, not live location.
