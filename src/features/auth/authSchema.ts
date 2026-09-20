import { z } from "zod";

const email = z.string().trim().min(1, "Enter a valid email address").email("Enter a valid email address");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name").max(60, "Name must be 60 characters or fewer"),
  email,
  // Firebase requires six characters; StudyTrack asks for eight with a letter and a number.
  password: z
    .string()
    .min(8, "Use at least eight characters")
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export const resetSchema = z.object({ email });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
