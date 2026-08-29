import { describe, expect, it } from "vitest";
import { parsePullRequestUrl } from "./github";

describe("parsePullRequestUrl", () => {
  it("parses a canonical GitHub pull request URL", () => {
    expect(parsePullRequestUrl("https://github.com/openai/openai-node/pull/123")).toEqual({ owner: "openai", repo: "openai-node", number: 123, fullName: "openai/openai-node" });
  });

  it.each(["", "https://example.com/a/b/pull/1", "https://github.com/a/b/issues/1", "https://github.com/a/b/pull/nope"])("rejects invalid URL %s", (url) => {
    expect(() => parsePullRequestUrl(url)).toThrow("valid GitHub pull request URL");
  });
});
