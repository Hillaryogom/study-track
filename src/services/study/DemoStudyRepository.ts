import type {
  GoalInput,
  SessionInput,
  StudyGoal,
  StudySession,
  Subject,
  SubjectInput,
} from "../../types/domain";
import {
  assertGoalInput,
  assertOwner,
  assertSessionInput,
  assertSubjectInput,
  RepositoryError,
  type StudyRepository,
} from "./StudyRepository";

type Collection = "subjects" | "studySessions" | "goals";

const STORAGE_KEY = "studytrack.demo.data";

interface DemoData {
  subjects: Subject[];
  studySessions: StudySession[];
  goals: StudyGoal[];
}

const EMPTY: DemoData = { subjects: [], studySessions: [], goals: [] };

/**
 * Browser-local repository used for offline review and browser tests. Records are
 * kept in one JSON document and filtered by `ownerId` on every read, which keeps
 * the ownership behaviour identical to the Firestore adapter.
 */
export class DemoStudyRepository implements StudyRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  async listSubjects(ownerId: string): Promise<Subject[]> {
    return this.owned("subjects", ownerId).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createSubject(ownerId: string, input: SubjectInput): Promise<Subject> {
    assertOwner(ownerId);
    assertSubjectInput(input);
    const now = new Date().toISOString();
    const subject: Subject = {
      id: generateId("subject"),
      ownerId,
      name: input.name.trim(),
      colour: input.colour,
      targetHours: input.targetHours ?? null,
      description: input.description.trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.mutate((data) => ({ ...data, subjects: [...data.subjects, subject] }));
    return subject;
  }

  async updateSubject(ownerId: string, id: string, changes: Partial<SubjectInput>): Promise<Subject> {
    assertOwner(ownerId);
    assertSubjectInput(changes);
    return this.replace<Subject>("subjects", ownerId, id, (subject) => ({
      ...subject,
      ...changes,
      name: changes.name?.trim() ?? subject.name,
      description: changes.description?.trim() ?? subject.description,
      updatedAt: new Date().toISOString(),
    }));
  }

  async deleteSubject(ownerId: string, id: string): Promise<void> {
    assertOwner(ownerId);
    this.mutate((data) => ({
      subjects: data.subjects.filter((subject) => !(subject.ownerId === ownerId && subject.id === id)),
      // Dependent records are removed together so no orphaned history remains.
      studySessions: data.studySessions.filter(
        (session) => !(session.ownerId === ownerId && session.subjectId === id),
      ),
      goals: data.goals.filter((goal) => !(goal.ownerId === ownerId && goal.subjectId === id)),
    }));
  }

  async listSessions(ownerId: string): Promise<StudySession[]> {
    return this.owned("studySessions", ownerId).sort((a, b) =>
      a.studyDate === b.studyDate ? b.createdAt.localeCompare(a.createdAt) : b.studyDate.localeCompare(a.studyDate),
    );
  }

  async createSession(ownerId: string, input: SessionInput): Promise<StudySession> {
    assertOwner(ownerId);
    assertSessionInput(input);
    this.requireSubject(ownerId, input.subjectId);
    const now = new Date().toISOString();
    const session: StudySession = {
      id: generateId("session"),
      ownerId,
      subjectId: input.subjectId,
      studyDate: input.studyDate,
      durationMinutes: input.durationMinutes,
      notes: input.notes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.mutate((data) => ({ ...data, studySessions: [...data.studySessions, session] }));
    return session;
  }

  async updateSession(ownerId: string, id: string, changes: Partial<SessionInput>): Promise<StudySession> {
    assertOwner(ownerId);
    assertSessionInput(changes);
    if (changes.subjectId) this.requireSubject(ownerId, changes.subjectId);
    return this.replace<StudySession>("studySessions", ownerId, id, (session) => ({
      ...session,
      ...changes,
      notes: changes.notes?.trim() ?? session.notes,
      updatedAt: new Date().toISOString(),
    }));
  }

  async deleteSession(ownerId: string, id: string): Promise<void> {
    assertOwner(ownerId);
    this.mutate((data) => ({
      ...data,
      studySessions: data.studySessions.filter(
        (session) => !(session.ownerId === ownerId && session.id === id),
      ),
    }));
  }

  async listGoals(ownerId: string): Promise<StudyGoal[]> {
    return this.owned("goals", ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createGoal(ownerId: string, input: GoalInput): Promise<StudyGoal> {
    assertOwner(ownerId);
    assertGoalInput(input);
    if (input.subjectId) this.requireSubject(ownerId, input.subjectId);
    const now = new Date().toISOString();
    const goal: StudyGoal = {
      id: generateId("goal"),
      ownerId,
      subjectId: input.subjectId,
      title: input.title.trim(),
      period: input.period,
      targetMinutes: input.targetMinutes,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now,
      updatedAt: now,
    };
    this.mutate((data) => ({ ...data, goals: [...data.goals, goal] }));
    return goal;
  }

  async updateGoal(ownerId: string, id: string, changes: Partial<GoalInput>): Promise<StudyGoal> {
    assertOwner(ownerId);
    assertGoalInput(changes);
    return this.replace<StudyGoal>("goals", ownerId, id, (goal) => ({
      ...goal,
      ...changes,
      title: changes.title?.trim() ?? goal.title,
      updatedAt: new Date().toISOString(),
    }));
  }

  async deleteGoal(ownerId: string, id: string): Promise<void> {
    assertOwner(ownerId);
    this.mutate((data) => ({
      ...data,
      goals: data.goals.filter((goal) => !(goal.ownerId === ownerId && goal.id === id)),
    }));
  }

  /** Test and demo-seed helper. Replaces the whole store in one write. */
  seed(data: Partial<DemoData>): void {
    this.write({ ...EMPTY, ...this.read(), ...data });
  }

  clear(): void {
    this.storage.removeItem(STORAGE_KEY);
  }

  private requireSubject(ownerId: string, subjectId: string): void {
    const exists = this.read().subjects.some(
      (subject) => subject.ownerId === ownerId && subject.id === subjectId,
    );
    if (!exists) throw new RepositoryError("That subject no longer exists. Refresh and try again.");
  }

  private owned<K extends Collection>(collection: K, ownerId: string): DemoData[K] {
    assertOwner(ownerId);
    return this.read()[collection].filter((record) => record.ownerId === ownerId) as DemoData[K];
  }

  private replace<T extends { id: string; ownerId: string }>(
    collection: Collection,
    ownerId: string,
    id: string,
    apply: (record: T) => T,
  ): T {
    const data = this.read();
    const records = data[collection] as unknown as T[];
    const existing = records.find((record) => record.id === id && record.ownerId === ownerId);
    if (!existing) throw new RepositoryError("That record no longer exists. Refresh and try again.");
    const updated = apply(existing);
    this.write({
      ...data,
      [collection]: records.map((record) => (record.id === id ? updated : record)),
    } as DemoData);
    return updated;
  }

  private mutate(apply: (data: DemoData) => DemoData): void {
    this.write(apply(this.read()));
  }

  private read(): DemoData {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return raw ? { ...EMPTY, ...(JSON.parse(raw) as DemoData) } : { ...EMPTY };
    } catch {
      return { ...EMPTY };
    }
  }

  private write(data: DemoData): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function generateId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}
