import { describe, expect, it } from "vitest";
import { goal, session, subject } from "../test/factories";
import type { StudySession } from "../types/domain";
import {
  buildDailySeries,
  buildProductivitySummary,
  buildWeeklySeries,
  calculateGoalProgress,
  calculateStudyStreak,
  calculateSubjectProgress,
  calculateTotalMinutes,
  minutesThisWeek,
} from "./analytics";
import { formatDuration } from "./dates";

const sessions: StudySession[] = [
  session({ id: "s1", studyDate: "2026-09-17", durationMinutes: 60 }),
  session({ id: "s2", studyDate: "2026-09-18", durationMinutes: 90 }),
];

describe("study analytics", () => {
  it("calculates total minutes and consecutive study days", () => {
    expect(calculateTotalMinutes(sessions)).toBe(150);
    expect(calculateStudyStreak(sessions, "2026-09-18")).toBe(2);
  });

  it("keeps a streak alive when today has no session yet", () => {
    expect(calculateStudyStreak(sessions, "2026-09-19")).toBe(2);
    expect(calculateStudyStreak(sessions, "2026-09-21")).toBe(0);
    expect(calculateStudyStreak([], "2026-09-18")).toBe(0);
  });

  it("caps subject and goal progress at 100 percent", () => {
    expect(calculateSubjectProgress(subject({ targetHours: 2 }), sessions)).toBe(100);
    expect(calculateGoalProgress(goal({ targetMinutes: 120 }), sessions).percentage).toBe(100);
  });

  it("reports partial goal progress with remaining time", () => {
    const progress = calculateGoalProgress(goal({ targetMinutes: 300 }), sessions);
    expect(progress.completedMinutes).toBe(150);
    expect(progress.percentage).toBe(50);
    expect(progress.remainingMinutes).toBe(150);
    expect(progress.achieved).toBe(false);
  });

  it("only counts sessions inside the goal period and subject", () => {
    const scoped = goal({ subjectId: "subject-2", targetMinutes: 60 });
    expect(calculateGoalProgress(scoped, sessions).completedMinutes).toBe(0);

    const pastWeek = goal({ startDate: "2026-09-07", endDate: "2026-09-13", targetMinutes: 60 });
    expect(calculateGoalProgress(pastWeek, sessions).completedMinutes).toBe(0);
  });

  it("ignores subjects without a target when measuring progress", () => {
    expect(calculateSubjectProgress(subject({ targetHours: null }), sessions)).toBe(0);
  });

  it("builds a seven point daily series ending on the reference date", () => {
    const series = buildDailySeries(sessions, "2026-09-18");
    expect(series).toHaveLength(7);
    expect(series.at(0)?.date).toBe("2026-09-12");
    expect(series.at(-1)).toMatchObject({ date: "2026-09-18", minutes: 90 });
    expect(series.at(-2)?.minutes).toBe(60);
  });

  it("builds four weekly totals and the current week total", () => {
    const weeks = buildWeeklySeries(sessions, "2026-09-18");
    expect(weeks).toHaveLength(4);
    expect(weeks.at(-1)?.minutes).toBe(150);
    expect(minutesThisWeek(sessions, "2026-09-18")).toBe(150);
  });

  it("summarises productivity with an evidence based insight", () => {
    const summary = buildProductivitySummary(sessions, [subject({ name: "Database Systems" })]);
    expect(summary.totalMinutes).toBe(150);
    expect(summary.averageSessionMinutes).toBe(75);
    expect(summary.activeDays).toBe(2);
    expect(summary.mostStudiedSubjectId).toBe("subject-1");
    expect(summary.strongestDay).toBe("2026-09-18");
    expect(summary.insight).toContain("Database Systems");
  });

  it("invites a first session when nothing is logged", () => {
    expect(buildProductivitySummary([], []).insight).toMatch(/first study session/i);
  });

  it("formats durations for cards and charts", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(0)).toBe("0m");
  });
});
