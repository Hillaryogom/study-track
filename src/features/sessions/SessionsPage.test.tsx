import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../components/ToastProvider";
import { session, subject } from "../../test/factories";
import { studyDataStub } from "../../test/harness";
import type { StudyDataValue } from "../../state/StudyDataProvider";
import { todayIso } from "../../utils/dates";
import { SessionsPage } from "./SessionsPage";

const { useStudyDataMock } = vi.hoisted(() => ({ useStudyDataMock: vi.fn() }));

vi.mock("../../state/StudyDataProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../state/StudyDataProvider")>()),
  useStudyData: useStudyDataMock,
}));

const user = userEvent.setup();
let actions: StudyDataValue;

function renderSessions(overrides: Partial<StudyDataValue> = {}) {
  actions = studyDataStub(overrides);
  useStudyDataMock.mockReturnValue(actions);
  return render(
    <MemoryRouter initialEntries={["/sessions"]}>
      <ToastProvider>
        <SessionsPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("SessionsPage", () => {
  beforeEach(() => useStudyDataMock.mockReset());

  it("logs a study session using minutes and hours", async () => {
    renderSessions({ subjects: [subject({ id: "ai", name: "Artificial Intelligence" })] });

    await user.click(screen.getByRole("button", { name: /log session/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/hours/i), "1");
    await user.type(within(dialog).getByLabelText(/minutes/i), "30");
    await user.click(within(dialog).getByRole("button", { name: /save session/i }));

    expect(actions.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: "ai", durationMinutes: 90, studyDate: todayIso() }),
    );
  });

  it("requires a duration before saving", async () => {
    renderSessions({ subjects: [subject({ id: "ai", name: "Artificial Intelligence" })] });

    await user.click(screen.getByRole("button", { name: /log session/i }));
    await user.click(screen.getByRole("button", { name: /save session/i }));

    expect(await screen.findByText(/enter how long you studied/i)).toBeVisible();
    expect(actions.createSession).not.toHaveBeenCalled();
  });

  it("filters the history by subject without changing stored data", async () => {
    renderSessions({
      subjects: [
        subject({ id: "ai", name: "Artificial Intelligence" }),
        subject({ id: "db", name: "Database Systems" }),
      ],
      sessions: [
        session({ id: "s1", subjectId: "ai", durationMinutes: 90 }),
        session({ id: "s2", subjectId: "db", durationMinutes: 30 }),
      ],
    });

    expect(screen.getByText(/2 sessions/i)).toBeVisible();

    await user.selectOptions(screen.getByLabelText(/filter by subject/i), "db");

    expect(screen.getByText(/1 session ·/i)).toBeVisible();
    const history = screen.getByRole("list");
    expect(within(history).getByText("Database Systems")).toBeVisible();
    expect(within(history).queryByText("Artificial Intelligence")).not.toBeInTheDocument();
    expect(actions.updateSession).not.toHaveBeenCalled();
  });

  it("asks for confirmation before deleting a session", async () => {
    renderSessions({
      subjects: [subject({ id: "ai", name: "Artificial Intelligence" })],
      sessions: [session({ id: "s1", subjectId: "ai" })],
    });

    await user.click(screen.getByRole("button", { name: /actions for artificial intelligence session/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete session/i }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /delete session/i }));

    expect(actions.deleteSession).toHaveBeenCalledWith("s1");
  });

  it("directs the student to subjects when none exist", () => {
    renderSessions({ subjects: [] });
    expect(screen.getByText(/add a subject first/i)).toBeVisible();
  });
});
