import { z } from "zod";
import type { SessionInput } from "../../types/domain";
import { todayIso } from "../../utils/dates";

/** Students think in hours and minutes; storage keeps a single minute total. */
export const sessionSchema = z
  .object({
    subjectId: z.string().min(1, "Choose the subject you studied"),
    studyDate: z
      .string()
      .min(1, "Choose the date you studied")
      .refine((value) => value <= todayIso(), { message: "You cannot log a session in the future" }),
    hours: z.string().trim(),
    minutes: z.string().trim(),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer"),
  })
  .superRefine((values, context) => {
    const total = totalMinutes(values.hours, values.minutes);
    if (total < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minutes"],
        message: "Enter how long you studied",
      });
    } else if (total > 1440) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hours"],
        message: "A session cannot be longer than 24 hours",
      });
    }
  });

export type SessionFormValues = z.infer<typeof sessionSchema>;

export function totalMinutes(hours: string, minutes: string): number {
  const h = hours === "" ? 0 : Number(hours);
  const m = minutes === "" ? 0 : Number(minutes);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.round(h * 60 + m);
}

export function toSessionInput(values: SessionFormValues): SessionInput {
  return {
    subjectId: values.subjectId,
    studyDate: values.studyDate,
    durationMinutes: totalMinutes(values.hours, values.minutes),
    notes: values.notes.trim(),
  };
}
