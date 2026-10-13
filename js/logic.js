/** Rules for 고양이 점프샷. Reaction time is the only score. */

export const VIEW_W = 180;
export const VIEW_H = 270;

export const EARLY_SCORE = 900;
export const LATE_SCORE = 720;
export const LEGEND_MS = 200;
export const NORMAL_MS = 300;
export const STAR3_MS = 260;
export const STAR2_MS = 400;
export const MIN_HUMAN_MS = 70;
export const CHAPTER_STAR_GATE = 8;
export const CLEAR_SUCCESSES = 3;
export const SHOTS_PER_STAGE = 5;
export const INFINITE_FAILS = 3;
export const CROUCH_MS = 170;
export const ARM_MS = 240;

export const FAKE_MS = {
  wiggle: 460,
  tail: 400,
  crouch: 300,
  hop: 340,
};

export const CATS = [
  {
    id: "cheez",
    name: { ko: "치즈", en: "Cheez" },
    fur: "#f0a04b",
    dark: "#c56a22",
    belly: "#ffe3bc",
    eye: "#2a211c",
    nose: "#e56b7a",
    build: "tabby",
  },
  {
    id: "kong",
    name: { ko: "콩", en: "Kong" },
    fur: "#f4e2c4",
    dark: "#e0c39a",
    belly: "#fffaf2",
    eye: "#2a211c",
    nose: "#f0a0b0",
    build: "round",
  },
  {
    id: "gurum",
    name: { ko: "구름", en: "Gurum" },
    fur: "#b7c4ce",
    dark: "#879aab",
    belly: "#f5fbff",
    eye: "#243040",
    nose: "#e7a0b4",
    build: "fluff",
  },
  {
    id: "bamtol",
    name: { ko: "밤톨", en: "Bamtol" },
    fur: "#2e2c36",
    dark: "#17161c",
    belly: "#514c60",
    eye: "#f2c14e",
    nose: "#d98a9a",
    build: "slim",
  },
];

export const CAT_CHAPTER = { kong: 2, gurum: 3, bamtol: 4 };

export const CHAPTERS = [
  { id: 1, name: { ko: "거실", en: "Living room" } },
  { id: 2, name: { ko: "부엌", en: "Kitchen" } },
  { id: 3, name: { ko: "베란다", en: "Balcony" } },
  { id: 4, name: { ko: "지붕", en: "Rooftop" } },
];

const BASE = {
  1: {
    fakeMin: 1,
    fakeMax: 1,
    fakePool: ["wiggle", "tail"],
    waitMin: 800,
    waitMax: 1600,
    gapMin: 360,
    gapMax: 760,
    lateMs: 520,
    birds: false,
    laundry: false,
    flicker: false,
    catCount: 1,
    hint: false,
  },
  2: {
    fakeMin: 1,
    fakeMax: 3,
    fakePool: ["wiggle", "tail", "crouch", "hop"],
    waitMin: 480,
    waitMax: 1500,
    gapMin: 260,
    gapMax: 640,
    lateMs: 480,
    birds: false,
    laundry: false,
    flicker: false,
    catCount: 1,
    hint: false,
  },
  3: {
    fakeMin: 2,
    fakeMax: 3,
    fakePool: ["wiggle", "tail", "crouch", "hop"],
    waitMin: 360,
    waitMax: 1300,
    gapMin: 220,
    gapMax: 560,
    lateMs: 450,
    birds: true,
    laundry: false,
    flicker: false,
    catCount: 1,
    hint: false,
  },
  4: {
    fakeMin: 2,
    fakeMax: 3,
    fakePool: ["wiggle", "tail", "crouch", "hop"],
    waitMin: 320,
    waitMax: 1200,
    gapMin: 200,
    gapMax: 500,
    lateMs: 430,
    birds: false,
    laundry: false,
    flicker: true,
    catCount: 1,
    hint: false,
  },
};

function stage(chapter, index, scene, place, patch = {}) {
  return {
    id: `${chapter}-${index}`,
    chapter,
    index,
    scene,
    place,
    ...BASE[chapter],
    ...patch,
  };
}

const ko = (a, b) => ({ ko: a, en: b });

export const STAGES = [
  stage(1, 1, "sofa", ko("소파", "Sofa"), {
    fakeMin: 0,
    fakeMax: 0,
    lateMs: 580,
    waitMin: 1300,
    waitMax: 2100,
    hint: true,
  }),
  stage(1, 2, "sofa", ko("소파", "Sofa"), {
    fakeMin: 1,
    fakeMax: 1,
    fakePool: ["wiggle"],
    lateMs: 560,
  }),
  stage(1, 3, "tower", ko("캣타워", "Cat tower"), {
    fakeMin: 1,
    fakeMax: 2,
    fakePool: ["wiggle", "tail"],
  }),
  stage(1, 4, "tower", ko("캣타워", "Cat tower"), {
    fakeMin: 1,
    fakeMax: 2,
    waitMin: 500,
    waitMax: 1800,
  }),
  stage(1, 5, "tower", ko("캣타워", "Cat tower"), {
    fakeMin: 1,
    fakeMax: 2,
    fakePool: ["wiggle", "tail", "crouch"],
    lateMs: 500,
  }),
  stage(2, 1, "table", ko("식탁", "Table"), {
    fakeMin: 1,
    fakeMax: 2,
    fakePool: ["wiggle", "crouch"],
  }),
  stage(2, 2, "table", ko("식탁", "Table"), { fakeMin: 2, fakeMax: 3 }),
  stage(2, 3, "fridge", ko("냉장고", "Fridge"), {
    fakeMin: 2,
    fakeMax: 3,
    fakePool: ["crouch", "hop", "tail"],
  }),
  stage(2, 4, "fridge", ko("냉장고", "Fridge"), {
    fakeMin: 2,
    fakeMax: 3,
    waitMin: 360,
    waitMax: 1200,
  }),
  stage(2, 5, "table", ko("식탁", "Table"), { fakeMin: 2, fakeMax: 3, lateMs: 460 }),
  stage(3, 1, "rail", ko("난간", "Railing"), { birds: true, laundry: false, fakeMin: 1, fakeMax: 2 }),
  stage(3, 2, "rail", ko("난간", "Railing"), { birds: true, fakeMin: 2, fakeMax: 3 }),
  stage(3, 3, "laundry", ko("빨래", "Laundry"), { birds: false, laundry: true }),
  stage(3, 4, "laundry", ko("빨래", "Laundry"), { birds: true, laundry: true }),
  stage(3, 5, "rail", ko("난간", "Railing"), {
    birds: true,
    laundry: true,
    lateMs: 430,
    fakeMin: 2,
    fakeMax: 3,
  }),
  stage(4, 1, "roof", ko("지붕", "Roof"), { catCount: 1, flicker: true, birds: false }),
  stage(4, 2, "roof", ko("지붕", "Roof"), { catCount: 1, flicker: true, birds: true }),
  stage(4, 3, "roof", ko("지붕", "Roof"), { catCount: 2, flicker: true }),
  stage(4, 4, "roof", ko("지붕", "Roof"), { catCount: 3, flicker: true, birds: true }),
  stage(4, 5, "roof", ko("달빛", "Moonlight"), {
    catCount: 3,
    flicker: true,
    birds: true,
    fakeMin: 3,
    fakeMax: 3,
    lateMs: 410,
  }),
];

export const INFINITE_SCENES = ["sofa", "tower", "table", "fridge", "rail", "laundry", "roof"];

export function catById(id) {
  return CATS.find((cat) => cat.id === id) ?? CATS[0];
}

export function stageById(id) {
  return STAGES.find((s) => s.id === id) ?? null;
}

export function stagesIn(chapter) {
  return STAGES.filter((s) => s.chapter === chapter);
}

export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(rng, min, max) {
  return min + rng() * (max - min);
}

export function planShot(rules, rng) {
  const events = [];
  events.push({ type: "wait", ms: between(rng, rules.waitMin, rules.waitMax) });
  const span = rules.fakeMax - rules.fakeMin + 1;
  const fakeCount = rules.fakeMin + Math.floor(rng() * span);
  for (let i = 0; i < fakeCount; i += 1) {
    const kind = rules.fakePool[Math.floor(rng() * rules.fakePool.length)];
    const cat = Math.floor(rng() * Math.max(1, rules.catCount));
    events.push({ type: "fake", kind, cat, ms: FAKE_MS[kind] ?? 400 });
    events.push({ type: "wait", ms: between(rng, rules.gapMin, rules.gapMax) });
  }
  events.push({ type: "crouch", ms: CROUCH_MS });
  events.push({ type: "jump", ms: rules.lateMs });
  return events;
}

export function infiniteRules(successes) {
  const level = Math.floor(successes / 4);
  return {
    fakeMin: Math.min(3, 1 + Math.floor(level / 2)),
    fakeMax: Math.min(3, 1 + Math.min(2, level)),
    fakePool: level >= 1 ? ["wiggle", "tail", "crouch", "hop"] : ["wiggle", "tail"],
    waitMin: Math.max(280, 900 - level * 70),
    waitMax: Math.max(760, 1700 - level * 90),
    gapMin: Math.max(180, 400 - level * 30),
    gapMax: Math.max(420, 800 - level * 40),
    lateMs: Math.max(400, 520 - level * 10),
    birds: level >= 2,
    laundry: level >= 3,
    flicker: level >= 4,
    catCount: level >= 6 ? 3 : level >= 4 ? 2 : 1,
    hint: false,
  };
}

/** Horizontal progress. 0 at takeoff, 0.5 near 200ms, 1 at the late line. */
export function jumpProgress(elapsed, lateMs) {
  const split = Math.min(LEGEND_MS, lateMs * 0.45);
  if (elapsed <= 0) return 0;
  if (elapsed >= lateMs) return 1;
  if (elapsed <= split) return (elapsed / split) * 0.5;
  return 0.5 + ((elapsed - split) / (lateMs - split)) * 0.5;
}

export function jumpLift(elapsed, lateMs) {
  const split = Math.min(LEGEND_MS, lateMs * 0.45);
  if (elapsed <= 0 || elapsed >= lateMs) return 0;
  if (elapsed <= split) return Math.sin((elapsed / split) * Math.PI * 0.5);
  return Math.cos(((elapsed - split) / (lateMs - split)) * Math.PI * 0.5);
}

export function judge(ms, lateMs) {
  if (ms == null || ms < 0) {
    return { tier: "early", success: false, ms: null, scoreMs: EARLY_SCORE, suspicious: false };
  }
  if (ms > lateMs) {
    return { tier: "late", success: false, ms, scoreMs: LATE_SCORE, suspicious: false };
  }
  const tier = ms <= LEGEND_MS ? "legendary" : ms <= NORMAL_MS ? "normal" : "shame";
  return {
    tier,
    success: true,
    ms,
    scoreMs: ms,
    suspicious: ms < MIN_HUMAN_MS,
  };
}

export function summarizeStage(shots) {
  const success = shots.filter((shot) => shot.success).length;
  const avg = Math.round(shots.reduce((sum, shot) => sum + shot.scoreMs, 0) / shots.length);
  const cleared = success >= CLEAR_SUCCESSES;
  let stars = 0;
  if (cleared) {
    if (avg <= STAR3_MS) stars = 3;
    else if (avg <= STAR2_MS) stars = 2;
    else stars = 1;
  }
  return { success, avg, cleared, stars };
}

export function successAvg(shots) {
  const ok = shots.filter((shot) => shot.success);
  if (!ok.length) return null;
  return Math.round(ok.reduce((sum, shot) => sum + shot.ms, 0) / ok.length);
}

export function summarizeInfinite(shots) {
  const success = shots.filter((shot) => shot.success).length;
  const fails = shots.length - success;
  return {
    success,
    fails,
    avg: successAvg(shots),
    eligible: success > 0 && shots.every((shot) => !shot.suspicious),
  };
}

export function defaultSave() {
  return {
    v: 1,
    settings: { sound: true, vibrate: true, lang: "ko" },
    adsRemoved: false,
    purchasedCats: [],
    adUnlockedCats: [],
    selectedCat: "cheez",
    stages: {},
    codex: {},
    seenStill: {},
    infiniteBest: null,
    board: [],
    name: "",
    stagePlays: 0,
    pendingBoard: null,
  };
}

export function chapterStarCount(save, chapter) {
  return stagesIn(chapter).reduce((sum, stageItem) => sum + (save.stages[stageItem.id]?.stars || 0), 0);
}

export function clearedChapter(save, chapter) {
  return stagesIn(chapter).every((stageItem) => save.stages[stageItem.id]?.cleared);
}

export function chapterUnlocked(save, chapter) {
  if (chapter <= 1) return true;
  return chapterStarCount(save, chapter - 1) >= CHAPTER_STAR_GATE;
}

export function infiniteUnlocked(save) {
  return clearedChapter(save, 1);
}

export function catUnlocked(save, catId) {
  if (catId === "cheez") return true;
  if (save.purchasedCats.includes(catId) || save.adUnlockedCats.includes(catId)) return true;
  const chapter = CAT_CHAPTER[catId];
  return chapter ? clearedChapter(save, chapter) : false;
}

export function withStageResult(save, stageId, summary) {
  const prev = save.stages[stageId] || { stars: 0, bestAvg: null, cleared: false };
  const cleared = prev.cleared || summary.cleared;
  const stars = Math.max(prev.stars, summary.stars);
  let bestAvg = prev.bestAvg;
  if (summary.cleared) {
    bestAvg = bestAvg == null ? summary.avg : Math.min(bestAvg, summary.avg);
  }
  return {
    ...save,
    stages: {
      ...save.stages,
      [stageId]: { stars, bestAvg, cleared },
    },
  };
}

export function withCodex(save, catId, tier) {
  const prev = save.codex[catId] || [];
  if (prev.includes(tier)) return save;
  return {
    ...save,
    codex: { ...save.codex, [catId]: [...prev, tier] },
  };
}

export function insertBoard(board, entry) {
  return [...board, entry]
    .sort((a, b) => b.cuts - a.cuts || a.avg - b.avg || a.at - b.at)
    .slice(0, 20);
}

export function rankOf(board, id) {
  const sorted = [...board].sort((a, b) => b.cuts - a.cuts || a.avg - b.avg || a.at - b.at);
  const index = sorted.findIndex((entry) => entry.id === id);
  return index === -1 ? null : index + 1;
}

export function shouldShowInterstitial(plays, adsRemoved) {
  if (adsRemoved) return false;
  return plays > 0 && plays % 3 === 0;
}

export function adLoaded(rng) {
  return rng() >= 0.18;
}

export function isBetterInfinite(next, prev) {
  if (!prev) return true;
  if (next.cuts !== prev.cuts) return next.cuts > prev.cuts;
  return next.avg < prev.avg;
}
