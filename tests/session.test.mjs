import test from "node:test";
import assert from "node:assert/strict";
import { Session } from "../js/session.js";
import { STAGES, summarizeStage } from "../js/logic.js";

function tutorial() {
  const stage = {
    ...STAGES[0],
    fakeMin: 0,
    fakeMax: 0,
    waitMin: 500,
    waitMax: 500,
    lateMs: 580,
    catCount: 1,
  };
  const session = new Session({ rules: stage, scene: "sofa", heroId: "cheez", mode: "stage" });
  session.start(0);
  session.update(910);
  return session;
}

test("a 180ms tap on the real jump is a legendary photo", () => {
  const session = tutorial();
  assert.equal(session.phase, "air");
  assert.equal(session.jumpAt, 910);
  session.tap(910 + 180);
  assert.equal(session.shots[0].tier, "legendary");
  assert.equal(session.shots[0].ms, 180);
  assert.equal(session.photo.tier, "legendary");
});

test("tapping while the cat is still waiting is an early miss", () => {
  const session = new Session({
    rules: { ...STAGES[0], fakeMin: 0, fakeMax: 0, waitMin: 500, waitMax: 500, lateMs: 580, catCount: 1 },
    scene: "sofa",
    heroId: "cheez",
    mode: "stage",
  });
  session.start(0);
  session.update(400);
  assert.equal(session.phase, "wait");
  session.tap(400);
  assert.equal(session.shots[0].tier, "early");
  assert.equal(session.shots[0].success, false);
});

test("missing the landing window is late and five shots can clear", () => {
  const session = tutorial();
  session.update(910 + 580);
  assert.equal(session.shots[0].tier, "late");
  const shots = [
    { success: true, scoreMs: 210, ms: 210 },
    { success: true, scoreMs: 230, ms: 230 },
    { success: true, scoreMs: 240, ms: 240 },
    { success: false, scoreMs: 900, ms: null },
    { success: false, scoreMs: 720, ms: 600 },
  ];
  const summary = summarizeStage(shots);
  assert.equal(summary.cleared, true);
  assert.equal(summary.stars >= 1, true);
});
