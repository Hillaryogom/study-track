import type { AuthService, AuthUser, Unsubscribe } from "./AuthService";

interface DemoAccount extends AuthUser {
  password: string;
}

const ACCOUNTS_KEY = "studytrack.demo.accounts";
const SESSION_KEY = "studytrack.demo.session";

/**
 * Local review adapter. It keeps a deterministic account list in this browser so
 * the interface, tests and browser smoke run can exercise every flow without a
 * Firebase project. It performs no real authentication and is never used in
 * production; `VITE_USE_DEMO_MODE` must stay `false` for deployed builds.
 */
export class DemoAuthService implements AuthService {
  private listeners = new Set<(user: AuthUser | null) => void>();

  constructor(private readonly storage: Storage = window.localStorage) {}

  subscribe(listener: (user: AuthUser | null) => void): Unsubscribe {
    this.listeners.add(listener);
    // Mirrors Firebase, which reports the restored session asynchronously.
    queueMicrotask(() => listener(this.currentUser()));
    return () => this.listeners.delete(listener);
  }

  async signIn(email: string, password: string): Promise<void> {
    const account = this.accounts().find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!account || account.password !== password) {
      throw Object.assign(new Error("Invalid credentials"), { code: "auth/invalid-credential" });
    }
    this.startSession(account);
  }

  async register(displayName: string, email: string, password: string): Promise<void> {
    const accounts = this.accounts();
    const normalised = email.trim().toLowerCase();
    if (accounts.some((account) => account.email.toLowerCase() === normalised)) {
      throw Object.assign(new Error("Email already registered"), { code: "auth/email-already-in-use" });
    }
    const account: DemoAccount = {
      uid: `demo-${normalised.replace(/[^a-z0-9]/g, "-")}`,
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    };
    this.write(ACCOUNTS_KEY, [...accounts, account]);
    this.startSession(account);
  }

  async resetPassword(email: string): Promise<void> {
    const exists = this.accounts().some(
      (account) => account.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!exists) {
      // Matches Firebase behaviour: never disclose whether an address is registered.
      return;
    }
  }

  async signOut(): Promise<void> {
    this.storage.removeItem(SESSION_KEY);
    this.emit(null);
  }

  private startSession(account: DemoAccount): void {
    const user: AuthUser = { uid: account.uid, displayName: account.displayName, email: account.email };
    this.write(SESSION_KEY, user);
    this.emit(user);
  }

  private currentUser(): AuthUser | null {
    return this.read<AuthUser | null>(SESSION_KEY, null);
  }

  private accounts(): DemoAccount[] {
    return this.read<DemoAccount[]>(ACCOUNTS_KEY, []);
  }

  private emit(user: AuthUser | null): void {
    this.listeners.forEach((listener) => listener(user));
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = this.storage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown): void {
    this.storage.setItem(key, JSON.stringify(value));
  }
}
