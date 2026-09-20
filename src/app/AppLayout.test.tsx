import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/ToastProvider";
import { fakeAuthService, studyDataStub } from "../test/harness";
import { AuthProvider } from "../state/AuthProvider";
import { AppLayout } from "./AppLayout";

const { useStudyDataMock } = vi.hoisted(() => ({ useStudyDataMock: vi.fn() }));

vi.mock("../state/StudyDataProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../state/StudyDataProvider")>()),
  useStudyData: useStudyDataMock,
}));

const user = userEvent.setup();

function renderLayout(initialPath = "/dashboard") {
  useStudyDataMock.mockReturnValue(studyDataStub());
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider service={fakeAuthService()}>
        <ToastProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<p>Dashboard content</p>} />
              <Route path="/subjects" element={<p>Subjects content</p>} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("AppLayout", () => {
  it("opens mobile navigation, then closes it with Escape and restores focus", async () => {
    renderLayout();
    const toggle = screen.getByRole("button", { name: /open navigation/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: /close navigation/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("navigation", { name: /main/i })).toBeVisible();

    await user.keyboard("{Escape}");
    const reopened = screen.getByRole("button", { name: /open navigation/i });
    expect(reopened).toHaveAttribute("aria-expanded", "false");
    expect(reopened).toHaveFocus();
  });

  it("marks the current destination and offers a skip link", () => {
    renderLayout("/subjects");
    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("link", { name: "Subjects" })).toHaveAttribute("aria-current", "page");
  });

  it("signs the student out from the shell", async () => {
    const service = fakeAuthService();
    useStudyDataMock.mockReturnValue(studyDataStub());
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider service={service}>
          <ToastProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<p>Dashboard content</p>} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(service.signOut).toHaveBeenCalled();
  });
});
