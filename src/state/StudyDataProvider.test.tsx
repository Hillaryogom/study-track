import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sessionInput, subject } from "../test/factories";
import { fakeAuthService, mockRepository, type MockRepository } from "../test/harness";
import { AuthProvider } from "./AuthProvider";
import { StudyDataProvider, useStudyData, type StudyDataValue } from "./StudyDataProvider";

let exposed: StudyDataValue;

function Probe() {
  const value = useStudyData();
  exposed = value;
  return (
    <div>
      <p>{`${value.subjects.length} subject`}</p>
      {value.error ? <p role="alert">{value.error}</p> : null}
    </div>
  );
}

function renderStudyProvider(repository: MockRepository) {
  return render(
    <AuthProvider service={fakeAuthService()}>
      <StudyDataProvider repository={repository}>
        <Probe />
      </StudyDataProvider>
    </AuthProvider>,
  );
}

describe("StudyDataProvider", () => {
  it("loads all user-owned study data and refreshes after a mutation", async () => {
    const repo = mockRepository({ subjects: [subject()], sessions: [], goals: [] });
    renderStudyProvider(repo);

    expect(await screen.findByText("1 subject")).toBeVisible();
    expect(repo.listSubjects).toHaveBeenCalledWith("demo-user");

    await act(() => exposed.createSession(sessionInput()));

    expect(repo.createSession).toHaveBeenCalledWith("demo-user", expect.any(Object));
    expect(repo.listSessions).toHaveBeenCalledTimes(2);
  });

  it("reloads sessions and goals after a subject is deleted", async () => {
    const repo = mockRepository({ subjects: [subject()] });
    renderStudyProvider(repo);
    await screen.findByText("1 subject");

    await act(() => exposed.deleteSubject("subject-1"));

    expect(repo.deleteSubject).toHaveBeenCalledWith("demo-user", "subject-1");
    expect(repo.listSessions).toHaveBeenCalledTimes(2);
    expect(repo.listGoals).toHaveBeenCalledTimes(2);
  });

  it("reports a safe message when the initial read fails", async () => {
    const repo = mockRepository();
    repo.listSubjects.mockRejectedValue({ code: "permission-denied" });
    renderStudyProvider(repo);

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not have access/i);
  });
});
