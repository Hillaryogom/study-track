import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toAuthMessage } from "../../services/auth/AuthService";
import { useAuth } from "../../state/AuthProvider";
import { AuthLayout } from "./AuthLayout";
import { registerSchema, type RegisterValues } from "./authSchema";

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await createAccount(values.displayName, values.email, values.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(toAuthMessage(error));
    }
  }

  return (
    <AuthLayout
      title="Create your StudyTrack account"
      subtitle="Set up subjects, log sessions and watch your weekly hours build."
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError ? (
          <p className="alert" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="field">
          <label className="field__label" htmlFor="displayName">
            Full name
          </label>
          <input
            id="displayName"
            className="input"
            autoComplete="name"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
          />
          {errors.displayName ? <span className="field__error">{errors.displayName.message}</span> : null}
        </div>

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

        <div className="field">
          <label className="field__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <span className="field__hint">At least eight characters, including a letter and a number.</span>
          {errors.password ? <span className="field__error">{errors.password.message}</span> : null}
        </div>

        <button type="submit" className="button button--primary button--full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
