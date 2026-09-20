import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getFirestoreDb } from "../../lib/firebase";
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

const SUBJECTS = "subjects";
const SESSIONS = "studySessions";
const GOALS = "goals";

/**
 * Cloud Firestore adapter. Top-level collections carry an `ownerId`, every query
 * filters on it, and the security rules enforce the same constraint on the
 * server. Firestore timestamps are converted to ISO strings at this boundary so
 * the rest of the application only handles plain data.
 */
export class FirestoreStudyRepository implements StudyRepository {
  async listSubjects(ownerId: string): Promise<Subject[]> {
    const rows = await this.listOwned<Subject>(SUBJECTS, ownerId);
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createSubject(ownerId: string, input: SubjectInput): Promise<Subject> {
    assertOwner(ownerId);
    assertSubjectInput(input);
    return this.create<Subject>(SUBJECTS, ownerId, {
      name: input.name.trim(),
      colour: input.colour,
      targetHours: input.targetHours ?? null,
      description: input.description.trim(),
    });
  }

  async updateSubject(ownerId: string, id: string, changes: Partial<SubjectInput>): Promise<Subject> {
    assertSubjectInput(changes);
    return this.update<Subject>(SUBJECTS, ownerId, id, trim(changes, ["name", "description"]));
  }

  async deleteSubject(ownerId: string, id: string): Promise<void> {
    assertOwner(ownerId);
    const db = getFirestoreDb();
    const batch = writeBatch(db);

    const [sessions, goals] = await Promise.all([
      getDocs(query(collection(db, SESSIONS), where("ownerId", "==", ownerId), where("subjectId", "==", id))),
      getDocs(query(collection(db, GOALS), where("ownerId", "==", ownerId), where("subjectId", "==", id))),
    ]);

    sessions.forEach((row) => batch.delete(row.ref));
    goals.forEach((row) => batch.delete(row.ref));
    batch.delete(doc(db, SUBJECTS, id));
    await batch.commit();
  }

  async listSessions(ownerId: string): Promise<StudySession[]> {
    const rows = await this.listOwned<StudySession>(SESSIONS, ownerId);
    return rows.sort((a, b) =>
      a.studyDate === b.studyDate ? b.createdAt.localeCompare(a.createdAt) : b.studyDate.localeCompare(a.studyDate),
    );
  }

  async createSession(ownerId: string, input: SessionInput): Promise<StudySession> {
    assertOwner(ownerId);
    assertSessionInput(input);
    return this.create<StudySession>(SESSIONS, ownerId, {
      subjectId: input.subjectId,
      studyDate: input.studyDate,
      durationMinutes: input.durationMinutes,
      notes: input.notes.trim(),
    });
  }

  async updateSession(ownerId: string, id: string, changes: Partial<SessionInput>): Promise<StudySession> {
    assertSessionInput(changes);
    return this.update<StudySession>(SESSIONS, ownerId, id, trim(changes, ["notes"]));
  }

  async deleteSession(ownerId: string, id: string): Promise<void> {
    await this.remove(SESSIONS, ownerId, id);
  }

  async listGoals(ownerId: string): Promise<StudyGoal[]> {
    const rows = await this.listOwned<StudyGoal>(GOALS, ownerId);
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createGoal(ownerId: string, input: GoalInput): Promise<StudyGoal> {
    assertOwner(ownerId);
    assertGoalInput(input);
    return this.create<StudyGoal>(GOALS, ownerId, {
      subjectId: input.subjectId,
      title: input.title.trim(),
      period: input.period,
      targetMinutes: input.targetMinutes,
      startDate: input.startDate,
      endDate: input.endDate,
    });
  }

  async updateGoal(ownerId: string, id: string, changes: Partial<GoalInput>): Promise<StudyGoal> {
    assertGoalInput(changes);
    return this.update<StudyGoal>(GOALS, ownerId, id, trim(changes, ["title"]));
  }

  async deleteGoal(ownerId: string, id: string): Promise<void> {
    await this.remove(GOALS, ownerId, id);
  }

  private async listOwned<T>(path: string, ownerId: string): Promise<T[]> {
    assertOwner(ownerId);
    const snapshot = await getDocs(
      query(collection(getFirestoreDb(), path), where("ownerId", "==", ownerId)),
    );
    return snapshot.docs.map((row) => toRecord<T>(row));
  }

  private async create<T>(path: string, ownerId: string, fields: DocumentData): Promise<T> {
    const reference = doc(collection(getFirestoreDb(), path));
    await setDoc(reference, {
      ...fields,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return this.readOwned<T>(path, ownerId, reference.id);
  }

  private async update<T>(
    path: string,
    ownerId: string,
    id: string,
    changes: DocumentData,
  ): Promise<T> {
    assertOwner(ownerId);
    await this.readOwned<T>(path, ownerId, id);
    // `ownerId` is never part of an update, so a record cannot change hands.
    await updateDoc(doc(getFirestoreDb(), path, id), { ...changes, updatedAt: serverTimestamp() });
    return this.readOwned<T>(path, ownerId, id);
  }

  private async remove(path: string, ownerId: string, id: string): Promise<void> {
    assertOwner(ownerId);
    await this.readOwned(path, ownerId, id);
    await deleteDoc(doc(getFirestoreDb(), path, id));
  }

  private async readOwned<T>(path: string, ownerId: string, id: string): Promise<T> {
    const snapshot = await getDoc(doc(getFirestoreDb(), path, id));
    if (!snapshot.exists() || snapshot.get("ownerId") !== ownerId) {
      throw new RepositoryError("That record no longer exists. Refresh and try again.");
    }
    return toRecord<T>(snapshot as QueryDocumentSnapshot<DocumentData>);
  }
}

function toRecord<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  } as T;
}

/** A pending server timestamp reads back as null until the write is acknowledged. */
function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function trim<T extends Record<string, unknown>>(changes: T, fields: Array<keyof T>): T {
  const result: Record<string, unknown> = { ...changes };
  for (const field of fields) {
    const value = result[field as string];
    if (typeof value === "string") result[field as string] = value.trim();
  }
  return result as T;
}
