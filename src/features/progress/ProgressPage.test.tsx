import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { session, subject } from "../../test/factories";
import { studyDataStub } from "../../test/harness";
import type { StudyDataValue } from "../../state/StudyDataProvider";
import { addDays, todayIso } from "../../utils/dates";
import { ProgressPage } from "./ProgressPage";

const { useStudyDataMock } = vi.hoisted(() => ({ useStudyDataMock: vi.fn() }));

vi.mock("../../state/StudyDataProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../state/StudyDataProvider")>()),
  useStudyData: useStudyDataMock,
}));

vi.mock("react-chartjs-2", () => ({ Bar: () => <canvas data-testid="daily-chart" /> }));

const today = todayIso();

const twoSubjects = [
  subject({ id: "ai", name: "Artificial Intelligence", colour: "#8b5cf6" }),
  subject({ id: "db", name: "Database Systems" }),
];

const productiveWeek = [
  session({ id: "s1", subjectId: "ai", studyDate: today, durationMinutes: 120 }),
  session({ id: "s2", subjectId: "ai", studyDate: addDays(today, -1), durationMinutes: 60 }),
  session({ id: "s3", subjectId: "db", studyDate: addDays(today, -2), durationMinutes: 60 }),
];

function renderProgress(overrides: Partial<StudyDataValue> = {}) {
  useStudyDataMock.mockReturnValue(studyDataStub(overrides));
  return render(<ProgressPage />);
}

describe("ProgressPage", () => {
  beforeEach(() => useStudyDataMock.mockReset());

  it("shows an evidence-based productivity summary", () => {
    renderProgress({ sessions: productiveWeek, subjects: twoSubjects });

    expect(screen.getByText(/average session/i)).toBeVisible();
    expect(screen.getByText(/active days/i)).toBeVisible();
    expect(screen.getByText(/most studied subject/i)).toBeVisible();
    expect(screen.getByText("1h 20m")).toBeVisible();
    const summary = screen.getByRole("region", { name: /productivity summary/i });
    expect(summary).toHaveTextContent("Artificial Intelligence");
  });

  it("compares the last four weeks and shows subject distribution", () => {
    renderProgress({ sessions: productiveWeek, subjects: twoSubjects });

    const weekly = screen.getByRole("region", { name: /four week comparison/i });
    expect(weekly.querySelectorAll("li")).toHaveLength(4);

    const distribution = screen.getByRole("region", { name: /where your time goes/i });
    expect(distribution).toHaveTextContent(/75%/);
    expect(distribution).toHaveTextContent(/25%/);
  });

  it("invites a first session when nothing has been logged", () => {
    renderProgress({ subjects: twoSubjects, sessions: [] });
    expect(screen.getByText(/nothing to report yet/i)).toBeVisible();
  });
});
