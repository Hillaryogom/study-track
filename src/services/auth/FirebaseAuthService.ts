import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "../../lib/firebase";
import type { AuthService, AuthUser, Unsubscribe } from "./AuthService";

export class FirebaseAuthService implements AuthService {
  subscribe(listener: (user: AuthUser | null) => void): Unsubscribe {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      listener(
        user
          ? {
              uid: user.uid,
              displayName: user.displayName ?? user.email?.split("@")[0] ?? "Student",
              email: user.email ?? "",
            }
          : null,
      );
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    // A profile document may be missing for accounts created outside the app.
    await ensureUserProfile({
      uid: credential.user.uid,
      displayName: credential.user.displayName ?? email.split("@")[0],
      email: credential.user.email ?? email,
    });
  }

  async register(displayName: string, email: string, password: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    await updateProfile(credential.user, { displayName: displayName.trim() });
    await ensureUserProfile({
      uid: credential.user.uid,
      displayName: displayName.trim(),
      email: credential.user.email ?? email,
    });
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(getFirebaseAuth());
  }
}

/** `users/{uid}` mirrors the account so the interface can greet the student by name. */
async function ensureUserProfile(user: AuthUser): Promise<void> {
  const reference = doc(getFirestoreDb(), "users", user.uid);
  const snapshot = await getDoc(reference);
  if (snapshot.exists()) {
    await setDoc(
      reference,
      { displayName: user.displayName, email: user.email, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return;
  }
  await setDoc(reference, {
    displayName: user.displayName,
    email: user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
