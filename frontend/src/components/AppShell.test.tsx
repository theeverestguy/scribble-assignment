import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import logoUrl from "../assets/scribble-logo.svg";
import logoSource from "../assets/scribble-logo.svg?raw";
import { AppShell } from "./AppShell";

describe("AppShell branding", () => {
  it("shows the bundled drawing logo beside the accessible Scribble name", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <AppShell><button>Page control</button></AppShell>
    );

    const brand = container.querySelector(".app-shell__brand");
    const logo = brand?.querySelector("img");
    expect(logo?.getAttribute("src")).toBe(logoUrl);
    expect(logo?.getAttribute("alt")).toBe("");
    expect(brand?.querySelector(".app-shell__title")?.textContent).toBe("Scribble");
    expect(container.querySelector("main button")?.textContent).toBe("Page control");
  });

  it("bundles a valid, self-contained SVG drawing mark", () => {
    const svg = new DOMParser().parseFromString(logoSource, "image/svg+xml");
    expect(svg.querySelector("parsererror")).toBeNull();
    expect(svg.documentElement.getAttribute("viewBox")).toBe("0 0 64 64");
    expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
    expect(svg.querySelector("image, use")).toBeNull();
  });
});
