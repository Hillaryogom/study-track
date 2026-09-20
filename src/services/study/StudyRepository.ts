import type {
  GoalInput,
  SessionInput,
  StudyGoal,
  StudySession,
  Subject,
  SubjectInput,
} from "../../types/domain";
import { isIsoDate } from "../../utils/dates";

/**
 * Every method is scoped by `ownerId`. The interface deliberately mirrors the
 * Firestore security rules: a caller can only ever reach its own records.
 */
export interface StudyRepository {
  listSubjects(ownerId: string): Promise<Subject[]>;
  createSubject(ownerId: string, input: SubjectInput): Promise<Subject>;
  updateSubject(ownerId: string, id: string, changes: Partial<SubjectInput>): Promise<Subject>;
  /** Removes the subject together with its sessions and subject-specific goals. */
  deleteSubject(ownerId: string, id: string): Promise<void>;

  listSessions(ownerId: string): Promise<StudySession[]>;
  createSession(ownerId: string, input: SessionInput): Promise<StudySession>;
  updateSession(ownerId: string, id: string, changes: Partial<SessionInput>): Promise<StudySession>;
  deleteSession(ownerId: string, id: string): Promise<void>;

  listGoals(ownerId: string): Promise<StudyGoal[]>;
  createGoal(ownerId: string, input: GoalInput): Promise<StudyGoal>;
  updateGoal(ownerId: string, id: string, changes: Partial<GoalInput>): Promise<StudyGoal>;
  deleteGoal(ownerId: string, id: string): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "RepositoryError";
  }
}

/** Domain guards repeated outside the forms so an invalid call cannot bypass validation. */
export function assertOwner(ownerId: string): void {
  if (!ownerId.trim()) throw new RepositoryError("A signed-in user is required for this operation.");
}

export function assertSubjectInput(input: Partial<SubjectInput>): void {
  if (input.name !== undefined && (input.name.trim().length < 2 || input.name.trim().length > 60)) {
    throw new RepositoryError("Subject name must be between 2 and 60 characters.");
  }
  if (input.targetHours !== undefined && input.targetHours !== null) {
    if (!Number.isFinite(input.targetHours) || input.targetHours <= 0 || input.targetHours > 1000) {
      throw new RepositoryError("Target study hours must be between 1 and 1000.");
    }
  }
  if (input.description !== undefined && input.description.length > 280) {
    throw new RepositoryError("Description must be 280 characters or fewer.");
  }
}

export function assertSessionInput(input: Partial<SessionInput>): void {
  if (input.subjectId !== undefined && !input.subjectId.trim()) {
    throw new RepositoryError("Choose the subject you studied.");
  }
  if (input.studyDate !== undefined && !isIsoDate(input.studyDate)) {
    throw new RepositoryError("Study date must be a valid calendar date.");
  }
  if (input.durationMinutes !== undefined) {
    const minutes = input.durationMinutes;
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      throw new RepositoryError("Duration must be between 1 minute and 24 hours.");
    }
  }
  if (input.notes !== undefined && input.notes.length > 500) {
    throw new RepositoryError("Notes must be 500 characters or fewer.");
  }
}

export function assertGoalInput(input: Partial<GoalInput>): void {
  if (input.title !== undefined && (input.title.trim().length < 2 || input.title.trim().length > 80)) {
    throw new RepositoryError("Goal title must be between 2 and 80 characters.");
  }
  if (input.targetMinutes !== undefined) {
    const minutes = input.targetMinutes;
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 168 * 60) {
      throw new RepositoryError("Goal target must be between 1 minute and 168 hours.");
    }
  }
  if (input.startDate !== undefined && !isIsoDate(input.startDate)) {
    throw new RepositoryError("Goal start date must be a valid calendar date.");
  }
  if (input.endDate !== undefined && !isIsoDate(input.endDate)) {
    throw new RepositoryError("Goal end date must be a valid calendar date.");
  }
  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    throw new RepositoryError("A goal cannot end before it starts.");
  }
}
