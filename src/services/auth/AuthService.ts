export interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
}

export type Unsubscribe = () => void;

export interface AuthService {
  subscribe(listener: (user: AuthUser | null) => void): Unsubscribe;
  signIn(email: string, password: string): Promise<void>;
  register(displayName: string, email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
}

/** Firebase error codes are not suitable for students, so they are translated once here. */
const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "That email or password is incorrect.",
  "auth/invalid-login-credentials": "That email or password is incorrect.",
  "auth/wrong-password": "That email or password is incorrect.",
  "auth/user-not-found": "That email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/email-already-in-use": "An account already exists for that email address.",
  "auth/weak-password": "Choose a password with at least eight characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "You appear to be offline. Check your connection and try again.",
  "auth/user-disabled": "This account has been disabled. Contact your tutor.",
  "auth/missing-password": "Enter your password.",
  "auth/operation-not-allowed": "Email and password sign-in is not enabled for this Firebase project.",
};

export function toAuthMessage(error: unknown): string {
  const code = extractCode(error);
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (error instanceof Error && error.message.startsWith("Firebase is not configured")) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function extractCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  if (error instanceof Error) {
    const match = error.message.match(/auth\/[a-z-]+/);
    return match ? match[0] : null;
  }
  return null;
}
