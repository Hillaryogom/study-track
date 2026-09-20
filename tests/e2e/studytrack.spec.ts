import { expect, test, type Page } from "@playwright/test";

/** Each test registers its own account so runs never collide in demo storage. */
function uniqueEmail(): string {
  return `alex-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
}

async function registerStudent(page: Page): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Alex Morgan");
  await page.getByLabel("Email address").fill(uniqueEmail());
  await page.getByLabel("Password", { exact: true }).fill("Study1234");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: /welcome back, alex/i })).toBeVisible();
}

async function openNavigation(page: Page): Promise<void> {
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) await menu.click();
}

async function goTo(page: Page, label: string): Promise<void> {
  await openNavigation(page);
  await page.getByRole("link", { name: label, exact: true }).click();
}

test("student creates a subject, logs study, and sees dashboard progress", async ({ page }) => {
  await registerStudent(page);

  await goTo(page, "Subjects");
  await page.getByRole("button", { name: /add your first subject/i }).click();
  await page.getByLabel("Subject name").fill("Artificial Intelligence");
  await page.getByLabel("Target study hours").fill("40");
  await page.getByLabel("Description").fill("Core AI concepts and machine learning");
  await page.getByRole("button", { name: "Save subject" }).click();

  await expect(page.getByText("Artificial Intelligence")).toBeVisible();
  await expect(page.getByText("0 / 40 hours")).toBeVisible();

  await goTo(page, "Study Sessions");
  await page.getByRole("button", { name: "Log session" }).click();
  await page.getByLabel("Hours").fill("2");
  await page.getByLabel("Minutes").fill("0");
  await page.getByLabel("Notes").fill("Study neural networks and practice questions");
  await page.getByRole("button", { name: "Save session" }).click();

  await expect(page.getByText("Study session added")).toBeVisible();
  await expect(page.getByRole("list").getByText("Artificial Intelligence")).toBeVisible();

  await goTo(page, "Goals");
  await page.getByRole("button", { name: /add your first goal/i }).click();
  await page.getByLabel("Goal title").fill("Weekly focus");
  await page.getByLabel("Period").selectOption("weekly");
  await page.getByLabel("Target hours").fill("5");
  await page.getByRole("button", { name: "Save goal" }).click();

  await expect(page.getByText("2h of 5h")).toBeVisible();
  await expect(page.getByText("3h to go")).toBeVisible();

  await goTo(page, "Dashboard");
  await expect(page.getByText("2h", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("1 day")).toBeVisible();

  await goTo(page, "Progress");
  await expect(page.getByText("Average session")).toBeVisible();
  await expect(page.getByText("Most studied subject")).toBeVisible();
});

test("protected routes require a session and sign-out returns to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /sign in to studytrack/i })).toBeVisible();

  await registerStudent(page);
  await openNavigation(page);
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page.getByRole("heading", { name: /sign in to studytrack/i })).toBeVisible();
});

test("sign-in rejects an unknown account with a clear message", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("nobody@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Wrong12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText("email or password is incorrect");
});
