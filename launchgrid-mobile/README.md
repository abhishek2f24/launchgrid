# LaunchGrid Mobile (Expo / React Native)

Companion app for the LaunchGrid platform — same Supabase auth, same database, same API. Phase 1 scope: dashboard, instant order alerts, one-tap fulfilment, products, settings.

## Run locally

```bash
cd launchgrid-mobile
npm install
# Set env (or fill expo.extra in app.json):
#   EXPO_PUBLIC_SUPABASE_URL=...        (same as web NEXT_PUBLIC_SUPABASE_URL)
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=...   (same as web anon key)
#   EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:3000   (web dev server, for device testing)
npx expo start
```

Scan the QR with Expo Go (Android) or run `npx expo run:ios`. Sign in with any existing LaunchGrid account.

## Before this works end-to-end
1. Run migration **`supabase/migrations/0019_devices.sql`** (device registry for push) — `node run-migration-0019.js` pattern or paste into Supabase SQL editor.
2. Push notifications require a **dev build** (`eas build --profile development`) — Expo Go can receive Expo push tokens for testing, but production uses EAS + FCM/APNs credentials (`eas credentials`).
3. New backend endpoints shipped with this app: `/api/v1/entitlements`, `/api/v1/devices`, `/api/v1/account` (deletion), `/api/v1/meta`. Order alerts fire from `create-order` automatically once a device is registered.

## Release builds (EAS)

```bash
npm i -g eas-cli && eas login
eas build --platform all --profile production
eas submit --platform ios
eas submit --platform android
```

---

## Store compliance checklist (both stores)

### Implemented in-app ✓
- **Account deletion in-app** (Settings → Delete account → typed confirmation → `/api/v1/account`). Required: Apple 5.1.1(v), Google Play account-deletion policy.
- **No in-app purchases / no upgrade links.** Plan is displayed read-only with "manage from the web dashboard" wording and **no tappable billing link** (Apple 3.1.1 / 3.1.3(b) reader-rule compliance for the companion-app model).
- **Permission purpose strings** (app.json): camera, photo library, Face ID — each explains the merchant benefit. Notifications requested contextually ("Never miss an order" card), never on first launch.
- **Privacy Policy + Terms reachable in-app** (Settings → Legal), same URLs as web.
- **Tokens in Keychain/Keystore** (expo-secure-store), not plain storage.
- **No tracking across apps** → no ATT prompt needed on iOS; analytics are first-party only.
- **Android**: `POST_NOTIFICATIONS` runtime permission (13+), high-priority `orders` channel; unneeded permissions explicitly blocked (mic, contacts, location).

### To do at submission time (cannot be done in code)
- **Apple privacy "nutrition label"**: declare Account Info (name, email), Purchases (orders), Photos (when camera feature ships), Identifiers (none), Tracking: NO.
- **Google Play Data Safety form**: mirror `launchgrid.in/legal/privacy` §2/§5 (collected: name, email, phone; shared with: payment processor; encrypted in transit; deletable in-app).
- **Sign in with Apple**: NOT currently required (email/password only — no third-party social login in v1). The moment Google Sign-In is added, Apple Sign-In becomes mandatory.
- Screenshots (6.7"/6.5"/5.5" + Android phone): order alert on lock screen → one-tap fulfil → dashboard → products → settings.
- App name "LaunchGrid — Business Manager"; category Business; content rating: Everyone.
- Demo account for App Review with a seeded store (review teams must be able to log in).

### Architecture rules (keep these or regret it)
- All business-logic **writes** go through `/api/*` with Bearer auth — never direct DB writes from the app.
- Supabase direct access is for **reads** (RLS-scoped), **realtime invalidation**, and **auth** only.
- Realtime events only invalidate TanStack Query caches ("notify, then refetch").
- No business rule may exist only in this repo — see MOBILE_ARCHITECTURE.md.
