# Mobile authentication handoff

The dedicated native OAuth flow changes `apps/backend` and
`apps/mobile/estings-mobile`. Website source files are untouched.

## Password reset

The flow is email → new password → OTP. Sending and resending call
`POST /auth/forgot-password/send-otp`. The final button calls
`POST /auth/forgot-password/reset` with `email`, `otp`, and `new_password`.
Only a successful backend response opens login with a success message. Invalid
or expired codes keep the customer on the code screen for correction/resend.

The existing backend has no password-reset verification-only endpoint. Do not
reuse signup's `/auth/verify-otp`: it changes verification state and consumes
the code. The reset endpoint validates the code and updates the password together.
Email delivery still depends on the backend's mail configuration. A backend
`delivery: dev_fallback` response means the code was logged in its development
terminal instead of delivered by email; mobile cannot fix that server setting.

## Social sign-in: native changes and deployment dependency

### Browser preview

On web, OAuth always returns to `window.location.origin`, even when
`EXPO_PUBLIC_WEB_URL` is set for native builds. The popup's mobile-project
`/oauth/callback` page calls `maybeCompleteAuthSession()` to return the signed code
to the opener. No Android domain association or APK is involved in this web flow.

The backend must allow that exact origin. Its current source explicitly permits
`http://localhost:5173` through `http://localhost:5179`; other addresses depend on
its deployed `CORS_ORIGINS`/frontend configuration. An unapproved address is silently
replaced with the main website, explaining why an Expo preview on port 8081 can
open the storefront instead. The API's provider callback must also reach the same
server that started sign-in; a local API using a production `BACKEND_URL` loses
the OAuth session. Those server settings cannot be repaired by mobile code alone.

The browser-preview fix uses `npm run web` to start at `http://localhost:5179`
instead of port 8081. Open that exact localhost address, not its LAN IP. The local
mobile `.env.local` now points to `https://api.estings.shop/api/v1` so OAuth starts,
returns, and exchanges its code on the same production API used by the website.
This preview uses the production service and its account/data environment.
Stop the old preview and restart with `npm run web`; a hot reload cannot change
the port. Direct `npx expo start --web` still defaults to an unapproved port.

The mobile app uses Expo SDK 54.

### Installed native app: dedicated app callback

Native login now calls `/auth/google` or `/auth/facebook` with `client=mobile`,
a SHA-256 proof challenge, and a fresh app state. Google/Meta still send their
provider response to the registered HTTPS backend callback. The backend binds
mobile/web context to the provider OAuth state, then redirects native success
and failure to the fixed `bloomoramobile://oauth/callback` address. No website
screen or domain association file participates in this native flow.

The app checks the exact scheme, host, path, and state before accepting a code.
It exchanges the encrypted, signed code using `POST /auth/oauth/exchange` with the original
proof verifier in the request body. The backend rejects a missing or wrong proof.
The verifier stays in app memory and is never sent in the browser URL. The app
then loads `/auth/me` and saves the customer session. Duplicate Router/browser
returns share one exchange. If the OS kills the app during login, restart sign-in.

The website continues using `frontend_url`, its HTTPS callback, and the existing
GET code exchange. Its provider registration settings do not need custom-scheme
URLs: only the backend redirects into the app after validating the provider.
The `bloomoramobile` scheme is configured in app.json and the generated Android
manifest. Native sign-in does not require HTTPS app-link registrations.

### Release order

1. Deploy the updated backend routes in `apps/backend/app/api/v1/routes/auth.py`.
   The mobile request parameters and POST proof exchange need this backend version.
   A new APK against the old deployed backend will still follow the website flow.
   No database migration or new provider secret is required by this change.
2. Build and install a fresh APK with the updated mobile code and `expo-crypto`.
   The app version is bumped so the appVersion-based OTA runtime does not match
   the previous binary. Do not publish this native-module change to the old runtime.
3. Verify Google login on a physical device: it should close the auth browser,
   return to the customer tabs, and remain logged in after restarting the app.
4. Inspect the Meta developer dashboard for the Facebook app used by the backend.
   The screenshot's "App not active" rejection happens before our callback and
   requires resolving the app's status/access configuration in Meta. Do not mark
   Facebook verified until an actual account can complete the provider screen.

These changes are local source changes. Backend deployment, a new installed APK,
and successful real-account sign-in have not been verified by automated tests.

## Verification

Run `node scripts/auth-regression.test.cjs` and
`node node_modules/typescript/bin/tsc --noEmit` from the mobile directory.
From `apps/backend`, run
`python -m unittest discover -s tests -p test_mobile_oauth.py` for both providers'
mobile/web success/error redirects, proof validation, encrypted token contents,
and return-target isolation.

On a rebuilt physical app, test both Google and Facebook, provider cancellation,
Facebook email permission refusal, and persisted login after restart. For reset,
test a registered email, wrong code, expired code, resend, a valid reset, and
logging in with the new password. Confirm wrong/expired codes never change the
password. Provider login and delivered email require real accounts and device QA;
mocked regression checks do not establish that those integrations work live.

Reference: [Expo linking into your app](https://docs.expo.dev/linking/into-your-app/).
