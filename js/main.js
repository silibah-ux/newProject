import {
  CATS,
  CHAPTER_STAR_GATE,
  CHAPTERS,
  catById,
  catUnlocked,
  chapterStarCount,
  chapterUnlocked,
  defaultSave,
  infiniteRules,
  infiniteUnlocked,
  insertBoard,
  isBetterInfinite,
  rankOf,
  shouldShowInterstitial,
  stageById,
  stagesIn,
  summarizeInfinite,
  summarizeStage,
  withCodex,
  withStageResult,
  adLoaded,
} from "./logic.js";
import { t } from "./i18n.js";
import { createAudio } from "./audio.js";
import { drawCat, drawShareCard, drawStill, drawWorld, photoView } from "./draw.js";
import { Session } from "./session.js";

const KEY = "cat-jump-shot-v01";
const audio = createAudio();
const root = document.querySelector("#root");

let save = loadSave();
let screen = "title";
let chapterId = 1;
let stageId = "1-1";
let playMode = "stage";
let session = null;
let pendingStill = null;
let lastRun = null;
let modal = null;
let adCallback = null;
let hudKey = "";

function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...JSON.parse(raw), settings: { ...defaultSave().settings, ...JSON.parse(raw).settings } };
  } catch {
    return defaultSave();
  }
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(save));
}

function lang() {
  return save.settings.lang === "en" ? "en" : "ko";
}

function tr(key, vars) {
  return t(lang(), key, vars);
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 2400);
}

function stars(n) {
  return `${"★".repeat(n)}${"☆".repeat(Math.max(0, 3 - n))}`;
}

function show(next) {
  screen = next;
  hudKey = "";
  render();
}

function render() {
  root.innerHTML = `${screenHtml()}<div id="modal-root"></div><div id="toast" class="toast hidden"></div>`;
  paintStatic();
  bind();
  renderModal();
}

function screenHtml() {
  if (screen === "title") return titleHtml();
  if (screen === "chapters") return chaptersHtml();
  if (screen === "stages") return stagesHtml();
  if (screen === "game") return gameHtml();
  if (screen === "result") return resultHtml();
  if (screen === "infiniteResult") return infiniteResultHtml();
  if (screen === "codex") return codexHtml();
  if (screen === "shop") return shopHtml();
  if (screen === "settings") return settingsHtml();
  if (screen === "ranking") return rankingHtml();
  if (screen === "still") return stillHtml();
  return titleHtml();
}

function titleHtml() {
  return `<section class="screen">
    <p class="tag">${esc(tr("tagline"))}</p>
    <h1 class="center">${esc(tr("title"))}</h1>
    <canvas class="mascot" id="mascot" width="180" height="140"></canvas>
    <div class="stack">
      <button class="btn primary" data-go="chapters">${esc(tr("start"))}</button>
      <button class="btn" id="infinite-btn">${esc(tr("infinite"))}</button>
      <div class="grid">
        <button class="btn" data-go="ranking">${esc(tr("ranking"))}</button>
        <button class="btn" data-go="codex">${esc(tr("codex"))}</button>
        <button class="btn" data-go="shop">${esc(tr("shop"))}</button>
        <button class="btn" data-go="settings">${esc(tr("settings"))}</button>
      </div>
    </div>
  </section>`;
}

function catStrip() {
  return `<div class="cats">${CATS.map((cat) => {
    const open = catUnlocked(save, cat.id);
    const selected = save.selectedCat === cat.id;
    return `<button class="cat-pick ${selected ? "selected" : ""} ${open ? "" : "locked"}" data-select="${cat.id}">
      <canvas data-face="${cat.id}" width="72" height="72"></canvas>
      <small>${esc(cat.name[lang()])}</small>
      <small>${open ? (selected ? esc(tr("selected")) : esc(tr("select"))) : esc(tr("lockedCat"))}</small>
    </button>`;
  }).join("")}</div>`;
}

function chaptersHtml() {
  return `<section class="screen">
    <header><button class="btn" data-go="title">${esc(tr("back"))}</button><h2>${esc(tr("chapters"))}</h2></header>
    ${catStrip()}
    <p class="help">${esc(tr("stageHelp"))}</p>
    <div class="stack">${CHAPTERS.map((chapter) => {
      const open = chapterUnlocked(save, chapter.id);
      const count = chapterStarCount(save, chapter.id);
      return `<button class="chapter ${open ? "" : "locked"}" data-chapter="${chapter.id}">
        <b>${chapter.id}. ${esc(chapter.name[lang()])}</b>
        <span class="stars">${esc(tr("chapterStars", { n: count, max: 15 }))}</span>
        <span class="muted">${open ? "" : esc(tr("starGate", { need: CHAPTER_STAR_GATE }))}</span>
      </button>`;
    }).join("")}</div>
  </section>`;
}

function stagesHtml() {
  const chapter = CHAPTERS.find((item) => item.id === chapterId);
  return `<section class="screen">
    <header><button class="btn" data-go="chapters">${esc(tr("back"))}</button><h2>${esc(chapter.name[lang()])}</h2></header>
    <div class="stack">${stagesIn(chapterId).map((stage) => {
      const record = save.stages[stage.id];
      return `<button class="stage" data-stage="${stage.id}">
        <b>${stage.index}. ${esc(stage.place[lang()])}</b>
        <span class="stars">${stars(record?.stars || 0)}</span>
        <span class="muted">${record?.bestAvg != null ? esc(tr("best", { ms: record.bestAvg })) : esc(tr("noBest"))}</span>
      </button>`;
    }).join("")}</div>
  </section>`;
}

function gameHtml() {
  const hint = playMode === "stage" && stageById(stageId)?.hint ? tr("hint") : tr("tapShutter");
  return `<section class="play">
    <div class="hud">
      <div id="pips"></div>
      <button class="icon" id="pause-btn" aria-label="${esc(tr("pause"))}">II</button>
    </div>
    <div class="view" id="view">
      <canvas class="world" id="world" width="180" height="270"></canvas>
      <div class="pop" id="pop"></div>
    </div>
    <p class="hint" id="hint">${esc(hint)}</p>
  </section>`;
}

function filmHtml(shots) {
  return `<div class="film">${shots.map((shot, index) => `<figure>
    <canvas data-shot="${index}" width="180" height="270"></canvas>
    <figcaption>${shot ? esc(tr(shot.tier)) : ""}</figcaption>
  </figure>`).join("")}</div>`;
}

function resultHtml() {
  const summary = lastRun.summary;
  const legend = lastRun.shots.some((shot) => shot.tier === "legendary");
  return `<section class="screen">
    <h2 class="center">${esc(summary.cleared ? tr("clear") : tr("notClear"))}</h2>
    <p class="big">${esc(stars(summary.stars))}</p>
    <p class="center">${esc(tr("avg", { ms: summary.avg }))}</p>
    ${filmHtml(lastRun.shots)}
    <div class="stack">
      <button class="btn primary" id="share">${esc(tr("share"))}</button>
      <button class="btn" id="save-legend" ${legend ? "" : "disabled"}>${esc(tr("saveLegend"))}</button>
      <div class="row">
        <button class="btn" id="retry">${esc(tr("retry"))}</button>
        <button class="btn" id="leave">${esc(tr("quit"))}</button>
      </div>
    </div>
  </section>`;
}

function infiniteResultHtml() {
  const summary = lastRun.summary;
  const rank = lastRun.entry ? rankOf(save.board, lastRun.entry.id) : null;
  const best = save.infiniteBest && save.infiniteBest.cuts === summary.success && save.infiniteBest.avg === summary.avg;
  const tail = lastRun.shots.slice(-5);
  return `<section class="screen">
    <h2 class="center">${esc(tr("infiniteResult"))}</h2>
    <p class="big">${esc(tr("cuts", { n: summary.success }))}</p>
    <p class="center">${summary.avg == null ? "" : esc(tr("avg", { ms: summary.avg }))} ${best ? `· ${esc(tr("newBest"))}` : ""}</p>
    <p class="center">${rank ? esc(tr("rankLine", { rank, total: save.board.length })) : esc(summary.eligible ? tr("rankingEmpty") : tr("unranked"))}</p>
    ${summary.eligible ? "" : `<p class="help center">${esc(tr("ineligible"))}</p>`}
    <label>${esc(tr("name"))} <input id="name" maxlength="8" type="text" value="${esc(save.name)}" placeholder="${esc(tr("namePh"))}"></label>
    ${filmHtml(tail)}
    <div class="row">
      <button class="btn primary" id="share">${esc(tr("share"))}</button>
      <button class="btn" id="retry">${esc(tr("retry"))}</button>
      <button class="btn" id="leave">${esc(tr("quit"))}</button>
    </div>
  </section>`;
}

function codexHtml() {
  const tiers = ["legendary", "normal", "shame", "early", "late"];
  return `<section class="screen">
    <header><button class="btn" data-go="title">${esc(tr("back"))}</button><h2>${esc(tr("codexTitle"))}</h2></header>
    <p class="help">${esc(tr("codexHelp"))}</p>
    <p class="muted">${esc(tr("tiers"))}</p>
    <div class="codex-list">${CATS.map((cat) => {
      const owned = save.codex[cat.id] || [];
      const open = catUnlocked(save, cat.id);
      return `<article class="codex-card">
        <b>${esc(cat.name[lang()])}</b>
        <div class="codex-shots">${tiers.map((tier) => owned.includes(tier)
          ? `<canvas data-codex="${cat.id}:${tier}" width="180" height="270"></canvas>`
          : `<div class="missing"></div>`).join("")}</div>
        <button class="btn" data-select="${cat.id}" ${open ? "" : "disabled"}>${open ? esc(tr("select")) : esc(tr("lockedCat"))}</button>
      </article>`;
    }).join("")}</div>
  </section>`;
}

function shopHtml() {
  const cats = CATS.filter((cat) => cat.id !== "cheez");
  return `<section class="screen">
    <header><button class="btn" data-go="title">${esc(tr("back"))}</button><h2>${esc(tr("shopTitle"))}</h2></header>
    <article class="chapter">
      <b>${esc(tr("shopRemove"))} · ${esc(tr("shopRemovePrice"))}</b>
      <span class="muted">${esc(tr("shopRemoveDesc"))}</span>
      <button class="btn gold" id="buy-ads" ${save.adsRemoved ? "disabled" : ""}>${esc(save.adsRemoved ? tr("owned") : tr("shopCat"))}</button>
    </article>
    ${cats.map((cat) => {
      const open = catUnlocked(save, cat.id);
      return `<article class="chapter">
        <b>${esc(cat.name[lang()])} · ${esc(tr("shopCatPrice"))}</b>
        <div class="row">
          <button class="btn" data-buy="${cat.id}" ${open ? "disabled" : ""}>${esc(open ? tr("owned") : tr("shopCat"))}</button>
          <button class="btn" data-adcat="${cat.id}" ${open ? "disabled" : ""}>${esc(tr("shopAd"))}</button>
        </div>
      </article>`;
    }).join("")}
    <button class="btn" id="restore">${esc(tr("shopRestore"))}</button>
  </section>`;
}

function settingsHtml() {
  return `<section class="screen">
    <header><button class="btn" data-go="title">${esc(tr("back"))}</button><h2>${esc(tr("settingsTitle"))}</h2></header>
    <div class="toggle chapter"><span>${esc(tr("sound"))}</span><button class="btn" id="sound">${esc(save.settings.sound ? tr("on") : tr("off"))}</button></div>
    <div class="toggle chapter"><span>${esc(tr("vibrate"))}</span><button class="btn" id="vibrate">${esc(save.settings.vibrate ? tr("on") : tr("off"))}</button></div>
    <div class="toggle chapter"><span>${esc(tr("language"))}</span><button class="btn" id="lang">${esc(lang() === "ko" ? tr("langEn") : tr("langKo"))}</button></div>
    <button class="btn" id="privacy">${esc(tr("privacy"))}</button>
    <button class="btn" id="restore">${esc(tr("shopRestore"))}</button>
  </section>`;
}

function rankingHtml() {
  const rows = [...save.board].sort((a, b) => b.cuts - a.cuts || a.avg - b.avg || a.at - b.at);
  return `<section class="screen">
    <header><button class="btn" data-go="title">${esc(tr("back"))}</button><h2>${esc(tr("rankTitle"))}</h2></header>
    <p class="help">${esc(tr("rankingNote"))}</p>
    ${rows.length ? rows.map((entry, index) => `<div class="rank ${entry.name === save.name && save.name ? "me" : ""}">
      <span>${index + 1}. ${esc(entry.name || tr("you"))}</span>
      <span>${esc(tr("cuts", { n: entry.cuts }))} · ${entry.avg}ms</span>
    </div>`).join("") : `<p class="center">${esc(tr("rankingEmpty"))}</p>`}
  </section>`;
}

function stillHtml() {
  return `<section class="screen">
    <canvas class="world" id="still" width="180" height="270"></canvas>
    <button class="btn primary" id="still-next">${esc(tr("stillGo"))}</button>
  </section>`;
}

function paintStatic() {
  document.querySelectorAll("canvas[data-face]").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawCat(ctx, canvas.dataset.face, 36, 64, "idle", 400);
  });
  document.querySelectorAll("canvas[data-shot]").forEach((canvas) => {
    const shot = shotList()[Number(canvas.dataset.shot)];
    if (shot) drawWorld(canvas.getContext("2d"), photoView(shot));
  });
  document.querySelectorAll("canvas[data-codex]").forEach((canvas) => {
    const [catId, tier] = canvas.dataset.codex.split(":");
    drawWorld(canvas.getContext("2d"), photoView(sampleShot(catId, tier)));
  });
}

function shotList() {
  if (!lastRun) return [];
  return screen === "infiniteResult" ? lastRun.shots.slice(-5) : lastRun.shots;
}

function sampleShot(catId, tier) {
  const ms = tier === "legendary" ? 160 : tier === "normal" ? 250 : tier === "shame" ? 360 : tier === "late" ? 500 : null;
  return {
    tier,
    ms,
    success: tier !== "early" && tier !== "late",
    earlyStyle: "mock",
    scene: tier === "late" ? "roof" : "sofa",
    catId,
    extras: [],
    lateMs: 480,
    birds: false,
    laundry: false,
    flicker: tier === "late",
  };
}

function bind() {
  root.querySelectorAll("[data-go]").forEach((button) => {
    button.onclick = () => show(button.dataset.go);
  });
  root.querySelectorAll("[data-chapter]").forEach((button) => {
    button.onclick = () => {
      const id = Number(button.dataset.chapter);
      if (!chapterUnlocked(save, id)) {
        const need = Math.max(0, CHAPTER_STAR_GATE - chapterStarCount(save, id - 1));
        toast(tr("needMore", { n: need }));
        return;
      }
      chapterId = id;
      show("stages");
    };
  });
  root.querySelectorAll("[data-stage]").forEach((button) => {
    button.onclick = () => startStage(button.dataset.stage);
  });
  root.querySelectorAll("[data-select]").forEach((button) => {
    button.onclick = () => selectCat(button.dataset.select);
  });
  const infinite = document.getElementById("infinite-btn");
  if (infinite) {
    infinite.onclick = () => {
      if (!infiniteUnlocked(save)) {
        toast(tr("infiniteLocked"));
        return;
      }
      startInfinite();
    };
  }
  const pause = document.getElementById("pause-btn");
  if (pause) pause.onclick = (event) => {
    event.stopPropagation();
    openPause();
  };
  const view = document.getElementById("view");
  if (view) view.addEventListener("pointerdown", onShutter);
  const share = document.getElementById("share");
  if (share) share.onclick = shareRun;
  const legend = document.getElementById("save-legend");
  if (legend) legend.onclick = () => {
    const shot = lastRun.shots.find((item) => item.tier === "legendary");
    if (shot) saveStill(shot);
    else toast(tr("noLegend"));
  };
  const retry = document.getElementById("retry");
  if (retry) retry.onclick = () => (playMode === "infinite" ? startInfinite() : startStage(stageId));
  const leave = document.getElementById("leave");
  if (leave) leave.onclick = leaveResult;
  const name = document.getElementById("name");
  if (name) name.oninput = () => rename(name.value);
  document.querySelectorAll("canvas[data-shot]").forEach((canvas) => {
    canvas.onclick = () => {
      const shot = shotList()[Number(canvas.dataset.shot)];
      if (shot) saveStill(shot);
    };
  });
  const sound = document.getElementById("sound");
  if (sound) sound.onclick = () => {
    save.settings.sound = !save.settings.sound;
    persist();
    if (save.settings.sound) {
      audio.unlock();
      audio.startBgm();
    } else audio.stopBgm();
    render();
  };
  const vibrate = document.getElementById("vibrate");
  if (vibrate) vibrate.onclick = () => {
    save.settings.vibrate = !save.settings.vibrate;
    persist();
    render();
  };
  const language = document.getElementById("lang");
  if (language) language.onclick = () => {
    save.settings.lang = lang() === "ko" ? "en" : "ko";
    persist();
    render();
  };
  const privacy = document.getElementById("privacy");
  if (privacy) privacy.onclick = () => {
    modal = { type: "privacy" };
    renderModal();
  };
  const restore = document.getElementById("restore");
  if (restore) restore.onclick = restorePurchases;
  const buyAds = document.getElementById("buy-ads");
  if (buyAds) buyAds.onclick = () => askBuy("ads");
  root.querySelectorAll("[data-buy]").forEach((button) => {
    button.onclick = () => askBuy(button.dataset.buy);
  });
  root.querySelectorAll("[data-adcat]").forEach((button) => {
    button.onclick = () => watchForCat(button.dataset.adcat);
  });
  const stillNext = document.getElementById("still-next");
  if (stillNext) stillNext.onclick = () => {
    pendingStill = null;
    show("chapters");
  };
}

function selectCat(id) {
  if (!catUnlocked(save, id)) {
    toast(tr("lockedCat"));
    return;
  }
  save.selectedCat = id;
  persist();
  if (save.settings.sound) audio.ui();
  render();
}

function startStage(id) {
  const stage = stageById(id);
  if (!stage || !chapterUnlocked(save, stage.chapter)) return;
  playMode = "stage";
  stageId = id;
  session = new Session({ rules: stage, scene: stage.scene, heroId: save.selectedCat, mode: "stage" });
  session.start(performance.now());
  modal = null;
  show("game");
}

function startInfinite() {
  playMode = "infinite";
  const rules = infiniteRules(0);
  session = new Session({ rules, scene: "sofa", heroId: save.selectedCat, mode: "infinite" });
  session.start(performance.now());
  modal = null;
  show("game");
}

function onShutter(event) {
  if (event.target.closest("button") || !session) return;
  const result = session.tap(performance.now());
  if (result === "done") finishStage();
  if (result === "revive") askRevive();
}

function onShotResolved() {
  const shot = session.shots.at(-1);
  if (!shot) return;
  save = withCodex(save, shot.catId, shot.tier);
  persist();
  if (save.settings.sound) {
    audio.shutter();
    if (shot.tier === "legendary") audio.meow();
    else if (shot.success) audio.good();
    else audio.bad();
  }
  if (save.settings.vibrate) navigator.vibrate?.(shot.success ? 16 : 36);
}

function finishStage() {
  const stage = stageById(stageId);
  const shots = session.shots.slice();
  const summary = summarizeStage(shots);
  save = withStageResult(save, stageId, summary);
  save.stagePlays += 1;
  if (stage.index === 5 && summary.cleared && !save.seenStill[stage.chapter]) {
    save.seenStill[stage.chapter] = true;
    pendingStill = stage.chapter;
  }
  persist();
  lastRun = { mode: "stage", summary, shots, stage };
  session = null;
  show("result");
  if (shouldShowInterstitial(save.stagePlays, save.adsRemoved)) {
    openAd({ rewarded: false });
  }
}

function finishInfinite() {
  const shots = session.shots.slice();
  const summary = summarizeInfinite(shots);
  const record = { cuts: summary.success, avg: summary.avg ?? 9999 };
  const best = summary.eligible && isBetterInfinite(record, save.infiniteBest);
  if (best) save.infiniteBest = record;
  lastRun = { mode: "infinite", summary, shots, entry: null };
  if (summary.eligible) submitBoard(summary);
  persist();
  session = null;
  modal = null;
  show("infiniteResult");
}

function submitBoard(summary) {
  const entry = {
    id: crypto.randomUUID(),
    name: save.name || tr("you"),
    cuts: summary.success,
    avg: summary.avg,
    at: Date.now(),
  };
  lastRun.entry = entry;
  if (navigator.onLine) {
    save.board = insertBoard(save.board, entry);
    toast(tr("uploaded"));
  } else {
    save.pendingBoard = entry;
    toast(tr("offlineSaved"));
  }
}

function rename(value) {
  save.name = value.slice(0, 8);
  if (lastRun?.entry) {
    const name = save.name || tr("you");
    save.board = save.board.map((entry) => (entry.id === lastRun.entry.id ? { ...entry, name } : entry));
    if (save.pendingBoard?.id === lastRun.entry.id) save.pendingBoard = { ...save.pendingBoard, name };
    lastRun.entry = { ...lastRun.entry, name };
  }
  persist();
}

function leaveResult() {
  if (pendingStill) show("still");
  else show(playMode === "infinite" ? "title" : "stages");
}

function askRevive() {
  modal = { type: "revive" };
  renderModal();
}

function openPause() {
  if (!session) return;
  session.pause(performance.now());
  modal = { type: "pause" };
  renderModal();
}

function askBuy(item) {
  modal = { type: "buy", item };
  renderModal();
}

function confirmBuy() {
  const item = modal?.item;
  modal = null;
  if (item === "ads") save.adsRemoved = true;
  else if (item && !save.purchasedCats.includes(item)) save.purchasedCats = [...save.purchasedCats, item];
  persist();
  render();
  toast(tr("bought"));
}

function watchForCat(catId) {
  openAd({
    rewarded: true,
    onDone: () => {
      if (!save.adUnlockedCats.includes(catId)) save.adUnlockedCats = [...save.adUnlockedCats, catId];
      persist();
      render();
      toast(tr("bought"));
    },
  });
}

function restorePurchases() {
  const owned = save.adsRemoved || save.purchasedCats.length > 0;
  toast(tr(owned ? "restored" : "nothingRestore"));
}

function openAd({ rewarded, onDone }) {
  if (!adLoaded(Math.random)) {
    toast(tr(rewarded ? "adRewardFail" : "adFail"));
    return;
  }
  modal = { type: "ad", rewarded: !!rewarded };
  adCallback = onDone || null;
  renderModal();
}

function closeAd() {
  const done = adCallback;
  adCallback = null;
  modal = null;
  renderModal();
  done?.();
}

function renderModal() {
  const host = document.getElementById("modal-root");
  if (!host) return;
  if (!modal) {
    host.innerHTML = "";
    return;
  }
  host.innerHTML = `<div class="modal"><div class="dialog">${modalBody()}</div></div>`;
  const close = document.getElementById("modal-close");
  if (close) close.onclick = () => {
    if (modal?.type === "pause") return;
    modal = null;
    renderModal();
  };
  const resume = document.getElementById("resume");
  if (resume) resume.onclick = () => {
    session?.resume(performance.now());
    modal = null;
    renderModal();
  };
  const restart = document.getElementById("restart");
  if (restart) restart.onclick = () => (playMode === "infinite" ? startInfinite() : startStage(stageId));
  const quit = document.getElementById("quit");
  if (quit) quit.onclick = () => {
    session = null;
    modal = null;
    show(playMode === "infinite" ? "title" : "stages");
  };
  const reviveYes = document.getElementById("revive-yes");
  if (reviveYes) reviveYes.onclick = () => {
    modal = null;
    renderModal();
    if (!adLoaded(Math.random)) {
      finishInfinite();
      toast(tr("adRewardFail"));
      return;
    }
    modal = { type: "ad", rewarded: true };
    adCallback = () => session?.revive(performance.now());
    renderModal();
  };
  const reviveNo = document.getElementById("revive-no");
  if (reviveNo) reviveNo.onclick = () => finishInfinite();
  const buyYes = document.getElementById("buy-yes");
  if (buyYes) buyYes.onclick = confirmBuy;
  const buyNo = document.getElementById("buy-no");
  if (buyNo) buyNo.onclick = () => {
    modal = null;
    renderModal();
  };
  const adClose = document.getElementById("ad-close");
  if (adClose) adClose.onclick = closeAd;
}

function modalBody() {
  if (modal.type === "pause") {
    return `<h2>${esc(tr("pause"))}</h2>
      <button class="btn primary" id="resume">${esc(tr("resume"))}</button>
      <button class="btn" id="restart">${esc(tr("restart"))}</button>
      <button class="btn" id="quit">${esc(tr("quit"))}</button>`;
  }
  if (modal.type === "revive") {
    return `<h2>${esc(tr("reviveTitle"))}</h2>
      <p>${esc(tr("reviveBody"))}</p>
      <button class="btn primary" id="revive-yes">${esc(tr("reviveYes"))}</button>
      <button class="btn" id="revive-no">${esc(tr("reviveNo"))}</button>`;
  }
  if (modal.type === "buy") {
    return `<h2>${esc(tr("shopTitle"))}</h2>
      <p>${esc(tr("protoBuy"))}</p>
      <div class="row">
        <button class="btn primary" id="buy-yes">${esc(tr("confirm"))}</button>
        <button class="btn" id="buy-no">${esc(tr("cancel"))}</button>
      </div>`;
  }
  if (modal.type === "privacy") {
    return `<h2>${esc(tr("privacyTitle"))}</h2>
      <p>${esc(tr("privacyBody"))}</p>
      <button class="btn primary" id="modal-close">${esc(tr("continue"))}</button>`;
  }
  return `<div class="ad"><b>${esc(tr("adLabel"))}</b><p>${esc(tr("adBody"))}</p></div>
    <button class="btn primary" id="ad-close">${esc(tr("adClose"))}</button>`;
}

function shareRun() {
  const shots = (lastRun.mode === "stage" ? lastRun.shots : lastRun.shots.slice(-5)).slice(0, 5);
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 760;
  const summary = lastRun.summary;
  const stat = lastRun.mode === "stage"
    ? tr("avg", { ms: summary.avg })
    : tr("cuts", { n: summary.success });
  drawShareCard(canvas.getContext("2d"), {
    title: tr("title"),
    stat,
    sub: catById(save.selectedCat).name[lang()],
    qr: lang() === "ko" ? "QR · 출시 예정" : "QR · coming soon",
    views: shots.map(photoView),
  });
  downloadCanvas(canvas, "cat-jump-shot.png");
}

function saveStill(shot) {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 270;
  drawWorld(canvas.getContext("2d"), photoView(shot));
  downloadCanvas(canvas, `cat-jump-${shot.tier}.png`);
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob(async (blob) => {
    if (!blob) {
      toast(tr("shareFail"));
      return;
    }
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: tr("title") });
        return;
      } catch {
        /* fall through to download */
      }
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    toast(tr("shareReady"));
  });
}

function syncHud() {
  const fails = session.shots.filter((shot) => !shot.success).length;
  const successes = session.shots.filter((shot) => shot.success).length;
  const key = `${session.voided}-${session.photo?.at ?? ""}-${session.shots.length}-${session.phase}-${fails}`;
  if (key === hudKey) return;
  hudKey = key;
  const pips = document.getElementById("pips");
  const pop = document.getElementById("pop");
  const hint = document.getElementById("hint");
  if (!pips || !pop) return;
  if (session.mode === "infinite") {
    pips.innerHTML = `<span>${esc(tr("cuts", { n: successes }))}</span> <span>${esc(tr("lives", { n: fails }))}</span>`;
  } else {
    const cells = Array.from({ length: 5 }, (_, index) => {
      const shot = session.shots[index];
      return `<i class="pip ${shot ? shot.tier : ""}"></i>`;
    }).join("");
    pips.innerHTML = cells;
  }
  if (session.voided) {
    pop.innerHTML = `<span>${esc(tr("voidCut"))}</span>`;
    if (hint) hint.textContent = tr("continue");
    return;
  }
  if (!session.photo) {
    pop.innerHTML = "";
    if (hint) hint.textContent = playMode === "stage" && stageById(stageId)?.hint ? tr("hint") : tr("tapShutter");
    return;
  }
  const shot = session.photo;
  const big = shot.success ? `<strong>${Math.round(shot.ms)}</strong><em>ms</em>` : `<em>${esc(tr("penalty", { ms: shot.scoreMs }))}</em>`;
  pop.innerHTML = `<span>${esc(tr(shot.tier))}</span>${big}`;
  if (hint) hint.textContent = tr("nextShot");
}

function frame(now) {
  if (screen === "game" && session) {
    session.update(now);
    for (const signal of session.consume()) {
      if (signal === "shot") onShotResolved();
    }
    const canvas = document.getElementById("world");
    if (canvas) drawWorld(canvas.getContext("2d"), session.view(now));
    syncHud();
  }
  if (screen === "title") {
    const canvas = document.getElementById("mascot");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#f0d3aa";
      ctx.fillRect(0, 0, 180, 140);
      ctx.fillStyle = "#c98449";
      ctx.fillRect(0, 112, 180, 28);
      const cycle = now % 900;
      const hopping = cycle > 620;
      drawCat(ctx, save.selectedCat || "cheez", 88, 112, hopping ? "hop" : "idle", hopping ? cycle - 620 : now);
    }
  }
  if (screen === "still") {
    const canvas = document.getElementById("still");
    if (canvas && pendingStill) drawStill(canvas.getContext("2d"), pendingStill, now);
  }
  requestAnimationFrame(frame);
}

function flushPending() {
  if (!save.pendingBoard || !navigator.onLine) return;
  save.board = insertBoard(save.board, save.pendingBoard);
  save.pendingBoard = null;
  persist();
  toast(tr("uploaded"));
}

document.addEventListener("pointerdown", () => {
  if (!save.settings.sound) return;
  audio.unlock();
  audio.startBgm();
}, { once: true });

document.addEventListener("visibilitychange", () => {
  if (document.hidden && screen === "game") session?.hide();
});

window.addEventListener("online", flushPending);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") event.preventDefault();
  if (screen !== "game" || !session) return;
  if (event.code === "Space" || event.code === "Enter") {
    const result = session.tap(performance.now());
    if (result === "done") finishStage();
    if (result === "revive") askRevive();
  }
  if (event.code === "Escape") openPause();
});

show("title");
requestAnimationFrame(frame);
