import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthService } from "../../services/auth/AuthService";
import { fakeAuthService } from "../../test/harness";
import { AuthProvider } from "../../state/AuthProvider";
import { RegisterPage } from "./RegisterPage";

let auth: AuthService;
const user = userEvent.setup();

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider service={auth}>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    auth = fakeAuthService(null);
  });

  it("requires a strong enough password before registering", async () => {
    renderRegister();
    await user.type(screen.getByLabelText(/full name/i), "Alex Morgan");
    await user.type(screen.getByLabelText(/email address/i), "alex@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/use at least eight characters/i)).toBeVisible();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("registers a new student and explains a duplicate email", async () => {
    vi.mocked(auth.register).mockRejectedValueOnce(
      Object.assign(new Error("duplicate"), { code: "auth/email-already-in-use" }),
    );
    renderRegister();

    await user.type(screen.getByLabelText(/full name/i), "Alex Morgan");
    await user.type(screen.getByLabelText(/email address/i), "alex@example.com");
    await user.type(screen.getByLabelText(/password/i), "Study1234");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(auth.register).toHaveBeenCalledWith("Alex Morgan", "alex@example.com", "Study1234");
    expect(await screen.findByRole("alert")).toHaveTextContent(/account already exists/i);
  });
});
