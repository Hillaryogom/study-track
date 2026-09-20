import { beforeEach, describe, expect, it } from "vitest";
import { goalInput, sessionInput, subjectInput } from "../../test/factories";
import { DemoStudyRepository } from "./DemoStudyRepository";
import { RepositoryError } from "./StudyRepository";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  } as Storage;
}

describe("DemoStudyRepository", () => {
  let repo: DemoStudyRepository;

  beforeEach(() => {
    repo = new DemoStudyRepository(memoryStorage());
  });

  it("isolates subjects by owner and preserves updates", async () => {
    const created = await repo.createSubject("user-a", subjectInput({ name: "Databases" }));
    await repo.updateSubject("user-a", created.id, { name: "Advanced Databases" });

    expect(await repo.listSubjects("user-b")).toEqual([]);
    expect(await repo.listSubjects("user-a")).toMatchObject([{ name: "Advanced Databases" }]);
  });

  it("deleting a subject removes its sessions and goals", async () => {
    const subject = await repo.createSubject("demo-user", subjectInput());
    await repo.createSession("demo-user", sessionInput({ subjectId: subject.id }));
    await repo.createGoal("demo-user", goalInput({ subjectId: subject.id }));

    await repo.deleteSubject("demo-user", subject.id);

    expect(await repo.listSubjects("demo-user")).toEqual([]);
    expect(await repo.listSessions("demo-user")).toEqual([]);
    expect(await repo.listGoals("demo-user")).toEqual([]);
  });

  it("keeps all-subject goals when one subject is deleted", async () => {
    const subject = await repo.createSubject("demo-user", subjectInput());
    await repo.createGoal("demo-user", goalInput({ subjectId: null }));

    await repo.deleteSubject("demo-user", subject.id);

    expect(await repo.listGoals("demo-user")).toHaveLength(1);
  });

  it("refuses another owner's record and invalid domain values", async () => {
    const subject = await repo.createSubject("user-a", subjectInput());

    await expect(repo.updateSubject("user-b", subject.id, { name: "Stolen" })).rejects.toBeInstanceOf(
      RepositoryError,
    );
    await expect(repo.createSubject("user-a", subjectInput({ name: "A" }))).rejects.toThrow(/2 and 60/);
    await expect(
      repo.createSession("user-a", sessionInput({ subjectId: subject.id, durationMinutes: 0 })),
    ).rejects.toThrow(/1 minute and 24 hours/);
    await expect(
      repo.createSession("user-a", sessionInput({ subjectId: "missing", durationMinutes: 30 })),
    ).rejects.toThrow(/no longer exists/);
  });

  it("returns newest sessions first", async () => {
    const subject = await repo.createSubject("demo-user", subjectInput());
    await repo.createSession("demo-user", sessionInput({ subjectId: subject.id, studyDate: "2026-09-10" }));
    await repo.createSession("demo-user", sessionInput({ subjectId: subject.id, studyDate: "2026-09-16" }));

    const sessions = await repo.listSessions("demo-user");
    expect(sessions.map((session) => session.studyDate)).toEqual(["2026-09-16", "2026-09-10"]);
  });
});
