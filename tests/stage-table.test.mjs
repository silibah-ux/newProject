import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

test("the C# stage table matches the browser rules", () => {
  const check = spawnSync(process.execPath, ["tools/sync-stage-table.mjs", "--check"], {
    encoding: "utf8",
  });
  assert.equal(check.status, 0, check.stderr || check.stdout);
});

test("the C# rules and autoplay bot match the design", () => {
  const home = process.env.HOME || "";
  const candidates = [
    process.env.DOTNET,
    "dotnet",
    `${home}/.dotnet/dotnet`,
  ].filter(Boolean);
  let bin = "";
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (probe.status === 0) {
      bin = candidate;
      break;
    }
  }
  if (!bin) {
    console.log("dotnet is not installed; skipped the C# rule run");
    return;
  }
  const run = spawnSync(bin, ["run", "--project", "tests/rules/CatJumpShot.Rules.Tests.csproj"], {
    encoding: "utf8",
  });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout, /rules ok/);
  assert.match(run.stdout, /Share/);
});
