# EduNex Parent App

Separate Expo app for **parents only**. Shares the School Management backend.

## Features

- Mobile OTP login + multi-school picker
- Org-branded theme (logo, display name, brand color from `/api/org/theme`)
- Children home cards with outstanding balances
- Child detail: dues, Pay now (Razorpay WebView), payment history, bus info
- Payments tab across all children
- Receipt view
- Account / logout

## Setup

```bash
cd School_Management_Parent_App
cp .env.example .env
# Physical phone: set EXPO_PUBLIC_API_URL to your LAN IP, e.g. http://192.168.1.10:5000
npm install
npm start
```

### Test login

- Phone: `9876500001`
- With backend `OTP_DEBUG=true`, Dev OTP appears on screen
- Greenfield brand: teal `#0F766E` · Riverside brand: blue `#1D4ED8`

## Auth

- `x-api-client: mobile`
- Bearer access + refresh tokens in SecureStore
- No email/password for parents

## Branches & releases

| Branch | Build | Output |
| --- | --- | --- |
| `dev` | EAS `preview` | APK for testing |
| `production` | EAS `production` | AAB for Google Play |

**Versioning**

- You bump the user-facing version (`app.json` `expo.version` + `package.json`) for each Play release.
- EAS auto-increments Android `versionCode` on every build.
- Tag releases as `vX.Y.Z` on `production`.

Full step-by-step: **[docs/RELEASE.md](docs/RELEASE.md)**

### Manual builds (without waiting for CI)

```bash
# Tester APK from dev
git checkout dev
npx eas-cli@latest build -p android --profile preview

# Store AAB from production
git checkout production
npx eas-cli@latest build -p android --profile production
npx eas-cli@latest submit -p android --latest
```

CI: push to `dev` / `production` runs the matching workflow (needs GitHub secret `EXPO_TOKEN`).
