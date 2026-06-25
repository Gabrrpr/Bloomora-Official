# Component Patterns

Use shared rider components to keep screens consistent. Add new components only when the same pattern appears in more than one screen.

## Existing Components

| Component | Expected Use |
| --- | --- |
| `RiderScreen` | Standard scrollable screen shell with title, subtitle, and optional header action. |
| `DeliveryCard` | Compact delivery preview in Home, Deliveries, and History. |
| `MetricCard` | Small summary number for rider performance or daily totals. |

## Planned Shared Components

| Component | Purpose |
| --- | --- |
| `StatusBadge` | Shows rider or customer status with consistent color and label. |
| `StatusTimeline` | Shows delivery progress in detail view. |
| `StickyActionFooter` | Holds the one primary action on delivery detail. |
| `IssueReportModal` | Lets riders report recipient, address, delay, item, or other issues. |
| `ProofCapturePanel` | Shows camera action, proof preview, optional note, and submit state. |
| `EmptyState` | Reusable no-delivery, no-history, or no-network result state. |
| `RetryState` | Reusable failed load or failed update state. |

## Common States

| State | UI Requirement |
| --- | --- |
| Loading | Show a simple loading state without shifting layout dramatically. |
| Empty | Explain the empty state in plain language, such as "No assigned deliveries right now." |
| Offline or network error | Show what failed and provide `Try again`. |
| Update failed | Keep the current status visible and let the rider retry. |
| Completed | Show completion time and proof indicator. |
| Issue reported | Keep the delivery visible and show that admin/staff has been notified. |

## Spacing and Sizing

- Use `constants/theme.ts` for spacing, colors, radius, borders, and icons.
- Keep cards, buttons, counters, and status areas stable in size when labels change.
- Primary action buttons should be large enough for one-handed use.
- Avoid nested cards. A delivery card can contain small rows, but it should not contain another full card.
