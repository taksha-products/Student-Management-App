# EduNex Parent — branches, builds & release versions

## Branch map

| Branch | Purpose | EAS profile | Artifact | Destination |
| --- | --- | --- | --- | --- |
| `dev` | Day-to-day work + tester builds | `preview` | **APK** | Internal install / Testers |
| `production` | Store releases only | `production` | **AAB** | Google Play |

Rule of thumb: **all feature work lands on `dev` first**. `production` only receives merges that are ready for Play Store.

```
feature work → PR into dev → APK test
                 ↓ (when ready)
           merge into production → AAB → Play Store
```

---

## Two version numbers (do not confuse them)

| Name | Example | Who updates it | What it is |
| --- | --- | --- | --- |
| **User version** (`expo.version`) | `1.2.0` | **You**, on every Play release | What parents see on the login footer (“Version 1.2.0”) and in the stores |
| **Android versionCode** | `14`, `15`, `16`… | **EAS auto** (`autoIncrement: true`) | Integer Google Play requires; must rise every upload |

Also keep `package.json` `"version"` equal to `app.json` → `expo.version`.

Git tags always match the user version: `v1.2.0`.

---

## One-time setup (do this once)

1. Create the GitHub repo and push local `master` (or rename it).
2. Create branches:
   ```bash
   git checkout -b dev
   git push -u origin dev
   git checkout -b production
   git push -u origin production
   ```
3. In GitHub → Settings → Secrets → Actions, add:
   - `EXPO_TOKEN` — from https://expo.dev/settings/access-tokens
4. (Play Store) Create the app in Google Play Console (`com.edunex.parent`), complete store listing, and connect a Google service account to EAS Submit:
   ```bash
   eas submit:configure
   ```
5. Confirm EAS project is linked (`eas.json` already has `projectId`).

Optional CI: workflows under `.github/workflows/` build APK on `dev` and AAB on `production` when you push.

---

## Daily / testing flow (`dev` → APK)

1. Branch from `dev`, make changes, open PR → merge to `dev`.
2. Build the tester APK (manual or CI):
   ```bash
   git checkout dev
   git pull
   npx eas-cli@latest build -p android --profile preview
   ```
3. Install the APK from the Expo build page and smoke-test:
   - Login / OTP
   - Home, payments, bus map
   - App opens (minify is on — watch for launch crashes)
4. Share the Expo build link with testers. No Play Store upload for `dev`.

`versionCode` increments automatically on each preview build. You usually **do not** bump `1.0.0` for every test APK.

---

## Production release flow (`production` → AAB → Play) — step by step

Do this only when `dev` is tested and ready for the store.

### Step 1 — Decide the new user version

Use [semver](https://semver.org/):

| Change | Bump | Example |
| --- | --- | --- |
| Bug fixes only | patch | `1.2.0` → `1.2.1` |
| New features, backward compatible | minor | `1.2.1` → `1.3.0` |
| Breaking / major redesign | major | `1.3.0` → `2.0.0` |

### Step 2 — Bump version on `dev` first

Edit **both** files to the same value:

- `app.json` → `expo.version`
- `package.json` → `version`

Example: set both to `1.1.0`.

Commit on `dev`:

```bash
git checkout dev
git pull
# edit app.json + package.json
git add app.json package.json
git commit -m "chore: bump version to 1.1.0"
git push origin dev
```

### Step 3 — Final APK check (recommended)

```bash
npx eas-cli@latest build -p android --profile preview
```

Install and re-test the release candidate. Fix issues on `dev` if anything fails.

### Step 4 — Merge `dev` → `production`

```bash
git checkout production
git pull
git merge dev
git push origin production
```

### Step 5 — Tag the release

```bash
git tag -a v1.1.0 -m "EduNex Parent 1.1.0"
git push origin v1.1.0
```

Optional: create a GitHub Release for `v1.1.0` with a short changelog.

### Step 6 — Build the Play Store AAB

```bash
git checkout production
npx eas-cli@latest build -p android --profile production
```

EAS bumps `versionCode` automatically. Download/check the build on expo.dev when it finishes.

### Step 7 — Submit to Google Play

```bash
npx eas-cli@latest submit -p android --latest --profile production
```

Or upload the `.aab` manually in Play Console → Production (or Internal testing / Closed testing first).

### Step 8 — Play Console checklist

1. Choose track: Internal → Closed → Open → Production (promote when ready).
2. Confirm **version name** = `1.1.0` and **version code** is higher than the last upload.
3. Add release notes.
4. Roll out (staged % or full).
5. Monitor crashes / ANRs for 24–48h.

---

## Quick cheat sheet

| Goal | Branch | Command |
| --- | --- | --- |
| Tester APK | `dev` | `eas build -p android --profile preview` |
| Store AAB | `production` | `eas build -p android --profile production` |
| Upload to Play | `production` | `eas submit -p android --latest` |
| See remote versionCode | any | `eas build:version:get -p android` |

---

## What you bump vs what EAS bumps

| Action | You | EAS |
| --- | --- | --- |
| Every tester APK | nothing (optional) | `versionCode` +1 |
| Every Play release | set `expo.version` + `package.json` + git tag `vX.Y.Z` | `versionCode` +1 |
| Hotfix on same user version | keep `1.1.0`, new AAB only | `versionCode` +1 (required by Play) |

Hotfix example: parents still see `1.1.0`, but Play gets `versionCode` 17 after 16. Tag as `v1.1.0-build17` or just note it in the GitHub Release — do **not** reuse an old AAB.

---

## Don’ts

- Don’t commit `.env` or keystores.
- Don’t build store AABs from untested `dev` commits — merge only after APK QA.
- Don’t lower `expo.version` or reuse a Play `versionCode`.
- Don’t put long-lived work only on `production`; keep it a release branch.
