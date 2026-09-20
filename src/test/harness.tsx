import { vi } from "vitest";
import type { AuthService, AuthUser } from "../services/auth/AuthService";
import type { StudyRepository } from "../services/study/StudyRepository";
import type { StudyGoal, StudySession, Subject } from "../types/domain";

export const TEST_USER: AuthUser = {
  uid: "demo-user",
  displayName: "Alex Morgan",
  email: "alex@example.com",
};

/** Emits a signed-in user immediately so protected screens render in tests. */
export function fakeAuthService(user: AuthUser | null = TEST_USER): AuthService {
  return {
    subscribe: (listener) => {
      listener(user);
      return () => {};
    },
    signIn: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
}

export interface MockRepository extends StudyRepository {
  listSubjects: ReturnType<typeof vi.fn>;
  listSessions: ReturnType<typeof vi.fn>;
  listGoals: ReturnType<typeof vi.fn>;
  createSubject: ReturnType<typeof vi.fn>;
  updateSubject: ReturnType<typeof vi.fn>;
  deleteSubject: ReturnType<typeof vi.fn>;
  createSession: ReturnType<typeof vi.fn>;
  updateSession: ReturnType<typeof vi.fn>;
  deleteSession: ReturnType<typeof vi.fn>;
  createGoal: ReturnType<typeof vi.fn>;
  updateGoal: ReturnType<typeof vi.fn>;
  deleteGoal: ReturnType<typeof vi.fn>;
}

export function mockRepository(
  data: { subjects?: Subject[]; sessions?: StudySession[]; goals?: StudyGoal[] } = {},
): MockRepository {
  return {
    listSubjects: vi.fn().mockResolvedValue(data.subjects ?? []),
    listSessions: vi.fn().mockResolvedValue(data.sessions ?? []),
    listGoals: vi.fn().mockResolvedValue(data.goals ?? []),
    createSubject: vi.fn().mockResolvedValue(undefined),
    updateSubject: vi.fn().mockResolvedValue(undefined),
    deleteSubject: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(undefined),
    updateSession: vi.fn().mockResolvedValue(undefined),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    createGoal: vi.fn().mockResolvedValue(undefined),
    updateGoal: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
  } as unknown as MockRepository;
}

/** Baseline study-data context used by feature page tests. */
export function studyDataStub(
  overrides: Partial<import("../state/StudyDataProvider").StudyDataValue> = {},
): import("../state/StudyDataProvider").StudyDataValue {
  return {
    subjects: [],
    sessions: [],
    goals: [],
    loading: false,
    saving: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    createSubject: vi.fn().mockResolvedValue(undefined),
    updateSubject: vi.fn().mockResolvedValue(undefined),
    deleteSubject: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(undefined),
    updateSession: vi.fn().mockResolvedValue(undefined),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    createGoal: vi.fn().mockResolvedValue(undefined),
    updateGoal: vi.fn().mockResolvedValue(undefined),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
