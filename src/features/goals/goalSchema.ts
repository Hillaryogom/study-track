import { z } from "zod";
import type { GoalInput, GoalPeriod } from "../../types/domain";
import { endOfWeek, startOfWeek, todayIso } from "../../utils/dates";

export const goalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Goal title must be at least 2 characters")
    .max(80, "Goal title must be 80 characters or fewer"),
  period: z.enum(["daily", "weekly"]),
  targetHours: z
    .string()
    .trim()
    .refine((value) => value !== "" && Number(value) >= 0.25 && Number(value) <= 168, {
      message: "Target must be between 0.25 and 168 hours",
    }),
  subjectId: z.string(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

/** Daily goals cover today; weekly goals cover the current Monday-to-Sunday week. */
export function periodRange(period: GoalPeriod, reference: string = todayIso()) {
  return period === "daily"
    ? { startDate: reference, endDate: reference }
    : { startDate: startOfWeek(reference), endDate: endOfWeek(reference) };
}

export function toGoalInput(values: GoalFormValues, reference: string = todayIso()): GoalInput {
  const { startDate, endDate } = periodRange(values.period, reference);
  return {
    title: values.title.trim(),
    period: values.period,
    targetMinutes: Math.round(Number(values.targetHours) * 60),
    subjectId: values.subjectId === "all" || values.subjectId === "" ? null : values.subjectId,
    startDate,
    endDate,
  };
}
