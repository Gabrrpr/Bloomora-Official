# Esting's Rider App Docs

The MVP goal is to build a simple task app for Esting's in-house riders.

This app is for delivery staff who need clear tasks, large actions, and simple words while they are working. It should feel like an operational tool, not a shopping app.

## Planning Docs

| Doc | Purpose |
| --- | --- |
| [Rider UX Flow](./rider-ux-flow.md) | Main rider journey, issue reporting, and low-friction interaction rules. |
| [Status Model](./status-model.md) | Rider-facing and customer-facing delivery statuses. |
| [UI Guidelines](./ui-guidelines.md) | Visual, layout, and copy rules for a consistent rider interface. |
| [Component Patterns](./component-patterns.md) | Reusable component expectations and common app states. |
| [API Contract](./api-contract.md) | Planned backend endpoints and minimum delivery data shape. |
| [QA Checklist](./qa-checklist.md) | Acceptance checks before rider app work is marked complete. |

## Defaults

- Build for Esting's in-house riders first, especially Pampanga.
- Keep Lalamove out of the MVP.
- Treat "live tracking" as real-time status tracking, not GPS tracking.
- Use concise wording for non-technical users.
- Reuse existing rider app theme and component patterns before adding new styles.
