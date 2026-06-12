# LaunchGrid Android (native Kotlin / Jetpack Compose)

Native Android companion app for the LaunchGrid platform. Replaces the earlier
Expo/React Native app (`launchgrid-mobile`, removed June 2026 — source remains in git history).

- **Package**: `in.launchgrid.mobile`
- **Stack**: Kotlin 2.1, Jetpack Compose (Material 3), single-activity, Navigation Compose,
  OkHttp + kotlinx.serialization, Coil, EncryptedSharedPreferences (Keystore-backed)
- **Build**: AGP 8.13.2, Gradle 8.14.3, JDK 17, minSdk 26, target/compileSdk 36 — no NDK required

## Run

Open this folder (`launchgrid-android`) directly in Android Studio and press Run. Or:

```powershell
.\gradlew.bat assembleDebug   # APK at app/build/outputs/apk/debug/
.\gradlew.bat installDebug    # install on a connected device/emulator
```

Sign in with any existing LaunchGrid account.

## Architecture rules (same as the platform)

- All business-logic **writes** go through `https://launchgrid.in/api/*` with Bearer auth —
  never direct DB writes from the app (`Repo.updateOrderStatus`, `Repo.deleteAccount`).
- Supabase direct access (PostgREST) is for **reads** under RLS and **auth** only.
- Tokens live in Keystore-backed `EncryptedSharedPreferences` (`SessionStore`), with
  single-flight silent refresh (`AuthClient.validToken`).
- The Supabase anon key in `BuildConfig` is a public, RLS-scoped client credential — it ships
  in every client by design.

## What's implemented

- **Auth**: email/password sign-in (Supabase GoTrue REST), session persistence, silent token
  refresh, automatic sign-out when the refresh token dies
- **Home**: store name/subdomain/plan chip, today's revenue/orders/visitors, unfulfilled
  orders needing attention, pull-to-refresh
- **Orders**: full list with status badges; detail view with items, customer + shipping
  address, forward-only one-tap status advance (packed → shipped → delivered) with
  confirmation + idempotency keys, share-update intent
- **Products**: catalogue with images, stock/hidden state, per-product share links,
  catalog-cap upgrade meter at 80%+, Add → web dashboard
- **Settings**: plan (read-only — no billing links, store-compliant), notification permission
  flow, Privacy/Terms/Support links, sign out, **in-app account deletion** with typed
  DELETE confirmation (Play policy requirement)
- **FCM push for order alerts**: Firebase project `launchgrid-cd890`
  (`app/google-services.json`), `PushService` on the high-priority `orders` channel,
  device registration via `POST /api/v1/devices` on sign-in / permission grant / token
  rotation, unregistration on sign-out. Server sends via FCM HTTP v1 (`src/lib/push.ts`
  in the web repo).

### Push: one remaining server config step

The web backend needs the Firebase **service account JSON** to send via FCM:
Firebase console → Project settings → Service accounts → Generate new private key,
then set the whole JSON as the `FIREBASE_SERVICE_ACCOUNT` env var on Vercel
(and in `.env.local` for local dev). Without it, FCM sends are skipped with a log line.

## Not yet implemented

- Play in-app review prompt after a delivered order.
- Camera-based product creation (old app had a stub; web import is the v1 path).

## Play Store submission checklist

Carried over from the old app's README (see git history of `launchgrid-mobile/README.md`
for the full version): Data Safety form mirroring the privacy policy, screenshots,
content rating Everyone, category Business, demo account for review, app name
"LaunchGrid — Business Manager". Release builds need a signing keystore
(`Build → Generate Signed App Bundle` in Android Studio).
