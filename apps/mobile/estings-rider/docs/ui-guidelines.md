# UI Guidelines

The rider app should be clear, direct, and consistent with the current Esting's rider UI. It should not feel like the customer shopping app.

## Visual Rules

| Element | Rule |
| --- | --- |
| Primary actions | Use `theme.colors.primary` green. |
| Panels and cards | Use white or `theme.colors.surface` panels on `theme.colors.surfaceAlt`. |
| Supporting text | Use `theme.colors.textMuted`. |
| Danger or failed states | Use `theme.colors.danger` and `theme.colors.dangerBorder`. |
| Spacing | Use values from `theme.spacing`. |
| Radius | Use values from `theme.radius`; cards should stay practical and not overly decorative. |
| Icons | Use existing icon libraries already used by the app. |

## Layout Rules

- Current delivery always gets priority on Home.
- Delivery Detail should have one sticky primary action at the bottom.
- Secondary actions should be icon buttons:
  - call recipient
  - open map
  - report issue
- Delivery cards should show only essential information:
  - order number
  - recipient
  - area or address
  - status
  - schedule or time hint
- Avoid showing payment, discounts, customer account metadata, or admin-only fields in rider screens.
- Long addresses must wrap cleanly and must not push buttons off screen.

## Copy Rules

Use short action labels that a non-technical rider can understand quickly.

| Use | Avoid |
| --- | --- |
| Call recipient | Trigger phone action |
| Open map | Navigate using provider |
| Confirm pickup | Update pickup status |
| Mark out for delivery | Dispatch mutation |
| Take proof photo | Upload evidence payload |
| Report issue | Raise exception |
| Try again | Retry request mutation |

## Interaction Rules

- Use slide or hold confirmation for status changes that affect customers.
- Do not require typing for normal completion.
- Use quick note presets for proof and issue reporting.
- Keep disabled actions visibly disabled with a short reason when needed.
- Network errors should explain what the rider can do next, such as "Try again."
