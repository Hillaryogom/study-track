import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../components/ToastProvider";
import { goal, session, subject } from "../../test/factories";
import { studyDataStub } from "../../test/harness";
import type { StudyDataValue } from "../../state/StudyDataProvider";
import { endOfWeek, startOfWeek, todayIso } from "../../utils/dates";
import { GoalsPage } from "./GoalsPage";

const { useStudyDataMock } = vi.hoisted(() => ({ useStudyDataMock: vi.fn() }));

vi.mock("../../state/StudyDataProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../state/StudyDataProvider")>()),
  useStudyData: useStudyDataMock,
}));

const user = userEvent.setup();
let actions: StudyDataValue;
const today = todayIso();

function renderGoals(overrides: Partial<StudyDataValue> = {}) {
  actions = studyDataStub(overrides);
  useStudyDataMock.mockReturnValue(actions);
  return render(
    <ToastProvider>
      <GoalsPage />
    </ToastProvider>,
  );
}

describe("GoalsPage", () => {
  beforeEach(() => useStudyDataMock.mockReset());

  it("creates a weekly all-subject goal and displays calculated progress", async () => {
    renderGoals({ sessions: [session({ durationMinutes: 120, studyDate: today })] });

    await user.click(screen.getByRole("button", { name: /add goal/i }));
    await user.type(screen.getByLabelText(/goal title/i), "Weekly focus");
    await user.selectOptions(screen.getByLabelText(/period/i), "weekly");
    await user.type(screen.getByLabelText(/target hours/i), "5");
    await user.click(screen.getByRole("button", { name: /save goal/i }));

    expect(actions.createGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Weekly focus",
        period: "weekly",
        targetMinutes: 300,
        subjectId: null,
        startDate: startOfWeek(today),
        endDate: endOfWeek(today),
      }),
    );
  });

  it("creates a daily goal covering only today", async () => {
    renderGoals();

    await user.click(screen.getByRole("button", { name: /add your first goal/i }));
    await user.type(screen.getByLabelText(/goal title/i), "Morning revision");
    await user.selectOptions(screen.getByLabelText(/period/i), "daily");
    await user.type(screen.getByLabelText(/target hours/i), "1.5");
    await user.click(screen.getByRole("button", { name: /save goal/i }));

    expect(actions.createGoal).toHaveBeenCalledWith(
      expect.objectContaining({ period: "daily", targetMinutes: 90, startDate: today, endDate: today }),
    );
  });

  it("shows progress and remaining time for an active goal", () => {
    renderGoals({
      goals: [goal({ targetMinutes: 300, startDate: startOfWeek(today), endDate: endOfWeek(today) })],
      sessions: [session({ durationMinutes: 120, studyDate: today })],
      subjects: [subject()],
    });

    expect(screen.getByText("2h of 5h")).toBeVisible();
    expect(screen.getByText("3h to go")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: /weekly focus progress/i })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("keeps a completed goal visible as an achievement", () => {
    renderGoals({
      goals: [goal({ targetMinutes: 60, startDate: startOfWeek(today), endDate: endOfWeek(today) })],
      sessions: [session({ durationMinutes: 90, studyDate: today })],
    });

    const achieved = screen.getByRole("region", { name: /achieved/i });
    expect(within(achieved).getByText("Weekly focus")).toBeVisible();
  });

  it("rejects a target outside the supported range", async () => {
    renderGoals();
    await user.click(screen.getByRole("button", { name: /add your first goal/i }));
    await user.type(screen.getByLabelText(/goal title/i), "Too ambitious");
    await user.type(screen.getByLabelText(/target hours/i), "400");
    await user.click(screen.getByRole("button", { name: /save goal/i }));

    expect(await screen.findByText(/between 0.25 and 168 hours/i)).toBeVisible();
    expect(actions.createGoal).not.toHaveBeenCalled();
  });
});
