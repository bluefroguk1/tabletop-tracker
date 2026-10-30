# Tabletop Tracker

Track turns, rounds and scores for tabletop games. Works offline in Pass & Play mode; live multiplayer via Firebase Realtime Database.

## Features

- **Pass & Play** — single device, auto-saved to localStorage, works offline after first load
- **Live Multiplayer** — real-time sync across devices via Firebase (optional — see setup below)
- Presets: Generic tabletop and Warhammer-style (category scoring: Primary / Secondary / Bonus / Penalty)
- Optional turn timer with warn-only or auto-advance expiry
- Simple scoring or named category scoring
- Full game history, results screen, round/category breakdowns
- Dark and light themes, installable as PWA

---

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173/tabletop-tracker/
npm test          # 25 unit tests
npm run build     # production build → dist/
```

---

## Multiplayer setup (Firebase)

Multiplayer requires a Firebase Realtime Database. The free Spark plan is enough for friend groups.

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Enable **Realtime Database** (choose your region)
3. Set database rules:
   ```json
   { "rules": { "games": { "$gameId": { ".read": true, ".write": true } } } }
   ```
4. Copy project config from **Project settings → Your apps → Web app**
5. Create `.env.local` in the project root:
   ```
   VITE_FIREBASE_API_KEY=…
   VITE_FIREBASE_AUTH_DOMAIN=…
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=…
   VITE_FIREBASE_STORAGE_BUCKET=…
   VITE_FIREBASE_MESSAGING_SENDER_ID=…
   VITE_FIREBASE_APP_ID=…
   ```

Pass & Play works with no Firebase config.

---

## Deploy to GitHub Pages

### Automatic (CI)

1. Push to GitHub repo named `tabletop-tracker` (or change `base` in `vite.config.ts`)
2. **Settings → Pages → Source → GitHub Actions**
3. Add the seven `VITE_FIREBASE_*` secrets to **Settings → Secrets → Actions**
4. Push to `main` — `.github/workflows/deploy.yml` builds and deploys

### Manual

```bash
npm run build && npx gh-pages -d dist
```

---

## Architecture

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript + Tailwind v4 |
| State | Zustand (persisted to localStorage for Pass & Play) |
| Multiplayer | Firebase Realtime Database (optional, gracefully absent) |
| Router | React Router v7 (HashRouter — required for GitHub Pages) |
| Build/Tests | Vite 8 / Vitest |

**Key files:** `src/types.ts` — data types · `src/engine.ts` — pure state transitions · `src/store.ts` — Zustand + Firebase wire-up · `src/firebase.ts` — adapter (no-ops if unconfigured)

### Known limits

- Timer auto-advance can be delayed a few seconds if a browser tab is suspended; `warn` mode is unaffected.
- Multiplayer requires connectivity; offline writes are not queued.
- Session IDs live in localStorage. Clearing browser data loses admin identity; the admin can reassign slots.
- Firebase free tier: 100 simultaneous connections, 1 GB storage, 10 GB/month transfer.

---

Old Vite template notes removed. Original Vite README:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
