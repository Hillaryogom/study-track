import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toAuthMessage } from "../../services/auth/AuthService";
import { useAuth } from "../../state/AuthProvider";
import { AuthLayout } from "./AuthLayout";
import { loginSchema, type LoginValues } from "./authSchema";

interface RedirectState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const destination = (location.state as RedirectState | null)?.from?.pathname ?? "/dashboard";

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(toAuthMessage(error));
    }
  }

  return (
    <AuthLayout
      title="Sign in to StudyTrack"
      subtitle="Pick up where you left off and keep your streak going."
      footer={
        <p>
          New to StudyTrack? <Link to="/register">Create an account</Link>
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
          <label className="field__label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
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
            autoComplete="current-password"
            className="input"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? <span className="field__error">{errors.password.message}</span> : null}
          <Link className="auth__inline-link" to="/reset-password">
            Forgot your password?
          </Link>
        </div>

        <button type="submit" className="button button--primary button--full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
