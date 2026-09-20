/**
 * Environment access. Values are read inside functions rather than at module
 * evaluation time so that a production build never fails on a machine that has
 * not configured Firebase yet, and so tests can switch modes freely.
 */

export interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const FIREBASE_KEYS = [
  ["apiKey", "VITE_FIREBASE_API_KEY"],
  ["authDomain", "VITE_FIREBASE_AUTH_DOMAIN"],
  ["projectId", "VITE_FIREBASE_PROJECT_ID"],
  ["storageBucket", "VITE_FIREBASE_STORAGE_BUCKET"],
  ["messagingSenderId", "VITE_FIREBASE_MESSAGING_SENDER_ID"],
  ["appId", "VITE_FIREBASE_APP_ID"],
] as const;

function env(): Record<string, string | undefined> {
  return import.meta.env as unknown as Record<string, string | undefined>;
}

export function isDemoMode(): boolean {
  return env().VITE_USE_DEMO_MODE === "true";
}

export function missingFirebaseKeys(): string[] {
  const values = env();
  return FIREBASE_KEYS.filter(([, key]) => !values[key]?.trim()).map(([, key]) => key);
}

export function hasFirebaseConfig(): boolean {
  return missingFirebaseKeys().length === 0;
}

export function readFirebaseEnv(): FirebaseEnv {
  const missing = missingFirebaseKeys();
  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured. Missing environment variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env and add your Firebase web configuration, or set VITE_USE_DEMO_MODE=true.",
    );
  }
  const values = env();
  return Object.fromEntries(
    FIREBASE_KEYS.map(([field, key]) => [field, values[key] as string]),
  ) as unknown as FirebaseEnv;
}
