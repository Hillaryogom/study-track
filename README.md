# StudyTrack — Digital Study Habit Tracker

StudyTrack is a responsive web application for students to create subjects, set
daily and weekly study goals, log study sessions, and see whether their study
habits are actually holding up. It was built for Assignment Group 03.

Built with React, TypeScript, Vite, Firebase Authentication, Cloud Firestore,
Chart.js, and deployed on Vercel.

## What it does

- **Accounts** — register, sign in, reset a password, sign out, protected routes
- **Subjects** — create, edit and delete subjects with a colour, an optional
  target in hours, and a progress percentage
- **Study sessions** — log what you studied, when, for how long, with notes;
  filter your history by subject and date range
- **Goals** — daily or weekly targets, for one subject or all of them, with
  progress worked out from qualifying sessions; completed goals stay visible as
  achievements
- **Dashboard** — total study time, weekly hours, active subjects, current
  streak, a seven-day bar chart, subject progress, active goals, recent sessions
- **Progress** — daily chart, four-week comparison, subject distribution,
  average session length, active days, strongest day, and a written summary

Tasks, exams, messaging and a general planner appear in the visual reference but
are outside the Group 03 brief, so they are deliberately not built.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

### Running without Firebase

Set `VITE_USE_DEMO_MODE=true` in `.env` and the app runs against local demo
adapters. Accounts and study data stay in that browser's `localStorage`, nothing
leaves the machine, and no Firebase project is needed. This is how the browser
tests run. Deployed builds must keep it `false`.

## Firebase setup

1. Create a project at <https://console.firebase.google.com>.
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database** → create a database in production mode.
4. **Project settings → Your apps → Web app** → copy the configuration values
   into `.env`:

   ```
   VITE_FIREBASE_API_KEY=…
   VITE_FIREBASE_AUTH_DOMAIN=…
   VITE_FIREBASE_PROJECT_ID=…
   VITE_FIREBASE_STORAGE_BUCKET=…
   VITE_FIREBASE_MESSAGING_SENDER_ID=…
   VITE_FIREBASE_APP_ID=…
   VITE_USE_DEMO_MODE=false
   ```

5. Deploy the security rules and indexes:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # select your project
   firebase deploy --only firestore:rules,firestore:indexes
   ```

These values are public browser configuration, but they are environment
specific, so `.env` is git-ignored and only `.env.example` is committed.

### Data model

Four top-level collections, each record carrying an `ownerId`:

| Collection | Fields |
| --- | --- |
| `users/{uid}` | `displayName`, `email`, `createdAt`, `updatedAt` |
| `subjects/{id}` | `ownerId`, `name`, `colour`, `targetHours`, `description`, timestamps |
| `studySessions/{id}` | `ownerId`, `subjectId`, `studyDate` (`YYYY-MM-DD`), `durationMinutes`, `notes`, timestamps |
| `goals/{id}` | `ownerId`, `subjectId`, `title`, `period`, `targetMinutes`, `startDate`, `endDate`, timestamps |

`firestore.rules` requires an authenticated user, matches `ownerId` against the
signed-in UID on every operation, blocks ownership transfer on update, and
validates field types and ranges. `users/{uid}` is reachable only by that user.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type-check and produce the production bundle in `dist/` |
| `npm run preview` | Serve the production bundle locally |
| `npm run lint` | ESLint over the whole repository |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest once — 51 unit and component tests |
| `npm run test:coverage` | Vitest with a V8 coverage report |
| `npm run test:e2e` | Playwright browser workflow at desktop and mobile sizes |
| `npm run emulators` | Firebase emulators for Firestore and Auth |

Playwright needs its browsers once: `npx playwright install chromium`.

## Testing

Tests describe behaviour a student would notice, not implementation detail:

- **Unit** — streaks, date ranges, duration formatting, subject totals, goal
  progress, productivity summaries
- **Component** — login validation and error mapping, subject/session/goal forms,
  dashboard empty states, mobile navigation and focus handling
- **Service** — the demo repository contract, including owner isolation and the
  cascade when a subject is deleted
- **Security rules** — designed for the Firebase Emulator Suite; run
  `npm run emulators` and exercise the rules against it
- **Browser** — a full register → subject → session → goal → dashboard →
  progress workflow, plus route protection and a failed sign-in

## Architecture

```text
src/
  app/          Shell, routing, route guard, error boundary
  components/   Shared buttons, dialogs, toasts, empty and loading states
  features/
    auth/       Login, registration, reset, authentication state
    dashboard/  Metrics, weekly chart, recent activity
    subjects/   Subject CRUD and progress
    sessions/   Study-session CRUD and history
    goals/      Goal CRUD and progress
    progress/   Daily and weekly reporting, productivity summary
  lib/          Environment reading and Firebase initialisation
  services/     Typed auth and study contracts, Firebase and demo adapters
  state/        Authentication and study-data providers
  types/        Domain models
  utils/        Local-date helpers and pure analytics
  styles/       Tokens, global styles, per-feature styles
```

Features depend on the service contracts only. Swapping Firebase for the demo
adapters happens in one file, `src/services/serviceFactory.ts`, and no feature
code changes.

## Deploying to Vercel

1. Push the repository to GitHub:

   ```bash
   git init
   git add .
   git commit -m "feat: StudyTrack digital study habit tracker"
   git branch -M main
   git remote add origin https://github.com/<your-org>/studytrack.git
   git push -u origin main
   ```

2. In Vercel, **Add New → Project** and import the repository. The framework is
   detected as Vite; the build command is `npm run build` and the output
   directory is `dist`.
3. Add the six `VITE_FIREBASE_*` variables under **Settings → Environment
   Variables** for Production, Preview and Development. Add
   `VITE_USE_DEMO_MODE=false`.
4. Deploy. `vercel.json` rewrites application routes to `index.html` so a direct
   link to `/subjects` works, and sets basic security headers.
5. In Firebase, **Authentication → Settings → Authorized domains**, add the
   Vercel domain.
6. Verify the deployment: register an account, add a subject, log a session,
   confirm the dashboard updates and that a second account sees none of the
   first account's data.

## Accessibility

Keyboard reachable throughout, with a skip link, visible focus rings, focus
trapping and restoration in dialogs and the mobile drawer, Escape to dismiss,
`aria-current` on the active destination, a live region for notifications, text
equivalents beside every chart, and reduced-motion support. Layouts hold from
320px to desktop.

## Team

Arham, Supreet, Hillary and Sujan. Branch ownership and the merge order are in
[`TEAM_WORKFLOW.md`](./TEAM_WORKFLOW.md).
