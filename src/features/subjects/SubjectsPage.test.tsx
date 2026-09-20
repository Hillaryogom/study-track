import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { session, subject } from "../../test/factories";
import { studyDataStub } from "../../test/harness";
import { ToastProvider } from "../../components/ToastProvider";
import type { StudyDataValue } from "../../state/StudyDataProvider";
import { SubjectsPage } from "./SubjectsPage";

const { useStudyDataMock } = vi.hoisted(() => ({ useStudyDataMock: vi.fn() }));

vi.mock("../../state/StudyDataProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../state/StudyDataProvider")>()),
  useStudyData: useStudyDataMock,
}));

const user = userEvent.setup();
let actions: StudyDataValue;

function renderSubjects(overrides: Partial<StudyDataValue> = {}) {
  actions = studyDataStub(overrides);
  useStudyDataMock.mockReturnValue(actions);
  return render(
    <ToastProvider>
      <SubjectsPage />
    </ToastProvider>,
  );
}

describe("SubjectsPage", () => {
  beforeEach(() => useStudyDataMock.mockReset());

  it("creates, edits, and confirms deletion of a subject", async () => {
    renderSubjects({ subjects: [subject({ name: "Database Systems" })] });

    await user.click(screen.getByRole("button", { name: /add subject/i }));
    await user.type(screen.getByLabelText(/subject name/i), "Artificial Intelligence");
    await user.type(screen.getByLabelText(/target study hours/i), "40");
    await user.click(screen.getByRole("button", { name: /save subject/i }));

    expect(actions.createSubject).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Artificial Intelligence", targetHours: 40 }),
    );

    await user.click(screen.getByRole("button", { name: /actions for database systems/i }));
    await user.click(screen.getByRole("menuitem", { name: /edit subject/i }));
    const nameField = screen.getByLabelText(/subject name/i);
    expect(nameField).toHaveValue("Database Systems");
    await user.clear(nameField);
    await user.type(nameField, "Advanced Databases");
    await user.click(screen.getByRole("button", { name: /save subject/i }));

    expect(actions.updateSubject).toHaveBeenCalledWith(
      "subject-1",
      expect.objectContaining({ name: "Advanced Databases" }),
    );

    await user.click(screen.getByRole("button", { name: /actions for database systems/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete subject/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /delete subject/i }));

    expect(actions.deleteSubject).toHaveBeenCalledWith("subject-1");
  });

  it("rejects a subject name that is too short", async () => {
    renderSubjects();
    await user.click(screen.getByRole("button", { name: /add your first subject/i }));
    await user.type(screen.getByLabelText(/subject name/i), "A");
    await user.click(screen.getByRole("button", { name: /save subject/i }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeVisible();
    expect(actions.createSubject).not.toHaveBeenCalled();
  });

  it("warns that deleting a subject removes its sessions", async () => {
    renderSubjects({
      subjects: [subject({ name: "Networking" })],
      sessions: [session({ subjectId: "subject-1" })],
    });

    await user.click(screen.getByRole("button", { name: /actions for networking/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete subject/i }));

    expect(screen.getByRole("dialog")).toHaveTextContent(/1 study session/i);
  });

  it("shows hours studied against the target", () => {
    renderSubjects({
      subjects: [subject({ name: "Networking", targetHours: 25 })],
      sessions: [session({ subjectId: "subject-1", durationMinutes: 720 })],
    });

    expect(screen.getByText("12 / 25 hours")).toBeVisible();
    expect(screen.getByText("48%")).toBeVisible();
  });
});
