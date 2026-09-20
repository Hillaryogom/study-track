import type {
  DailyStudyPoint,
  GoalProgress,
  ProductivitySummary,
  StudyGoal,
  StudySession,
  Subject,
  WeeklyStudyPoint,
} from "../types/domain";
import {
  addDays,
  endOfWeek,
  formatDayLabel,
  formatDateRange,
  formatLongDate,
  isWithinRange,
  lastNDays,
  startOfWeek,
  todayIso,
} from "./dates";

export function calculateTotalMinutes(sessions: StudySession[]): number {
  return sessions.reduce((total, session) => total + session.durationMinutes, 0);
}

export function sessionsForSubject(subjectId: string, sessions: StudySession[]): StudySession[] {
  return sessions.filter((session) => session.subjectId === subjectId);
}

export function calculateSubjectMinutes(subjectId: string, sessions: StudySession[]): number {
  return calculateTotalMinutes(sessionsForSubject(subjectId, sessions));
}

/** Percentage of a subject's target hours already studied, capped at 100. */
export function calculateSubjectProgress(subject: Subject, sessions: StudySession[]): number {
  if (!subject.targetHours || subject.targetHours <= 0) return 0;
  const studied = calculateSubjectMinutes(subject.id, sessions);
  return clampPercentage((studied / (subject.targetHours * 60)) * 100);
}

/** A session counts towards a goal when it falls inside the goal window and,
 *  for subject-specific goals, belongs to that subject. */
export function sessionsForGoal(goal: StudyGoal, sessions: StudySession[]): StudySession[] {
  return sessions.filter((session) => {
    const inPeriod = isWithinRange(session.studyDate, goal.startDate, goal.endDate);
    const matchesSubject = goal.subjectId === null || goal.subjectId === session.subjectId;
    return inPeriod && matchesSubject;
  });
}

export function calculateGoalProgress(goal: StudyGoal, sessions: StudySession[]): GoalProgress {
  const completedMinutes = calculateTotalMinutes(sessionsForGoal(goal, sessions));
  const percentage = goal.targetMinutes > 0 ? clampPercentage((completedMinutes / goal.targetMinutes) * 100) : 0;
  return {
    completedMinutes,
    targetMinutes: goal.targetMinutes,
    remainingMinutes: Math.max(0, goal.targetMinutes - completedMinutes),
    percentage,
    achieved: completedMinutes >= goal.targetMinutes && goal.targetMinutes > 0,
  };
}

/**
 * Consecutive study days counted backwards from the reference date. Today not
 * being logged yet does not break a streak, so counting starts at yesterday when
 * the reference date has no session.
 */
export function calculateStudyStreak(sessions: StudySession[], reference: string = todayIso()): number {
  const studied = new Set(sessions.map((session) => session.studyDate));
  if (studied.size === 0) return 0;

  let cursor = studied.has(reference) ? reference : addDays(reference, -1);
  let streak = 0;
  while (studied.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function buildDailySeries(
  sessions: StudySession[],
  reference: string = todayIso(),
  days = 7,
): DailyStudyPoint[] {
  const totals = groupMinutesByDate(sessions);
  return lastNDays(days, reference).map((date) => ({
    date,
    label: formatDayLabel(date),
    minutes: totals.get(date) ?? 0,
  }));
}

export function buildWeeklySeries(
  sessions: StudySession[],
  reference: string = todayIso(),
  weeks = 4,
): WeeklyStudyPoint[] {
  const currentWeekStart = startOfWeek(reference);
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(currentWeekStart, (index - (weeks - 1)) * 7);
    const end = endOfWeek(start);
    const minutes = calculateTotalMinutes(
      sessions.filter((session) => isWithinRange(session.studyDate, start, end)),
    );
    return { startDate: start, endDate: end, label: formatDateRange(start, end), minutes };
  });
}

export function minutesThisWeek(sessions: StudySession[], reference: string = todayIso()): number {
  const start = startOfWeek(reference);
  const end = endOfWeek(reference);
  return calculateTotalMinutes(
    sessions.filter((session) => isWithinRange(session.studyDate, start, end)),
  );
}

export function buildSubjectDistribution(
  subjects: Subject[],
  sessions: StudySession[],
): Array<{ subject: Subject; minutes: number; share: number }> {
  const total = calculateTotalMinutes(sessions);
  return subjects
    .map((subject) => {
      const minutes = calculateSubjectMinutes(subject.id, sessions);
      return { subject, minutes, share: total > 0 ? Math.round((minutes / total) * 100) : 0 };
    })
    .sort((a, b) => b.minutes - a.minutes);
}

export function buildProductivitySummary(
  sessions: StudySession[],
  subjects: Subject[] = [],
): ProductivitySummary {
  const totalMinutes = calculateTotalMinutes(sessions);
  const sessionCount = sessions.length;
  const byDate = groupMinutesByDate(sessions);
  const activeDays = byDate.size;

  const strongestDay = [...byDate.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const mostStudiedSubjectId = rankSubjects(sessions)[0] ?? null;
  const averageSessionMinutes = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;

  return {
    totalMinutes,
    sessionCount,
    averageSessionMinutes,
    mostStudiedSubjectId,
    activeDays,
    strongestDay,
    insight: buildInsight({
      sessionCount,
      activeDays,
      averageSessionMinutes,
      strongestDay,
      mostStudiedSubjectId,
      subjects,
    }),
  };
}

function buildInsight(input: {
  sessionCount: number;
  activeDays: number;
  averageSessionMinutes: number;
  strongestDay: string | null;
  mostStudiedSubjectId: string | null;
  subjects: Subject[];
}): string {
  if (input.sessionCount === 0) {
    return "Log your first study session to start building a picture of your habits.";
  }

  const subjectName = input.subjects.find((subject) => subject.id === input.mostStudiedSubjectId)?.name;
  const parts: string[] = [];

  parts.push(
    `You have studied on ${input.activeDays} ${input.activeDays === 1 ? "day" : "days"}, averaging ${input.averageSessionMinutes} minutes per session.`,
  );
  if (input.strongestDay) {
    parts.push(`Your strongest day so far is ${formatLongDate(input.strongestDay)}.`);
  }
  if (subjectName) {
    parts.push(`${subjectName} is taking the largest share of your time.`);
  }
  if (input.averageSessionMinutes < 25) {
    parts.push("Try extending sessions towards 25 minutes to get deeper focus.");
  }

  return parts.join(" ");
}

function rankSubjects(sessions: StudySession[]): string[] {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    totals.set(session.subjectId, (totals.get(session.subjectId) ?? 0) + session.durationMinutes);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([subjectId]) => subjectId);
}

function groupMinutesByDate(sessions: StudySession[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    totals.set(session.studyDate, (totals.get(session.studyDate) ?? 0) + session.durationMinutes);
  }
  return totals;
}

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
