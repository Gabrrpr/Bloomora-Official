# Rider UX Flow

The rider app should guide the rider through one delivery task at a time. Every screen should make the next action obvious.

## UX Principles

- Keep typing low. Use buttons, presets, and clear choices.
- Use large touch targets for riders who may be walking, carrying items, or checking directions.
- Use simple labels. Prefer "Open map" over "Navigate" and "Take proof photo" over "Upload delivery evidence."
- Keep admin-only details out of rider screens.
- Show one primary action at the bottom of the delivery detail screen.

## Main Journey

| Step | Rider Goal | UI Requirement |
| --- | --- | --- |
| Login | Access the app with a delivery staff account. | Accept username/email and password. Reject non-delivery roles with a clear message. |
| View current delivery | See the active task immediately. | Home should prioritize current delivery, next action, recipient, address, call, and map. |
| Open delivery detail | Check all delivery instructions. | Show status timeline, recipient, phone, address, items, handling notes, and delivery notes. |
| Call recipient or open maps | Contact or navigate quickly. | Use icon buttons with clear labels and enough spacing. |
| Update status | Move the task forward. | Use one sticky primary action for each stage. Use slide or hold confirmation for important updates. |
| Submit proof photo and note | Complete the delivery. | Require a photo. Make the note optional and offer quick note presets. |
| Review completed deliveries | Confirm past work and proof. | History should show completed deliveries by day, completion time, and proof indicator. |

## Recommended Screen Roles

| Screen | Role |
| --- | --- |
| Home | Current task and today's quick summary. |
| Deliveries | Queue of assigned, active, and completed tasks. |
| Delivery Detail | Main action workspace for one delivery. |
| Proof of Delivery | Camera, proof preview, optional note, and submit action. |
| History | Completed delivery records for accountability. |
| Profile | Minimal rider account, shift, and staff details. |

## Issue Reporting

Add `Report Issue` as a secondary action on the delivery detail screen. This is important because delivery work is not always a clean status ladder.

| Issue | Rider Input |
| --- | --- |
| Recipient unavailable | Quick preset plus optional note. |
| Wrong or incomplete address | Quick preset plus optional note. |
| Delivery delayed | Quick preset plus optional note. |
| Item concern | Quick preset, optional note, and optional photo if needed. |
| Other issue | Required short note. |

When an issue is reported, notify admin/staff and keep the delivery visible to the rider until staff resolves it or gives new instructions.
