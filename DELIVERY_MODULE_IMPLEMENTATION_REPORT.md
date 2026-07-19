# Delivery Module Implementation Report

## Executive Summary

The delivery module has been rebuilt around two explicit fulfillment modes:

- **In-house delivery** is restricted to orders whose delivery provider is exactly `standard`. Eligible orders are grouped into persistent, ordered dispatches and assigned to an active rider and vehicle from the same branch.
- **External delivery** is represented by an external shipment record for Lalamove, GrabExpress, Move It, LBC, and J&T. These shipments have normalized status and event history but never appear in the rider application.

The implementation fixes the original dispatch failure, replaces the admin page's competing assignment flows with a guided workflow, gives riders a single active-dispatch experience, and exposes mode-aware tracking to customers on web and mobile. Route rendering uses MapLibre with the OpenFreeMap Liberty style. Route computation is server-side through OpenRouteService and degrades to available branch/destination markers when routing is unavailable. KartaView imagery is optional and explicitly described as nearby imagery.

The work is on branch `codex/delivery-dispatch-tracking`. The branch was synchronized against `origin/main` before implementation and re-fetched immediately before the Git handoff. The final comparison reported zero divergence from `origin/main` at `aeaf7c2be59aaa12d50cce2a72655c19f4806e0c`.

## Completed Requirements

### Backend and domain

- Enforced exact `standard` provider eligibility for in-house dispatch.
- Required ready-for-pickup status, delivery fulfillment, paid order state, checkout-captured destination coordinates, and a configured branch origin.
- Classified provider-null legacy orders as `review`, with a plain-language delivery-method review reason.
- Made `POST /deliveries/admin/delivery-orders` the canonical dispatch operation with row locks, branch validation, rider and vehicle checks, ordered stops, and an idempotency key.
- Retained `POST /deliveries/admin/assign` as a deprecated single-order wrapper that creates a real `DeliveryOrder`.
- Added persistent stop order, route cache, route distance/duration, issue lifecycle fields, and branch delivery settings.
- Added external shipments and external shipment events with normalized and provider-native statuses.
- Connected Lalamove webhooks to the generic external tracking model with deterministic event keys.
- Rejects manual Lalamove tracking patches so booking/webhook events remain the source of truth.
- Added manual external tracking controls for providers without webhook integration.
- Added legacy backfills without deleting historical delivery records.
- Added atomic dispatch pickup, issue resolution, route regeneration/preview, destination verification, delivery-method review, branch settings, and external shipment APIs.
- Added role-scoped route and street-photo access.

### Admin web

- Split the former 2,234-line delivery page into a page controller and reusable route-map module.
- Added four plain-language work areas: In-house Dispatches, External Shipments, Riders & Vehicles, and Delivery Settings.
- Restored the established summary-card layout and delivery configuration for fee, minimum order, same-day cutoff, and branch filtering.
- Added branch-level filtering, eligibility explanations, automated checkout-pin validation, ordered stop arrangement, route preview, rider/vehicle assignment, review, submission progress, modal-local errors, and success summary.
- Preserved wizard state after failed requests.
- Kept operational tables read-only. Legacy delivery-method review and non-automated external shipment updates now open focused edit dialogs.
- Labeled Lalamove as webhook-managed and removed routine status/reference/link editing for it. Providers without an API integration retain an explicit provider-portal fallback editor.
- Added dispatch route inspection, issue resolution, branch-origin management, external tracking, and vehicle controls.
- Replaced mutation-triggered full-page reloads with background refreshes that preserve the active tab, scroll position, and mounted content.
- Added delivery-date urgency in the Manila timezone. Today, tomorrow, future, and overdue dates have distinct treatments, with overdue rows showing the exact number of late days.
- Added the explicit empty state **No dispatch available** when the selected branch has no active in-house route.
- Replaced the flat vehicle list with responsive fleet cards using the supplied Philippine motorcycle, sedan, utility van, and box-truck artwork. Each transparent PNG was cropped, proportionally fitted to a shared 720 × 360 canvas, and exported as a lossless WebP so every vehicle uses the same visual baseline without losing detail.
- Added connected-dot status steppers for in-house dispatches and external shipments, including interrupted and issue states.
- Added the original repository courier logos for Lalamove, GrabExpress, Move It, LBC, and J&T Express. Their uneven transparent margins were removed and the unchanged brand artwork was exported as lossless WebP assets. A shared `CourierBrand` component now gives every provider the same centered white logo surface, padding, label position, and dark-mode treatment in both the partner strip and shipment cards.
- Adjusted headings, metrics, controls, and dark-mode form fields to use slate and brand tones instead of pure black or pure white body typography.
- Removed the decorative vehicle-card shadow and green image background. Fleet cards are now neutral, read-only, and open one focused view/edit dialog to prevent accidental inline changes.
- Added address search to the pinnable branch-origin editor. Search results populate the address and coordinates while the pin remains draggable for final correction.

### Rider application

- Reworked Home around one current dispatch and removed the duplicate batch-pickup action.
- Added one persistent review/start action and an atomic dispatch pickup request.
- Added a planned route map, numbered stops, next-stop emphasis, and destination context.
- Added route and nearby street-photo views on the stop screen.
- Corrected failed deliveries being rendered with a completed badge.
- Added a waiting-for-resolution state for reported issues; resolving an issue restores the recorded previous stop state.

### Customer web and mobile

- Added normalized in-house/external tracking data.
- Added planned route maps for standard delivery only.
- Added delivery timeline, rider/vehicle/proof data already exposed by the delivery record, and nearby KartaView imagery.
- Added external provider, reference, normalized timeline, intervention state, and official tracking link without exposing an in-house rider map.
- Added the required label: **Planned route — not live rider location.**
- Introduced no rider GPS permission, background location process, upload, or location storage.
- Restored **Esting's Delivery** as the explicit standard in-house fulfillment option in both web and mobile checkout. It uses the configured branch delivery fee and requires a customer destination pin.

### Custom flower design

- Kept the last request editable after generation and added direct regenerate/try-again actions without discarding the current result.
- Improved stocked recipe completion so recommendations prioritize a main flower together with filler, ribbon/accessory, and presentation materials when inventory permits.
- Added three stock-aware alternative prompt cards to unavailable-inventory responses. Customers can select an option, edit it, and regenerate instead of reaching a dead end.

## Root Causes of the Original Dispatch Failure

1. The admin page had overlapping assignment paths with different backend effects. The legacy single-order path created a `Delivery` row without a parent `DeliveryOrder`.
2. Rider delivery queries only returned deliveries attached to a `DeliveryOrder`, so a successful-looking legacy assignment disappeared from the rider application.
3. Dispatch eligibility was not modeled consistently across the API and UI. Provider, payment/readiness, branch, pin, rider, and vehicle restrictions could fail late and without a useful local message.
4. The modal disabled or submitted actions without durable progress, inline validation, or modal-local API feedback. A page-level error could be hidden behind the open modal.
5. Customer tracking was coupled to Lalamove-specific fields instead of a delivery-mode contract.
6. Rider Home and dispatch detail offered overlapping start/pickup actions, failed stops were styled as completed history, and issue reporting had no recoverable resolution state.

The new design addresses the domain inconsistency first: every in-house assignment now creates a persistent dispatch, and every UI consumes the same dispatch/tracking records.

## Architecture and Data Flow

### In-house dispatch

1. The admin assignable-order endpoint returns every relevant order with `deliveryMode`, destination-coordinate state, eligibility, and blocking reasons.
2. The admin selects one branch and eligible standard orders, arranges stop order, selects a rider/vehicle, and previews the route. Destination pins are captured by customer checkout rather than manually verified by staff.
3. Dispatch submission sends branch, rider, vehicle, ordered order IDs, notes, and an idempotency key.
4. The backend locks the orders, verifies all eligibility and branch invariants, rejects active rider/vehicle conflicts, creates the `DeliveryOrder` and ordered `Delivery` stops, and commits atomically.
5. Route generation happens after the dispatch transaction. A routing outage therefore does not roll back or prevent dispatch creation.
6. The rider performs one atomic dispatch pickup, then progresses through the numbered stops.
7. Customers can access only the route attached to their own delivery.

### External shipment

1. An order using a recognized external provider receives an `ExternalShipment` record.
2. Lalamove booking and webhook activity update this generic record and append idempotent events.
3. GrabExpress, Move It, LBC, and J&T are updated through a focused administrator dialog only when their official provider portal changes, because no provider API is connected for those couriers in this iteration.
4. The customer receives provider/reference/status/events/tracking-link data. External shipments are excluded from rider endpoints and maps.

### Separation of responsibilities

- Route handlers enforce authentication, authorization, and HTTP contracts.
- Delivery tracking services normalize providers, statuses, webhook events, and shipment serialization.
- Delivery map services isolate route/photo integrations and fallback behavior.
- SQLAlchemy models own persisted dispatch, stop, issue, route, settings, shipment, and event state.
- Web/mobile API clients normalize network data before presentation.
- Map and page components focus on rendering and interaction rather than delivery rules.

## Schema Changes

### Orders

- `delivery_pin_verified_at`
- `delivery_pin_verified_by_id`

### Delivery orders

- unique `idempotency_key`
- cached route geometry
- route distance and duration
- route generation timestamp and availability reason

### Delivery stops

- `stop_sequence`
- cached route fields for the branch-to-destination view
- `status_before_issue`
- issue code, note, report time, resolution time, resolution note, and resolver

### New tables

- `branch_delivery_settings`: branch pickup pin and verification metadata.
- `external_shipments`: provider, reference, normalized/raw status, official link, timestamps, intervention state, and raw metadata.
- `external_shipment_events`: timestamped normalized/provider event history with a unique provider event key.

## API Changes

### Dispatch and administration

- `POST /deliveries/admin/delivery-orders`
- `POST /deliveries/admin/assign` — deprecated compatibility wrapper
- `GET /deliveries/admin/assignable-orders`
- `GET|PUT /deliveries/admin/branch-settings[/{branch}]`
- `PATCH /deliveries/admin/orders/{order_id}/destination-pin`
- `PATCH /deliveries/admin/orders/{order_id}/delivery-method`
- `POST /deliveries/admin/routes/preview`
- `GET /deliveries/admin/delivery-orders/{dispatch_id}/route`
- `PATCH /deliveries/admin/deliveries/{delivery_id}/resolve-issue`

### Rider and role-scoped map access

- `POST /deliveries/rider/delivery-orders/{dispatch_id}/pickup`
- `GET /deliveries/rider/delivery-orders/{dispatch_id}/route`
- `GET /deliveries/{delivery_id}/route`
- `GET /deliveries/{delivery_id}/street-photos`

### External tracking

- `GET|POST /deliveries/admin/external-shipments`
- `PATCH /deliveries/admin/external-shipments/{shipment_id}`
- `POST /webhooks/lalamove`

The customer order response now exposes a stable tracking envelope with `mode`, provider details, normalized status, events, route availability, proof, tracking link, intervention state, and a clear absence/failure reason.

## User Workflows

### Administrator: standard delivery

1. Open In-house Dispatches and select the branch.
2. Review blocking reasons. Only eligible rows are selectable.
3. If a customer pin is missing, the row explains that checkout did not capture it; there is no staff-side manual pin editor.
4. Open the dispatch wizard, arrange stops, and request a route preview.
5. Select an available rider and active vehicle from the same branch.
6. Review and submit. The modal shows progress, a local error without clearing input, or a success summary.
7. Monitor the dispatch and resolve reported stop issues when needed.

### Administrator: external delivery

1. Open External Shipments.
2. Review provider, reference, status, update source, and tracking action from the read-only list.
3. Lalamove webhook updates appear automatically and cannot be routinely edited from the list.
4. For a courier without an API integration, open Edit and copy only confirmed status/reference/link changes from the courier's official portal. Saving appends the tracking event and refreshes the row without resetting the page.

### Rider

1. Home highlights one current dispatch and its next stop.
2. Review the planned route and numbered stops.
3. Use the single Start route action. The server picks up the dispatch as one transaction.
4. Progress each stop using the existing delivery status/proof workflow.
5. If an issue is reported, wait for admin resolution; the stop becomes actionable again in its prior state after resolution.

### Customer

- Standard: view the planned branch-to-destination route, status timeline, assignment/proof information, and optional nearby imagery.
- External: view provider, reference, normalized events, intervention notice, and official provider link. No rider route is shown.

## Map, Routing, and Street Imagery

- Native maps use `@maplibre/maplibre-react-native` 11.3.6.
- Web maps use `maplibre-gl` 5.24.0.
- All clients use the existing OpenFreeMap Liberty style.
- Routes are requested only by the backend from `https://api.heigit.org/openrouteservice`; credentials are never sent to a client.
- Route geometry, distance, duration, generation time, attribution, markers, and failure reason use one normalized contract.
- If credentials are absent, a request times out, the quota is exhausted, or the provider response is malformed, available branch/destination markers still render and dispatch remains usable.
- KartaView calls are server-proxied and cached for one hour. Empty coverage and upstream failures return a valid empty result.
- Imagery is labeled as nearby street imagery, not a definitive photo of the destination.
- Routes are planned geometry, not live rider positions.

## Migration and Backfill Procedure

The new migration is `f1a2b3c4d5e6_delivery_operations_tracking.py`, based on compatibility revision `e0f1a2b3c4d5`.

The migration:

- adds the order, dispatch, stop, settings, shipment, and event fields/tables;
- backfills recognized third-party providers into external shipments and initial events;
- converts unambiguous orphan standard deliveries with a rider into single-stop delivery orders;
- keeps all original delivery rows and historical data.

### Recovered revision and local upgrade

The configured database originally reported Alembic revision `e0f1a2b3c4d5`, while the repository contained the equivalent FAQ schema under `d9e0f1a2b3c4`. The compatibility revision `e0f1a2b3c4d5_reconcile_deployed_faq_revision.py` reconnects that deployed state to repository history only after inspecting the database and confirming the required `faq_categories` and `faq_items` tables and columns. It owns no DDL and fails closed when the expected schema is absent; no blind `alembic stamp` was used.

After that validation, the currently configured development database was upgraded through `f1a2b3c4d5e6`. Final checks report:

- `alembic current`: `f1a2b3c4d5e6 (head)`
- `alembic heads`: `f1a2b3c4d5e6 (head)`
- history: `d9e0f1a2b3c4 -> e0f1a2b3c4d5 -> f1a2b3c4d5e6`

Each deployment database still needs its own backup, compatibility validation, migration run, and backfill-count review. Pushing code is not what performs an Alembic upgrade; deployment must first receive the migration files and then run `alembic upgrade head` in the backend environment.

## Delivery Operational-Data Cleanup

The local development database contained historical delivery records created by several earlier assignment and courier-tracking implementations. The cleanup was deliberately limited to delivery operational history; it did not remove accounts, riders, orders, fleet vehicles, or branch delivery settings.

The reusable maintenance command is `apps/backend/scripts/cleanup_delivery_operational_data.py`. It is dry-run by default. Execution requires both `--execute` and an explicit backup path, writes the affected records to JSON before deletion, performs the cleanup in one database transaction, and rolls back if any preserved reference count changes or delivery history remains.

The local cleanup removed:

- 30 external shipment events
- 31 external shipments
- 7 delivery stops
- 4 delivery orders
- 2 delivery-linked notifications

It preserved and verified:

- 41 user accounts
- 2 rider accounts
- 174 orders
- 5 vehicles
- 1 branch delivery setting

The recovery backup is `C:\Users\DE LEON\AppData\Local\Temp\bloomora-delivery-operational-backup-20260719-1405.json` (53,272 bytes). A post-clean dry run reported zero remaining removable records and the same preserved counts. This backup path is local to the workstation and must not be treated as a deployment backup.

## Repository Sync and Preserved User Changes

- Scoped-stashed only:
  - `apps/mobile/estings-mobile/app/(support)/live-chat.tsx`
  - `apps/mobile/estings-mobile/app/payment/index.tsx`
- Pulled `origin/main` with `--ff-only`, advancing from `2021d95fc` to `aeaf7c2be`.
- Upstream changed the ordering fulfillment modal and customer checkout; the pull produced no conflict.
- Created local branch `codex/delivery-dispatch-tracking`.
- Restored the two files and verified their combined diff hash remained `cea69b4ebdc4443f08d5fc6beb010306ac182266`.
- Excluded both files from delivery-module implementation edits.
- No reset or force update was performed. A final `git fetch origin --prune` completed successfully and confirmed zero divergence before staging.

## Verification Results

### Passed

- Backend delivery tests: **16 passed**, including checkout-coordinate eligibility without manual verification, missing-pin rejection, external-provider exclusion, status derivation, external completion, webhook key stability, missing route key, successful normalization, route timeout, malformed route response, empty street imagery, photo timeout, and delivery-schema readiness detection.
- Backend full suite: **72 passed**, **9 subtests passed**. The four previously recorded customization failures were fixed by the stock-aware recipe and prompt-recovery work.
- Customer checkout/mobile refinement: web production build passed; customer mobile lint and `npx tsc --noEmit` passed.
- Supabase cleanup dry run found exactly 3 requested orders, 4 order items, 4 reservations, and 3 transactions, with no delivery, dispatch, shipment, review, or notification dependencies.
- Supabase cleanup execution completed transactionally for `ORD-082012F4`, `ORD-12AC55E8`, and `ORD-02EE7999`. It removed 3 orders, 4 order items, 4 stock reservations, and 3 transactions; it removed no delivery, dispatch, shipment, review, notification, or rider-account data.
- Cleanup backup: `C:\tmp\bloomora-orders-backup-20260719-resume.json` (42,078 bytes).
- Backend bytecode compilation: `python -m compileall -q app tests alembic/versions scripts` — passed.
- Alembic graph and configured-database checks: `alembic current`, `alembic heads`, and scoped `alembic history` — passed; current/head is `f1a2b3c4d5e6`.
- Admin/customer web: `npm run build` — passed after the vehicle and courier-asset updates (234 modules transformed).
- Customer mobile: `npm run lint`, `npx tsc --noEmit`, and Expo prebuild configuration resolution — passed.
- Rider mobile: `npm run lint`, `npx tsc --noEmit`, and Expo prebuild configuration resolution — passed.
- `git diff --check` — no whitespace errors; Git reported only line-ending conversion warnings.

### Follow-up local UI verification

- Reproduced the reported rider endpoint failure and traced it to the unapplied delivery schema (`deliveries.stop_sequence` was absent).
- Added `GET /deliveries/admin/schema-status`, which inspects required tables and columns without selecting new ORM fields.
- The admin page now performs this preflight before its operational requests, preventing a cascade of six internal-server errors and showing the exact migration action required.
- Removed the delivery page's nested full-page background/padding shell so it inherits the same admin content spacing as Transactions and the other dashboard sections.
- Standardized delivery primary controls on the shared admin green token `#2E8B34`, with `#0C573E` hover treatment and the established 6 px control radius.
- Browser verification at the live local admin page confirmed zero component padding, transparent component background, full parent width, and computed primary-button color `rgb(46, 139, 52)`.
- Follow-up browser UAT in the signed-in local admin confirmed the concise `Delivery Operations` header, four restored metric cards, populated delivery configuration, gradient primary controls, and coherent dark-mode fields/buttons/dialogs.
- Confirmed the external shipment list contains no inline status/reference/link inputs, distinguishes automatic Lalamove webhooks from provider-portal updates, and opens a modal-local editor only for non-automated couriers.
- Confirmed a background Refresh while External Shipments was active kept the external heading mounted and did not render the full-page loading state.
- Verified the cleaned Pampanga view shows **No dispatch available**, while preserved historical orders display exact overdue badges such as `19 days late` and `18 days late`.
- Verified all five courier logo assets render in the External Shipments partner strip and the empty state remains readable in both themes.
- Compared the normalized courier artwork on equal-size canvases; wide and square provider marks are centered at a consistent visual scale with no source-file whitespace affecting placement.
- Verified the Riders & Vehicles accessibility tree exposes rider cards, vehicle-type side views, assignment selectors, and active/inactive controls for all five preserved vehicles.
- Inspected all four supplied source PNGs and their lossless WebP outputs at original resolution; transparency, aspect ratio, and the shared baseline were preserved for the motorcycle, car, van, and truck.
- Verified the production bundle includes the four optimized vehicle WebPs at 71–89 KB each. The current in-app browser session was not authenticated, so the earlier signed-in delivery UAT remains the latest end-to-end admin session; no credentials were copied into the test browser.
- Verified light and dark modes in the signed-in local admin with no browser console errors, then restored the original light-mode In-house Dispatches view.
- Re-ran `python scripts/cleanup_delivery_operational_data.py` in dry-run mode after cleanup: zero delivery-history rows remained in scope and all preserved counts matched.

### Not executed in this Windows workspace

- A physical-device Android development build and a macOS/Xcode iOS development build were not completed. The dependency graph, TypeScript, lint, and Expo prebuild configuration were validated. Both mobile applications now require development builds rather than Expo Go because MapLibre includes native code.
- Slow/offline network simulation and the complete physical-device UAT matrix were not completed. The critical signed-in admin workflows and fallback services have focused automated coverage.
- A final localhost browser pass was not executed because the in-app browser security policy rejected the local URL. No alternate browser or policy bypass was attempted.

## Configuration and Deployment Steps

1. Include and review both `e0f1a2b3c4d5_reconcile_deployed_faq_revision.py` and `f1a2b3c4d5e6_delivery_operations_tracking.py` in the deployment artifact.
2. Set `OPENROUTESERVICE_API_KEY` on the backend. Keep it absent from all client environments.
3. Optionally override:
   - `OPENROUTESERVICE_BASE_URL` (default `https://api.heigit.org/openrouteservice`)
   - `OPENROUTESERVICE_TIMEOUT_SECONDS` (default 12 seconds)
   - `KARTAVIEW_BASE_URL`
4. Back up the target database, run `alembic current` and `alembic history`, then apply `alembic upgrade head`; do not stamp over an unknown state.
5. Configure a delivery origin for each branch.
6. Review provider-null legacy orders and classify them explicitly.
7. Verify rider branch, active status, online status, and active vehicle assignments.
8. Create fresh Android/iOS development builds for both mobile applications.
9. Run the workflow UAT matrix against migrated staging data before production rollout.

## Known Limitations

- Routes are planned and cached; there is intentionally no live GPS tracking.
- Route duration is a routing estimate, not a live traffic ETA.
- Lalamove is the only automatic external webhook integration in this iteration. Other supported couriers require admin updates.
- KartaView coverage varies by location and may be empty.
- OpenRouteService and KartaView are best-effort, quota-bound services.
- Each non-local environment must run and validate its own Alembic upgrade; the successful local upgrade does not migrate staging or production.
- Existing dependency audits report vulnerabilities in the current application dependency trees. No potentially breaking automatic audit fix was applied as part of this scoped delivery change.

## Rollback Guidance

Before migration, rollback is simply application-code rollback because no database state has changed.

After migration:

1. Stop new dispatch/external shipment writes.
2. Export new dispatch, route, issue, shipment, and event data for audit/recovery.
3. Deploy the previous application version.
4. Prefer leaving additive columns/tables in place during emergency application rollback; the previous application does not depend on them.
5. Use Alembic downgrade only after verifying that removing new tables and columns will not discard operational history. The migration's downgrade is structurally complete but destructive to data stored in the new schema.

## Changed-File Inventory

### Backend models, services, and configuration

- `apps/backend/app/core/config.py`
- `apps/backend/app/models/__init__.py`
- `apps/backend/app/models/order.py`
- `apps/backend/app/models/delivery_operations.py`
- `apps/backend/app/services/delivery_maps.py`
- `apps/backend/app/services/delivery_tracking.py`
- `apps/backend/app/services/customization_rules.py`
- `apps/backend/app/schemas/customization.py`

### Backend routes, migration, and tests

- `apps/backend/app/api/v1/routes/deliveries.py`
- `apps/backend/app/api/v1/routes/orders.py`
- `apps/backend/app/api/v1/routes/webhooks.py`
- `apps/backend/app/api/v1/routes/customization.py`
- `apps/backend/alembic/versions/e0f1a2b3c4d5_reconcile_deployed_faq_revision.py`
- `apps/backend/alembic/versions/f1a2b3c4d5e6_delivery_operations_tracking.py`
- `apps/backend/scripts/cleanup_delivery_operational_data.py`
- `apps/backend/scripts/delete_orders_by_number.py`
- `apps/backend/tests/test_delivery_operations.py`
- `apps/backend/tests/test_customization_rules.py`

### Admin and customer web

- `apps/web/package.json`
- `apps/web/package-lock.json`
- `apps/web/src/pages/admin/AdminDelivery.jsx`
- `apps/web/src/pages/admin/delivery/AdminDeliveryPage.jsx`
- `apps/web/src/pages/admin/delivery/DeliveryRouteMap.jsx`
- `apps/web/src/components/delivery/DeliveryRouteMap.jsx`
- `apps/web/src/assets/delivery/vehicles/motorcycle.webp`
- `apps/web/src/assets/delivery/vehicles/car.webp`
- `apps/web/src/assets/delivery/vehicles/van.webp`
- `apps/web/src/assets/delivery/vehicles/truck.webp`
- `apps/web/src/assets/delivery/couriers/lalamove.webp`
- `apps/web/src/assets/delivery/couriers/grabexpress.webp`
- `apps/web/src/assets/delivery/couriers/move-it.webp`
- `apps/web/src/assets/delivery/couriers/lbc.webp`
- `apps/web/src/assets/delivery/couriers/jt-express.webp`
- `apps/web/src/pages/customer/Orders.jsx`
- `apps/web/src/pages/customer/Checkout.jsx`
- `apps/web/src/pages/customer/DescribeArrangement.jsx`

### Rider mobile

- `apps/mobile/estings-rider/app.json`
- `apps/mobile/estings-rider/package.json`
- `apps/mobile/estings-rider/package-lock.json`
- `apps/mobile/estings-rider/services/deliveries-api.ts`
- `apps/mobile/estings-rider/app/(tabs)/index.tsx`
- `apps/mobile/estings-rider/app/(tabs)/history.tsx`
- `apps/mobile/estings-rider/app/dispatch/[id]/index.tsx`
- `apps/mobile/estings-rider/app/delivery/[id]/index.tsx`
- `apps/mobile/estings-rider/components/rider/delivery-stop-card.tsx`
- `apps/mobile/estings-rider/components/rider/planned-route-map.tsx`
- `apps/mobile/estings-rider/components/rider/planned-route-map.web.tsx`

### Customer mobile

- `apps/mobile/estings-mobile/package.json`
- `apps/mobile/estings-mobile/package-lock.json`
- `apps/mobile/estings-mobile/services/orders-api.ts`
- `apps/mobile/estings-mobile/app/order-details/[id].tsx`
- `apps/mobile/estings-mobile/app/checkout.tsx`
- `apps/mobile/estings-mobile/components/customer-delivery-route-map.tsx`
- `apps/mobile/estings-mobile/components/customer-delivery-route-map.web.tsx`

### Preserved pre-existing user modifications (not delivery implementation changes)

- `apps/mobile/estings-mobile/app/(support)/live-chat.tsx`
- `apps/mobile/estings-mobile/app/payment/index.tsx`

### Documentation

- `DELIVERY_MODULE_IMPLEMENTATION_REPORT.md`

## Final Repository State

- Branch: `codex/delivery-dispatch-tracking`
- Base and `origin/main`: `aeaf7c2be59aaa12d50cce2a72655c19f4806e0c`
- Implementation: complete and verified
- Implementation commit: `1640d8740` (`feat: complete delivery operations and customization workflows`)
- Remote branch: `origin/codex/delivery-dispatch-tracking`
- Remote push: complete
- Destructive Supabase order cleanup: complete with local JSON recovery backup
- Final upstream comparison: zero divergence from `origin/main`
- Reset/force update: none
