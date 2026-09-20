import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { studyRepository as defaultRepository } from "../services/serviceFactory";
import type { StudyRepository } from "../services/study/StudyRepository";
import { RepositoryError } from "../services/study/StudyRepository";
import type {
  GoalInput,
  SessionInput,
  StudyGoal,
  StudySession,
  Subject,
  SubjectInput,
} from "../types/domain";
import { useAuth } from "./AuthProvider";

export interface StudyDataValue {
  subjects: Subject[];
  sessions: StudySession[];
  goals: StudyGoal[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createSubject: (input: SubjectInput) => Promise<void>;
  updateSubject: (id: string, changes: Partial<SubjectInput>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  createSession: (input: SessionInput) => Promise<void>;
  updateSession: (id: string, changes: Partial<SessionInput>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  createGoal: (input: GoalInput) => Promise<void>;
  updateGoal: (id: string, changes: Partial<GoalInput>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const StudyDataContext = createContext<StudyDataValue | null>(null);

interface StudyDataProviderProps {
  children: ReactNode;
  /** Injected in tests; production always uses the configured adapter. */
  repository?: StudyRepository;
}

export function StudyDataProvider({ children, repository = defaultRepository }: StudyDataProviderProps) {
  const { user } = useAuth();
  const ownerId = user?.uid ?? null;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerId) {
      setSubjects([]);
      setSessions([]);
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // The three collections are independent, so they are read together.
      const [nextSubjects, nextSessions, nextGoals] = await Promise.all([
        repository.listSubjects(ownerId),
        repository.listSessions(ownerId),
        repository.listGoals(ownerId),
      ]);
      setSubjects(nextSubjects);
      setSessions(nextSessions);
      setGoals(nextGoals);
      setError(null);
    } catch (caught) {
      setError(toSafeMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [ownerId, repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async <T,>(operation: (owner: string) => Promise<T>, reload: (owner: string) => Promise<void>) => {
      if (!ownerId) throw new RepositoryError("Sign in to make changes.");
      setSaving(true);
      try {
        await operation(ownerId);
        await reload(ownerId);
        setError(null);
      } finally {
        setSaving(false);
      }
    },
    [ownerId],
  );

  const reloadSubjects = useCallback(
    async (owner: string) => setSubjects(await repository.listSubjects(owner)),
    [repository],
  );
  const reloadSessions = useCallback(
    async (owner: string) => setSessions(await repository.listSessions(owner)),
    [repository],
  );
  const reloadGoals = useCallback(
    async (owner: string) => setGoals(await repository.listGoals(owner)),
    [repository],
  );

  const value = useMemo<StudyDataValue>(
    () => ({
      subjects,
      sessions,
      goals,
      loading,
      saving,
      error,
      refresh,
      createSubject: (input) =>
        run((owner) => repository.createSubject(owner, input), reloadSubjects),
      updateSubject: (id, changes) =>
        run((owner) => repository.updateSubject(owner, id, changes), reloadSubjects),
      // Deleting a subject cascades, so dependent collections are reloaded too.
      deleteSubject: (id) =>
        run(
          (owner) => repository.deleteSubject(owner, id),
          async (owner) => {
            await Promise.all([reloadSubjects(owner), reloadSessions(owner), reloadGoals(owner)]);
          },
        ),
      createSession: (input) =>
        run((owner) => repository.createSession(owner, input), reloadSessions),
      updateSession: (id, changes) =>
        run((owner) => repository.updateSession(owner, id, changes), reloadSessions),
      deleteSession: (id) => run((owner) => repository.deleteSession(owner, id), reloadSessions),
      createGoal: (input) => run((owner) => repository.createGoal(owner, input), reloadGoals),
      updateGoal: (id, changes) =>
        run((owner) => repository.updateGoal(owner, id, changes), reloadGoals),
      deleteGoal: (id) => run((owner) => repository.deleteGoal(owner, id), reloadGoals),
    }),
    [
      subjects,
      sessions,
      goals,
      loading,
      saving,
      error,
      refresh,
      run,
      repository,
      reloadSubjects,
      reloadSessions,
      reloadGoals,
    ],
  );

  return <StudyDataContext.Provider value={value}>{children}</StudyDataContext.Provider>;
}

export function useStudyData(): StudyDataValue {
  const context = useContext(StudyDataContext);
  if (!context) throw new Error("useStudyData must be used inside StudyDataProvider");
  return context;
}

/** Repository messages are safe to show; anything else is reported generically. */
export function toSafeMessage(error: unknown): string {
  if (error instanceof RepositoryError) return error.message;
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (code.includes("permission-denied")) return "You do not have access to that record.";
    if (code.includes("unavailable")) return "Firestore is unreachable. Check your connection and try again.";
    if (code.includes("failed-precondition")) {
      return "Firestore needs an index for this query. Deploy firestore.indexes.json and try again.";
    }
  }
  if (error instanceof Error && error.message.startsWith("Firebase is not configured")) return error.message;
  return "Something went wrong while saving. Please try again.";
}
