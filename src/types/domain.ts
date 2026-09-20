/**
 * Shared domain models. Dates are stored as local `YYYY-MM-DD` strings so that a
 * session logged at 23:00 belongs to the day the student actually studied,
 * regardless of the browser time zone. Durations are positive whole minutes.
 */

export type GoalPeriod = "daily" | "weekly";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  ownerId: string;
  name: string;
  colour: string;
  targetHours: number | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  ownerId: string;
  subjectId: string;
  studyDate: string;
  durationMinutes: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyGoal {
  id: string;
  ownerId: string;
  subjectId: string | null;
  title: string;
  period: GoalPeriod;
  targetMinutes: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export type SubjectInput = Pick<Subject, "name" | "colour" | "targetHours" | "description">;
export type SessionInput = Pick<StudySession, "subjectId" | "studyDate" | "durationMinutes" | "notes">;
export type GoalInput = Pick<StudyGoal, "subjectId" | "title" | "period" | "targetMinutes" | "startDate" | "endDate">;

export interface GoalProgress {
  completedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  percentage: number;
  achieved: boolean;
}

export interface DailyStudyPoint {
  date: string;
  label: string;
  minutes: number;
}

export interface WeeklyStudyPoint {
  startDate: string;
  endDate: string;
  label: string;
  minutes: number;
}

export interface ProductivitySummary {
  totalMinutes: number;
  sessionCount: number;
  averageSessionMinutes: number;
  mostStudiedSubjectId: string | null;
  activeDays: number;
  strongestDay: string | null;
  insight: string;
}

export const SUBJECT_COLOURS = [
  { value: "#3157e8", label: "Blue" },
  { value: "#18a874", label: "Green" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#f6a723", label: "Amber" },
  { value: "#ef5350", label: "Red" },
  { value: "#94a3b8", label: "Slate" },
] as const;
