# Team workflow — Assignment Group 03

Four people work on StudyTrack at the same time. The rule that keeps merges calm
is simple: **each person owns a set of folders, and pull requests stay inside
them.** Anything outside your folders needs a review from the person who owns it.

## Ownership and branches

| Person | Branch | Owns |
| --- | --- | --- |
| Arham | `feature/arham-auth` | `src/features/auth/`, authentication pages, authentication component tests |
| Supreet | `feature/supreet-dashboard` | `src/features/dashboard/`, chart presentation, metrics, productivity summaries |
| Hillary | `feature/hillary-study-tracking` | `src/features/subjects/`, `src/features/sessions/`, `src/features/goals/` |
| Sujan | `feature/sujan-firebase-integration` | `src/lib/firebase.ts`, `src/services/`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `vercel.json`, deployment configuration |

Arham and Sujan agree the authentication service contract together
(`src/services/auth/AuthService.ts`). Supreet consumes shared selectors from
`src/utils/analytics.ts` and never writes to Firestore directly. Sujan
coordinates integration and checks that every feature operation is scoped to the
signed-in user.

## Shared files

These belong to everyone, so change them in small commits and say so in the pull
request:

- `src/app/App.tsx` — one route each
- `src/types/domain.ts` — domain models
- `src/utils/` — pure helpers
- `src/components/` — shared controls
- `src/styles/tokens.css`, `src/styles/global.css`

## Merge order

1. Sujan — service contracts, Firebase setup, rules
2. Arham — authentication
3. Hillary — subjects, sessions, goals
4. Supreet — dashboard and charts

Later branches rebase on `main` after each merge:

```bash
git checkout main && git pull
git checkout feature/your-branch
git rebase main
npm run lint && npm run test:run && npm run build
```

## Day-to-day

```bash
git checkout -b feature/your-branch     # once
npm install
npm run dev                             # http://localhost:5173

npm run lint
npm run test:run
npm run build

git add <your files>
git commit -m "feat: short description in the imperative"
git push -u origin feature/your-branch
```

Open a pull request against `main` using the template. Two things are never
negotiable: every Firestore read and write is filtered by `ownerId`, and no
credentials or `.env` files are ever committed.

## Comment style

Comments explain non-obvious domain logic, Firebase constraints, calculations and
integration contracts. They do not restate what the JSX or TypeScript already
says. For example, `// A pending server timestamp reads back as null until the
write is acknowledged` earns its place; `// set the name` does not.
