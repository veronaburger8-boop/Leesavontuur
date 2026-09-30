import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { WRITING_GUIDE } from "./writing-guide";

it("matches the writing guide in the brief's appendix", () => {
  const brief = readFileSync(join(__dirname, "../../../PROJECT-BRIEF.md"), "utf8");
  const appendix = brief.slice(brief.indexOf("## Appendix: writing guide for new passages"));
  expect(WRITING_GUIDE).toBe(appendix.split("\n").slice(1).join("\n").trim());
});
