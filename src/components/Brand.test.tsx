import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Brand } from "./Brand";

describe("Brand", () => {
  it("renders the StudyTrack identity and accessible home link", () => {
    render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /studytrack home/i })).toHaveTextContent("StudyTrack");
  });

  it("links to the dashboard", () => {
    render(
      <MemoryRouter>
        <Brand compact />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /studytrack home/i })).toHaveAttribute("href", "/dashboard");
  });
});
