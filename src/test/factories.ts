import type { StudyGoal, StudySession, Subject } from "../types/domain";

const TIMESTAMP = "2026-09-01T09:00:00.000Z";

export function subject(overrides: Partial<Subject> = {}): Subject {
  return {
    id: "subject-1",
    ownerId: "demo-user",
    name: "Database Systems",
    colour: "#3157e8",
    targetHours: 30,
    description: "",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

export function session(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "session-1",
    ownerId: "demo-user",
    subjectId: "subject-1",
    studyDate: "2026-09-18",
    durationMinutes: 60,
    notes: "",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

export function goal(overrides: Partial<StudyGoal> = {}): StudyGoal {
  return {
    id: "goal-1",
    ownerId: "demo-user",
    subjectId: null,
    title: "Weekly focus",
    period: "weekly",
    targetMinutes: 300,
    startDate: "2026-09-14",
    endDate: "2026-09-20",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

export function subjectInput(overrides: Partial<Subject> = {}) {
  const base = subject(overrides);
  return { name: base.name, colour: base.colour, targetHours: base.targetHours, description: base.description };
}

export function sessionInput(overrides: Partial<StudySession> = {}) {
  const base = session(overrides);
  return {
    subjectId: base.subjectId,
    studyDate: base.studyDate,
    durationMinutes: base.durationMinutes,
    notes: base.notes,
  };
}

export function goalInput(overrides: Partial<StudyGoal> = {}) {
  const base = goal(overrides);
  return {
    subjectId: base.subjectId,
    title: base.title,
    period: base.period,
    targetMinutes: base.targetMinutes,
    startDate: base.startDate,
    endDate: base.endDate,
  };
}
