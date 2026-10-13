import { catById, jumpLift, jumpProgress, VIEW_H, VIEW_W } from "./logic.js";

const LAYOUT = {
  sofa: { hero: { x: 42, y: 186 }, land: { x: 142, y: 190 }, slots: [{ x: 146, y: 132 }, { x: 96, y: 156 }] },
  tower: { hero: { x: 36, y: 154 }, land: { x: 142, y: 138 }, slots: [{ x: 146, y: 112 }, { x: 92, y: 186 }] },
  table: { hero: { x: 40, y: 150 }, land: { x: 140, y: 168 }, slots: [{ x: 148, y: 118 }, { x: 90, y: 176 }] },
  fridge: { hero: { x: 34, y: 128 }, land: { x: 138, y: 176 }, slots: [{ x: 146, y: 150 }, { x: 96, y: 168 }] },
  rail: { hero: { x: 34, y: 156 }, land: { x: 146, y: 156 }, slots: [{ x: 142, y: 124 }, { x: 90, y: 176 }] },
  laundry: { hero: { x: 36, y: 148 }, land: { x: 144, y: 172 }, slots: [{ x: 140, y: 118 }, { x: 92, y: 160 }] },
  roof: { hero: { x: 38, y: 176 }, land: { x: 142, y: 164 }, slots: [{ x: 148, y: 122 }, { x: 96, y: 148 }] },
};

export function layoutOf(scene) {
  return LAYOUT[scene] ?? LAYOUT.sofa;
}

export function heroAt(scene, elapsed, lateMs) {
  const layout = layoutOf(scene);
  const p = jumpProgress(elapsed, lateMs);
  const lift = jumpLift(elapsed, lateMs);
  return {
    x: layout.hero.x + (layout.land.x - layout.hero.x) * p,
    y: layout.hero.y + (layout.land.y - layout.hero.y) * p - lift * 52,
  };
}

export function airPose(elapsed) {
  if (elapsed <= 200) return "legend";
  if (elapsed <= 300) return "cute";
  return "shame";
}

export function birdAt(time) {
  const span = VIEW_W + 36;
  return { x: ((time / 13) % span) - 24, y: 34 + Math.sin(time / 220) * 7 };
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawWorld(ctx, view) {
  ctx.imageSmoothingEnabled = false;
  drawBackdrop(ctx, view);
  drawBird(ctx, view);
  for (const cat of view.cats) drawCat(ctx, cat.id, cat.x, cat.y, cat.pose, cat.anim ?? view.time);
  if (view.takeoff) drawDust(ctx, view.cats[0]);
  if (view.tier) drawGrade(ctx, view.tier);
  if (view.flash > 0) {
    ctx.fillStyle = `rgba(255,248,234,${view.flash})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  drawFinder(ctx);
}

function drawBackdrop(ctx, view) {
  const scene = view.scene;
  if (scene === "roof") drawRoof(ctx, view);
  else if (scene === "rail" || scene === "laundry") drawBalcony(ctx, view);
  else if (scene === "table" || scene === "fridge") drawKitchen(ctx, view);
  else drawLiving(ctx, view);
}

function drawLiving(ctx, view) {
  rect(ctx, 0, 0, VIEW_W, VIEW_H, "#f0d3aa");
  rect(ctx, 0, 214, VIEW_W, 56, "#c98449");
  rect(ctx, 0, 214, VIEW_W, 4, "#a86a34");
  rect(ctx, 18, 28, 52, 40, "#9fd0ea");
  rect(ctx, 22, 32, 44, 32, "#d8f3ff");
  rect(ctx, 42, 28, 4, 40, "#f7f1e4");
  rect(ctx, 18, 46, 52, 4, "#f7f1e4");
  rect(ctx, 112, 36, 16, 22, "#6ea2c2");
  rect(ctx, 132, 48, 10, 16, "#6ea2c2");
  if (view.scene === "tower") drawTower(ctx);
  else drawSofaSet(ctx);
  rect(ctx, 70, 230, 40, 8, "#e7b1a0");
}

function drawSofaSet(ctx) {
  rect(ctx, 8, 160, 62, 30, "#d15d4e");
  rect(ctx, 12, 166, 50, 14, "#f0a090");
  rect(ctx, 6, 186, 68, 8, "#b3473c");
  rect(ctx, 118, 168, 48, 26, "#e7a25a");
  rect(ctx, 122, 174, 40, 10, "#f6d7a2");
  rect(ctx, 116, 190, 52, 6, "#c4843c");
}

function drawTower(ctx) {
  rect(ctx, 28, 154, 8, 70, "#d7b07a");
  rect(ctx, 48, 154, 8, 70, "#d7b07a");
  rect(ctx, 18, 146, 48, 10, "#f0c14d");
  rect(ctx, 22, 136, 16, 12, "#e07a5f");
  rect(ctx, 118, 138, 8, 80, "#d7b07a");
  rect(ctx, 138, 138, 8, 80, "#d7b07a");
  rect(ctx, 110, 130, 44, 10, "#8fbf88");
  rect(ctx, 78, 186, 28, 8, "#f2d2b0");
  rect(ctx, 86, 194, 6, 24, "#d7b07a");
  rect(ctx, 100, 194, 6, 24, "#d7b07a");
}

function drawKitchen(ctx, view) {
  rect(ctx, 0, 0, VIEW_W, VIEW_H, "#f6efd8");
  rect(ctx, 0, 78, VIEW_W, 36, "#d7efe6");
  for (let x = 0; x < VIEW_W; x += 18) rect(ctx, x, 78, 16, 16, "#e7f7f1");
  rect(ctx, 0, 208, VIEW_W, 62, "#d8c3a0");
  for (let x = 0; x < VIEW_W; x += 18) {
    for (let y = 214; y < VIEW_H; y += 14) rect(ctx, x + ((y / 14) % 2) * 8, y, 16, 12, "#c9ad86");
  }
  rect(ctx, 120, 24, 36, 28, "#b9ddb0");
  if (view.scene === "fridge") {
    rect(ctx, 8, 78, 46, 78, "#f7f7f4");
    rect(ctx, 10, 80, 42, 40, "#ffffff");
    rect(ctx, 46, 96, 4, 16, "#c8c8c2");
    rect(ctx, 46, 132, 4, 12, "#c8c8c2");
    rect(ctx, 112, 154, 52, 10, "#e6b15a");
    rect(ctx, 120, 164, 6, 46, "#c99545");
    rect(ctx, 150, 164, 6, 46, "#c99545");
  } else {
    rect(ctx, 12, 128, 58, 8, "#f2d7a2");
    rect(ctx, 18, 136, 6, 40, "#c99545");
    rect(ctx, 56, 136, 6, 40, "#c99545");
    rect(ctx, 116, 146, 48, 8, "#e07a5f");
    rect(ctx, 122, 154, 6, 28, "#c99545");
    rect(ctx, 152, 154, 6, 28, "#c99545");
    rect(ctx, 130, 138, 10, 8, "#f4c95d");
  }
}

function drawBalcony(ctx, view) {
  const dusk = view.scene === "laundry";
  rect(ctx, 0, 0, VIEW_W, 150, dusk ? "#f0b48a" : "#8ecdf2");
  rect(ctx, 0, 150, VIEW_W, 120, "#d7dde3");
  for (let i = 0; i < 5; i += 1) {
    rect(ctx, 8 + i * 36, 96 - (i % 2) * 10, 22, 54, i % 2 ? "#f4e1c4" : "#d5e4ef");
    rect(ctx, 12 + i * 36, 104, 6, 8, "#f2c14e");
  }
  rect(ctx, 0, 156, VIEW_W, 6, "#73879a");
  rect(ctx, 0, 174, VIEW_W, 4, "#73879a");
  for (let x = 8; x < VIEW_W; x += 22) rect(ctx, x, 156, 4, 22, "#8ea0b0");
  rect(ctx, 0, 210, VIEW_W, 60, "#c5ccd2");
  if (view.laundry) {
    const sway = Math.sin(view.time / 280) * 4;
    rect(ctx, 20, 48, 140, 2, "#f7f4ee");
    drawShirt(ctx, 40 + sway, 50, "#f07167");
    drawShirt(ctx, 78 - sway, 50, "#f6e27a");
    drawShirt(ctx, 116 + sway, 50, "#ffffff");
  }
  rect(ctx, 18, 148, 28, 8, "#e7eef3");
  rect(ctx, 128, 148, 36, 8, "#e7eef3");
}

function drawShirt(ctx, x, y, color) {
  rect(ctx, x, y, 16, 14, color);
  rect(ctx, x - 4, y + 2, 4, 8, color);
  rect(ctx, x + 16, y + 2, 4, 8, color);
}

function drawRoof(ctx, view) {
  rect(ctx, 0, 0, VIEW_W, VIEW_H, "#141a30");
  rect(ctx, 124, 28, 22, 22, "#f6e7b2");
  rect(ctx, 148, 36, 8, 8, "#141a30");
  for (const [x, y] of [[18, 22], [40, 48], [70, 18], [96, 40], [20, 70]]) {
    rect(ctx, x, y, 2, 2, "#f7f1e4");
  }
  for (let i = 0; i < 6; i += 1) {
    rect(ctx, 6 + i * 30, 96, 18, 28, "#1d2838");
    if ((i + Math.floor(view.time / 500)) % 3 === 0) rect(ctx, 10 + i * 30, 102, 5, 6, "#f2c14e");
  }
  rect(ctx, 0, 168, VIEW_W, 102, "#3d4658");
  for (let y = 176; y < VIEW_H; y += 8) {
    rect(ctx, 0, y, VIEW_W, 2, "#2c3344");
  }
  rect(ctx, 18, 150, 16, 26, "#6d5848");
  const lampOn = !view.flicker || Math.sin(view.time / 90) > -0.55;
  rect(ctx, 150, 120, 4, 56, "#2a3142");
  rect(ctx, 144, 112, 16, 8, lampOn ? "#f6e7b2" : "#3a4254");
  if (lampOn && view.flicker) rect(ctx, 140, 120, 24, 20, "rgba(246,231,178,0.25)");
}

function drawBird(ctx, view) {
  if (!view.bird) return;
  const { x, y } = view.bird;
  const flap = Math.sin(view.time / 70) > 0 ? -3 : 2;
  rect(ctx, x, y, 10, 5, "#f7f4ee");
  rect(ctx, x - 5, y + flap, 6, 2, "#d7e4ef");
  rect(ctx, x + 8, y + flap, 6, 2, "#d7e4ef");
  rect(ctx, x + 9, y + 2, 3, 2, "#e37b3a");
}

function drawDust(ctx, cat) {
  if (!cat) return;
  rect(ctx, cat.x - 8, cat.y - 2, 3, 2, "rgba(255,248,234,0.8)");
  rect(ctx, cat.x - 2, cat.y, 2, 2, "rgba(255,248,234,0.6)");
}

function drawGrade(ctx, tier) {
  if (tier === "legendary") {
    rect(ctx, 4, 4, VIEW_W - 8, 3, "#f0c14d");
    rect(ctx, 4, VIEW_H - 7, VIEW_W - 8, 3, "#f0c14d");
  } else if (tier === "shame") {
    ctx.fillStyle = "rgba(40, 30, 50, 0.18)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  } else if (tier === "early" || tier === "late") {
    ctx.fillStyle = "rgba(20, 24, 32, 0.12)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function drawFinder(ctx) {
  const c = "#241911";
  const n = 16;
  const m = 8;
  rect(ctx, m, m, n, 3, c);
  rect(ctx, m, m, 3, n, c);
  rect(ctx, VIEW_W - m - n, m, n, 3, c);
  rect(ctx, VIEW_W - m - 3, m, 3, n, c);
  rect(ctx, m, VIEW_H - m - 3, n, 3, c);
  rect(ctx, m, VIEW_H - m - n, 3, n, c);
  rect(ctx, VIEW_W - m - n, VIEW_H - m - 3, n, 3, c);
  rect(ctx, VIEW_W - m - 3, VIEW_H - m - n, 3, n, c);
  rect(ctx, VIEW_W - 22, 14, 6, 6, "#e36a45");
}

export function drawCat(ctx, id, x, y, pose, anim = 0) {
  const cat = catById(id);
  if (pose === "tailOnly") {
    drawTail(ctx, cat, x, y, anim, true);
    return;
  }
  if (pose === "mock") {
    drawFront(ctx, cat, x, y, true);
    return;
  }
  if (pose === "shame") {
    drawButt(ctx, cat, x, y);
    return;
  }
  const crouch = pose === "crouch" ? 5 : 0;
  const wiggle = pose === "wiggle" ? Math.sin(anim / 48) * 3 : 0;
  const hop = pose === "hop" ? Math.sin(Math.min(1, anim / 340) * Math.PI) * 11 : 0;
  const bob = pose === "idle" ? Math.sin(anim / 220) : 0;
  drawSide(ctx, cat, x + wiggle, y + crouch - hop + bob, pose, anim);
}

function drawTail(ctx, cat, x, y, anim, big) {
  const wag = Math.sin(anim / 60) * (big ? 6 : 3);
  rect(ctx, x - 8, y - 18 + wag, 5, 5, cat.dark);
  rect(ctx, x - 4, y - 24 + wag, 5, 6, cat.fur);
  rect(ctx, x, y - 28 + wag * 0.3, 5, 6, cat.fur);
  if (big) rect(ctx, x + 4, y - 24, 4, 8, cat.dark);
}

function drawSide(ctx, cat, x, y, pose, anim) {
  const legend = pose === "legend";
  const cute = pose === "cute";
  const air = legend || cute;
  const stretch = legend ? 6 : cute ? 2 : 0;
  const slim = cat.build === "slim" ? -2 : 0;
  const round = cat.build === "round" ? 2 : 0;
  drawTail(ctx, cat, x, y, pose === "tail" ? anim : anim * 0.2, false);
  if (air) {
    rect(ctx, x - 10, y - 6, 7, 3, cat.dark);
    rect(ctx, x + 12 + stretch, y - 8, 8, 3, cat.fur);
  } else {
    rect(ctx, x - 1, y - 8, 4, 8, cat.dark);
    rect(ctx, x + 8, y - 8, 4, 8, cat.dark);
  }
  rect(ctx, x - 8, y - 20 - round, 20 + stretch + round, 12 + round + slim, cat.fur);
  rect(ctx, x - 2, y - 14, 10, 4, cat.belly);
  if (cat.build === "tabby") {
    rect(ctx, x - 2, y - 19, 2, 7, cat.dark);
    rect(ctx, x + 4, y - 19, 2, 7, cat.dark);
  }
  if (cat.build === "fluff") rect(ctx, x - 12, y - 18, 5, 8, cat.fur);
  const hx = x + 8 + stretch;
  rect(ctx, hx, y - 31, 14, 12, cat.fur);
  rect(ctx, hx + 1, y - 35, 4, 5, cat.fur);
  rect(ctx, hx + 8, y - 35, 4, 5, cat.fur);
  rect(ctx, hx + 2, y - 34, 2, 2, cat.nose);
  rect(ctx, hx + 9, y - 34, 2, 2, cat.nose);
  const blink = pose === "idle" && Math.sin(anim / 180) > 0.97;
  if (blink) rect(ctx, hx + 8, y - 26, 3, 1, cat.eye);
  else {
    rect(ctx, hx + 8, y - 27, 3, 3, cat.eye);
    rect(ctx, hx + 9, y - 27, 1, 1, "#fff8ea");
  }
  rect(ctx, hx + 7, y - 23, 3, 2, cat.nose);
  rect(ctx, hx + 4, y - 23, 4, 3, cat.belly);
}

function drawFront(ctx, cat, x, y, smug) {
  rect(ctx, x - 8, y - 16, 20, 12, cat.fur);
  rect(ctx, x - 4, y - 12, 12, 6, cat.belly);
  rect(ctx, x - 2, y - 8, 4, 6, cat.dark);
  rect(ctx, x + 6, y - 8, 4, 6, cat.dark);
  rect(ctx, x - 8, y - 32, 20, 16, cat.fur);
  rect(ctx, x - 6, y - 38, 5, 7, cat.fur);
  rect(ctx, x + 6, y - 38, 5, 7, cat.fur);
  rect(ctx, x - 5, y - 36, 2, 3, cat.nose);
  rect(ctx, x + 7, y - 36, 2, 3, cat.nose);
  rect(ctx, x - 3, y - 26, 3, 3, cat.eye);
  rect(ctx, x + 6, y - 26, 3, 3, cat.eye);
  if (smug) {
    rect(ctx, x - 3, y - 25, 3, 1, cat.eye);
    rect(ctx, x + 6, y - 25, 3, 1, cat.eye);
  }
  rect(ctx, x + 2, y - 22, 4, 3, cat.nose);
  rect(ctx, x, y - 19, 3, 1, cat.dark);
  rect(ctx, x + 5, y - 19, 3, 1, cat.dark);
}

function drawButt(ctx, cat, x, y) {
  rect(ctx, x - 12, y - 22, 26, 18, cat.fur);
  rect(ctx, x - 6, y - 16, 14, 8, cat.belly);
  if (cat.build === "tabby") {
    rect(ctx, x - 6, y - 20, 2, 10, cat.dark);
    rect(ctx, x + 2, y - 20, 2, 10, cat.dark);
  }
  rect(ctx, x + 2, y - 34, 5, 14, cat.fur);
  rect(ctx, x + 1, y - 38, 7, 5, cat.dark);
  rect(ctx, x - 16, y - 16, 8, 8, cat.fur);
  rect(ctx, x - 14, y - 14, 2, 2, cat.eye);
  rect(ctx, x + 8, y - 8, 4, 5, cat.dark);
  rect(ctx, x - 2, y - 8, 4, 5, cat.dark);
}

export function drawStill(ctx, chapter, time) {
  ctx.imageSmoothingEnabled = false;
  if (chapter === 1) {
    drawLiving(ctx, { scene: "sofa", time });
    rect(ctx, 78, 86, 28, 70, "#c99545");
    rect(ctx, 82, 90, 20, 62, "#f6e7c1");
    drawCat(ctx, "cheez", 70, 186, "idle", time);
  } else if (chapter === 2) {
    drawBalcony(ctx, { scene: "rail", time, laundry: true });
    drawCat(ctx, "kong", 40, 156, "idle", time);
  } else if (chapter === 3) {
    drawRoof(ctx, { scene: "roof", time, flicker: false });
    rect(ctx, 0, 0, VIEW_W, 80, "#24324e");
    drawCat(ctx, "gurum", 48, 176, "idle", time);
  } else {
    drawRoof(ctx, { scene: "roof", time, flicker: true });
    drawCat(ctx, "cheez", 36, 176, "idle", time);
    drawCat(ctx, "kong", 70, 164, "idle", time);
    drawCat(ctx, "gurum", 108, 176, "idle", time);
    drawCat(ctx, "bamtol", 142, 164, "idle", time);
  }
  drawFinder(ctx);
}

export function drawShareCard(ctx, info) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#1b140f";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#f6e7c9";
  ctx.fillRect(16, 16, w - 32, h - 32);
  ctx.fillStyle = "#241911";
  ctx.font = "28px Jua, Gaegu, sans-serif";
  ctx.fillText(info.title, 32, 58);
  ctx.font = "22px Gaegu, sans-serif";
  ctx.fillText(info.stat, 32, 92);
  ctx.font = "18px Gaegu, sans-serif";
  ctx.fillText(info.sub, 32, 118);
  const frame = Math.max(48, Math.floor((w - 64 - 32) / Math.max(1, info.views.length)));
  info.views.forEach((view, index) => {
    const x = 32 + index * (frame + 8);
    const y = 146;
    ctx.fillStyle = "#241911";
    ctx.fillRect(x - 4, y - 4, frame + 8, frame + 8);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, frame, frame);
    ctx.clip();
    ctx.translate(x, y);
    ctx.scale(frame / VIEW_W, frame / VIEW_H);
    drawWorld(ctx, view);
    ctx.restore();
  });
  drawQr(ctx, w - 120, h - 140, 80);
  ctx.fillStyle = "#241911";
  ctx.font = "16px Gaegu, sans-serif";
  ctx.fillText(info.qr, w - 120, h - 48);
}

function drawQr(ctx, x, y, size) {
  const n = 21;
  const cell = size / n;
  ctx.fillStyle = "#fff8ea";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#241911";
  const finder = (fx, fy) => {
    ctx.fillRect(x + fx * cell, y + fy * cell, cell * 7, cell * 7);
    ctx.fillStyle = "#fff8ea";
    ctx.fillRect(x + (fx + 1) * cell, y + (fy + 1) * cell, cell * 5, cell * 5);
    ctx.fillStyle = "#241911";
    ctx.fillRect(x + (fx + 2) * cell, y + (fy + 2) * cell, cell * 3, cell * 3);
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
  let bit = 7;
  for (let row = 8; row < n; row += 1) {
    for (let col = 8; col < n; col += 1) {
      bit = (bit * 33 + row * 17 + col) % 97;
      if (bit % 3 === 0) ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
    }
  }
}

export function photoView(shot) {
  const layout = layoutOf(shot.scene);
  let cats = [];
  if (!(shot.tier === "early" && shot.earlyStyle === "empty")) {
    const extras = (shot.extras || []).map((id, index) => ({
      id,
      x: layout.slots[index].x,
      y: layout.slots[index].y,
      pose: "idle",
      anim: 0,
    }));
    let hero;
    if (shot.tier === "early") {
      hero = { id: shot.catId, x: layout.hero.x, y: layout.hero.y, pose: "mock", anim: 0 };
    } else if (shot.tier === "late") {
      hero = { id: shot.catId, x: layout.land.x, y: layout.land.y, pose: "tailOnly", anim: 0 };
    } else {
      const pos = heroAt(shot.scene, shot.ms, shot.lateMs);
      hero = { id: shot.catId, x: pos.x, y: pos.y, pose: airPose(shot.ms), anim: shot.ms };
    }
    cats = [hero, ...extras];
  }
  return {
    scene: shot.scene,
    time: 1200,
    cats,
    bird: shot.birds ? { x: 48, y: 40 } : null,
    laundry: !!shot.laundry,
    flicker: !!shot.flicker,
    flash: 0,
    tier: shot.tier,
    takeoff: false,
  };
}
