import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { readFirebaseEnv } from "./env";

/**
 * Firebase is initialised lazily and only once. Demo mode never reaches this
 * module, so a reviewer can run the application without a Firebase project.
 */

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(readFirebaseEnv());
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
