import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthService } from "../../services/auth/AuthService";
import { fakeAuthService } from "../../test/harness";
import { AuthProvider } from "../../state/AuthProvider";
import { LoginPage } from "./LoginPage";

let auth: AuthService;
const user = userEvent.setup();

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider service={auth}>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    auth = fakeAuthService(null);
  });

  it("shows validation errors before calling the service", async () => {
    renderLogin();
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeVisible();
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it("submits valid credentials and reports an invalid password", async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new Error("auth/invalid-credential"));
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "student@example.com");
    await user.type(screen.getByLabelText(/password/i), "incorrect1");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(auth.signIn).toHaveBeenCalledWith("student@example.com", "incorrect1");
    expect(await screen.findByRole("alert")).toHaveTextContent(/email or password is incorrect/i);
  });

  it("offers routes to registration and password reset", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /forgot your password/i })).toHaveAttribute(
      "href",
      "/reset-password",
    );
  });
});
