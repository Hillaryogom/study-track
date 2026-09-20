import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { goal, session, subject } from "../../test/factories";
import { fakeAuthService, studyDataStub } from "../../test/harness";
import { AuthProvider } from "../../state/AuthProvider";
import type { StudyDataValue } from "../../state/StudyDataProvider";
import { todayIso } from "../../utils/dates";
import { DashboardPage } from "./DashboardPage";

const { useStudyDataMock } = vi.hoisted(() => ({ useStudyDataMock: vi.fn() }));

vi.mock("../../state/StudyDataProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../state/StudyDataProvider")>()),
  useStudyData: useStudyDataMock,
}));

// jsdom has no canvas rendering context, so the chart canvas is replaced with a stub.
vi.mock("react-chartjs-2", () => ({ Bar: () => <canvas data-testid="weekly-chart" /> }));

const today = todayIso();

function renderDashboard(overrides: Partial<StudyDataValue> = {}) {
  useStudyDataMock.mockReturnValue(studyDataStub(overrides));
  return render(
    <MemoryRouter>
      <AuthProvider service={fakeAuthService()}>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => useStudyDataMock.mockReset());

  it("summarises the signed-in user's study activity", () => {
    renderDashboard({
      subjects: [subject({ name: "Programming", targetHours: 10 })],
      sessions: [session({ durationMinutes: 90, studyDate: today })],
      goals: [goal({ targetMinutes: 180, startDate: today, endDate: today })],
    });

    expect(screen.getByRole("heading", { name: /welcome back, alex/i })).toBeVisible();
    expect(screen.getAllByText("1h 30m").length).toBeGreaterThan(0);
    expect(screen.getByText("1 day")).toBeVisible();
    expect(screen.getByText(/current streak/i)).toBeVisible();
    expect(screen.getAllByText(/programming/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("weekly-chart")).toBeInTheDocument();
  });

  it("shows the seven day readout as text alongside the chart", () => {
    renderDashboard({
      subjects: [subject()],
      sessions: [session({ durationMinutes: 45, studyDate: today })],
    });

    const chartCard = screen.getByRole("region", { name: /study time this week/i });
    expect(within(chartCard).getAllByRole("listitem")).toHaveLength(7);
    expect(within(chartCard).getByText("45m")).toBeVisible();
  });

  it("onboards a student who has no subjects", () => {
    renderDashboard({ subjects: [], sessions: [] });
    expect(screen.getByText(/start by adding a subject/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /add a subject/i })).toHaveAttribute("href", "/subjects");
  });

  it("prompts for a first session once a subject exists", () => {
    renderDashboard({ subjects: [subject()], sessions: [] });
    expect(screen.getByText(/no study time logged yet/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /log your first session/i })).toHaveAttribute(
      "href",
      "/sessions?log=1",
    );
  });

  it("reports a data loading failure without breaking the page", () => {
    renderDashboard({ subjects: [subject()], error: "You do not have access to that record." });
    expect(screen.getByRole("alert")).toHaveTextContent(/do not have access/i);
  });
});
