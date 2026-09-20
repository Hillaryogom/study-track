import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toAuthMessage } from "../../services/auth/AuthService";
import { useAuth } from "../../state/AuthProvider";
import { AuthLayout } from "./AuthLayout";
import { resetSchema, type ResetValues } from "./authSchema";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { email: "" } });

  async function onSubmit(values: ResetValues) {
    setFormError(null);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (error) {
      setFormError(toAuthMessage(error));
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We will email a reset link to the address on your account."
      footer={
        <p>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      }
    >
      {sent ? (
        <p className="alert alert--info" role="status">
          If that address has a StudyTrack account, a reset link is on its way. Check your spam folder if it
          does not arrive within a few minutes.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError ? (
            <p className="alert" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="field">
            <label className="field__label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email ? <span className="field__error">{errors.email.message}</span> : null}
          </div>

          <button type="submit" className="button button--primary button--full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
