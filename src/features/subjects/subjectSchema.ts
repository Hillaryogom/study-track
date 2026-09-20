import { z } from "zod";
import type { SubjectInput } from "../../types/domain";

/**
 * Numeric fields are kept as strings in the form so that an empty optional field
 * stays empty instead of becoming NaN. Conversion happens once, on submit.
 */
export const subjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Subject name must be at least 2 characters")
    .max(60, "Subject name must be 60 characters or fewer"),
  colour: z.string().min(1, "Choose a colour"),
  targetHours: z
    .string()
    .trim()
    .refine((value) => value === "" || (Number(value) >= 1 && Number(value) <= 1000), {
      message: "Target study hours must be between 1 and 1000",
    }),
  description: z.string().trim().max(280, "Description must be 280 characters or fewer"),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;

export function toSubjectInput(values: SubjectFormValues): SubjectInput {
  return {
    name: values.name.trim(),
    colour: values.colour,
    targetHours: values.targetHours === "" ? null : Math.round(Number(values.targetHours)),
    description: values.description.trim(),
  };
}
