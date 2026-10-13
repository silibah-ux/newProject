import test from "node:test";
import assert from "node:assert/strict";
import {
  STAGES,
  CHAPTERS,
  CATS,
  planShot,
  createRng,
  judge,
  summarizeStage,
  summarizeInfinite,
  jumpProgress,
  chapterUnlocked,
  infiniteUnlocked,
  catUnlocked,
  clearedChapter,
  withStageResult,
  withCodex,
  defaultSave,
  shouldShowInterstitial,
  insertBoard,
  rankOf,
  infiniteRules,
  adLoaded,
  EARLY_SCORE,
  LATE_SCORE,
  CHAPTER_STAR_GATE,
} from "../js/logic.js";

test("launch content is 4 chapters, 20 stages, 4 cats", () => {
  assert.equal(CHAPTERS.length, 4);
  assert.equal(STAGES.length, 20);
  assert.equal(CATS.length, 4);
  assert.equal(STAGES.filter((s) => s.chapter === 4 && s.catCount === 3).length >= 1, true);
  for (const stage of STAGES) {
    assert.ok(stage.lateMs > 300);
  }
});

test("a planned shot ends with a crouch then the real jump", () => {
  const rules = STAGES.find((s) => s.id === "2-5");
  const events = planShot(rules, createRng(7));
  assert.equal(events.at(-1).type, "jump");
  assert.equal(events.at(-2).type, "crouch");
  const fakes = events.filter((event) => event.type === "fake");
  assert.ok(fakes.length >= rules.fakeMin && fakes.length <= rules.fakeMax);
  assert.equal(planShot(STAGES[0], createRng(1)).filter((e) => e.type === "fake").length, 0);
});

test("reaction bands match the design", () => {
  assert.equal(judge(-1, 480).tier, "early");
  assert.equal(judge(null, 480).scoreMs, EARLY_SCORE);
  assert.equal(judge(200, 480).tier, "legendary");
  assert.equal(judge(201, 480).tier, "normal");
  assert.equal(judge(300, 480).tier, "normal");
  assert.equal(judge(301, 480).tier, "shame");
  assert.equal(judge(301, 480).success, true);
  assert.equal(judge(480, 480).success, true);
  assert.equal(judge(481, 480).tier, "late");
  assert.equal(judge(481, 480).scoreMs, LATE_SCORE);
  assert.equal(judge(69, 480).suspicious, true);
  assert.equal(judge(69, 480).success, true);
  assert.equal(judge(70, 480).suspicious, false);
});

test("jump progress is centered near a 200ms reaction", () => {
  assert.equal(jumpProgress(0, 580), 0);
  assert.equal(jumpProgress(200, 580), 0.5);
  assert.equal(jumpProgress(580, 580), 1);
  assert.ok(jumpProgress(300, 480) > 0.5);
});

test("stars come from average ms after three successes", () => {
  const fast = Array.from({ length: 5 }, () => judge(220, 480));
  assert.deepEqual(summarizeStage(fast), { success: 5, avg: 220, cleared: true, stars: 3 });
  const mixed = [judge(250, 480), judge(250, 480), judge(250, 480), judge(-1, 480), judge(900, 480)];
  const mixedSummary = summarizeStage(mixed);
  assert.equal(mixedSummary.cleared, true);
  assert.equal(mixedSummary.stars, 1);
  const fail = [judge(180, 480), judge(180, 480), judge(-1, 480), judge(-1, 480), judge(999, 480)];
  assert.equal(summarizeStage(fail).stars, 0);
  assert.equal(summarizeStage(fail).cleared, false);
});

test("chapter gates, infinite unlock, and cat rewards", () => {
  let save = defaultSave();
  assert.equal(chapterUnlocked(save, 1), true);
  assert.equal(chapterUnlocked(save, 2), false);
  assert.equal(infiniteUnlocked(save), false);
  assert.equal(catUnlocked(save, "cheez"), true);
  assert.equal(catUnlocked(save, "kong"), false);

  for (const stage of STAGES.filter((s) => s.chapter === 1)) {
    save = withStageResult(save, stage.id, { cleared: true, stars: 1, avg: 450 });
  }
  assert.equal(clearedChapter(save, 1), true);
  assert.equal(infiniteUnlocked(save), true);
  assert.equal(chapterUnlocked(save, 2), false);

  save = withStageResult(save, "1-1", { cleared: true, stars: 3, avg: 220 });
  save = withStageResult(save, "1-2", { cleared: true, stars: 3, avg: 240 });
  assert.equal(chapterUnlocked(save, 2), true);

  for (const stage of STAGES.filter((s) => s.chapter === 2)) {
    save = withStageResult(save, stage.id, { cleared: true, stars: 2, avg: 300 });
  }
  assert.equal(catUnlocked(save, "kong"), true);
  assert.equal(chapterUnlocked(save, 3), true);
  assert.ok(CHAPTER_STAR_GATE === 8);
});

test("codex keeps a tier once and board sorts by cuts then ms", () => {
  let save = withCodex(defaultSave(), "cheez", "legendary");
  save = withCodex(save, "cheez", "legendary");
  assert.deepEqual(save.codex.cheez, ["legendary"]);

  const ranked = insertBoard([], { id: "a", cuts: 10, avg: 250, at: 1 });
  const withBoth = insertBoard(ranked, { id: "b", cuts: 10, avg: 200, at: 2 });
  const full = insertBoard(withBoth, { id: "c", cuts: 12, avg: 400, at: 3 });
  assert.deepEqual(full.map((entry) => entry.id), ["c", "b", "a"]);
  assert.equal(rankOf(full, "b"), 2);
  assert.equal(full.length, 3);
});

test("interstitial every third stage and infinite pressure rises", () => {
  assert.equal(shouldShowInterstitial(1, false), false);
  assert.equal(shouldShowInterstitial(3, false), true);
  assert.equal(shouldShowInterstitial(3, true), false);
  const early = infiniteRules(0);
  const later = infiniteRules(16);
  assert.ok(later.fakeMax >= early.fakeMax);
  assert.ok(later.catCount > early.catCount);
  assert.equal(later.flicker, true);
  const shots = [judge(40, 480), judge(220, 480)];
  assert.equal(summarizeInfinite(shots).eligible, false);
  assert.equal(summarizeInfinite([judge(220, 480), judge(-1, 480)]).eligible, true);
  assert.equal(adLoaded(() => 0.01), false);
  assert.equal(adLoaded(() => 0.5), true);
});
