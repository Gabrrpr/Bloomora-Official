# QA Checklist

Use this checklist before marking rider app work complete.

## Authentication

- [ ] Delivery staff can log in.
- [ ] Non-delivery users cannot enter the rider app.
- [ ] Inactive or unverified staff accounts cannot enter the rider app.
- [ ] Session persists after app restart.
- [ ] Logout clears the session.

## Delivery Queue

- [ ] No assigned deliveries state works.
- [ ] Assigned deliveries load from the backend.
- [ ] Active delivery appears first.
- [ ] Completed deliveries appear in History, not the active queue.
- [ ] Long addresses wrap without breaking cards.

## Delivery Detail

- [ ] Recipient name and phone are visible.
- [ ] Call recipient button works.
- [ ] Open map button opens the address.
- [ ] Item summary, handling notes, and delivery notes are readable.
- [ ] Primary action is sticky and visible.
- [ ] Buttons are large enough for mobile use.

## Status Updates

- [ ] Status updates persist after reload.
- [ ] Rider cannot skip required stages.
- [ ] Failed network update shows retry.
- [ ] Customer tracking status updates correctly.
- [ ] Completed delivery cannot be edited by accident.

## Proof of Delivery

- [ ] Proof photo is required before delivered.
- [ ] Optional proof note can be submitted.
- [ ] Quick note presets work.
- [ ] Failed proof upload shows retry.
- [ ] Captured proof is not lost immediately after an upload failure.

## Issue Reporting

- [ ] Rider can report recipient unavailable.
- [ ] Rider can report wrong or incomplete address.
- [ ] Rider can report delivery delayed.
- [ ] Rider can report item concern.
- [ ] Rider can report other issue with a required note.
- [ ] Admin/staff can see or be notified of reported issues.

## UX Fit

- [ ] Labels use simple non-technical wording.
- [ ] The app does not show admin-only payment or customer account fields.
- [ ] The current delivery is the easiest thing to find.
- [ ] Empty, loading, completed, and error states are clear.
- [ ] The app remains usable with weak network conditions.
