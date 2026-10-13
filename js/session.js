import {
  ARM_MS,
  CATS,
  INFINITE_FAILS,
  INFINITE_SCENES,
  SHOTS_PER_STAGE,
  createRng,
  infiniteRules,
  judge,
  planShot,
} from "./logic.js";
import { airPose, birdAt, heroAt, layoutOf } from "./draw.js";

export class Session {
  constructor({ rules, scene, heroId, mode }) {
    this.mode = mode;
    this.heroId = heroId;
    this.rules = rules;
    this.scene = scene;
    this.rng = createRng((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
    this.cats = this.pickCats(rules.catCount || 1);
    this.shots = [];
    this.revived = false;
    this.paused = false;
    this.pauseAt = 0;
    this.voided = false;
    this.over = false;
    this.photo = null;
    this.events = [];
    this.eventIndex = 0;
    this.currentEvent = null;
    this.phase = "arm";
    this.phaseStart = 0;
    this.phaseEnd = 0;
    this.jumpAt = 0;
    this.signals = [];
  }

  pickCats(count) {
    const others = CATS.map((cat) => cat.id).filter((id) => id !== this.heroId);
    return [this.heroId, ...others.slice(0, Math.max(0, count - 1))];
  }

  start(now) {
    this.beginShot(now);
  }

  beginShot(now) {
    if (this.mode === "infinite") {
      const successes = this.shots.filter((shot) => shot.success).length;
      const next = infiniteRules(successes);
      this.rules = next;
      this.scene = INFINITE_SCENES[Math.floor(this.rng() * INFINITE_SCENES.length)];
      this.cats = this.pickCats(next.catCount);
    }
    this.events = planShot(this.rules, this.rng);
    this.eventIndex = 0;
    this.currentEvent = null;
    this.photo = null;
    this.voided = false;
    this.phase = "arm";
    this.phaseStart = now;
    this.phaseEnd = now + ARM_MS;
  }

  update(now) {
    if (this.paused || this.photo || this.over || this.voided) return;
    let guard = 0;
    while (now >= this.phaseEnd && guard < 12) {
      guard += 1;
      if (this.phase === "air") {
        this.finish(judge(this.rules.lateMs + 1, this.rules.lateMs), now);
        return;
      }
      if (this.phase === "arm") {
        this.enterEvent(this.phaseEnd);
        continue;
      }
      this.eventIndex += 1;
      if (this.eventIndex >= this.events.length) return;
      this.enterEvent(this.phaseEnd);
    }
  }

  enterEvent(at) {
    const event = this.events[this.eventIndex];
    this.currentEvent = event;
    if (event.type === "jump") {
      this.phase = "air";
      this.jumpAt = at;
      this.phaseStart = at;
      this.phaseEnd = at + this.rules.lateMs;
      return;
    }
    this.phase = event.type === "fake" ? "fake" : event.type;
    this.phaseStart = at;
    this.phaseEnd = at + event.ms;
  }

  tap(now) {
    if (this.over) return "ignore";
    if (this.voided) {
      this.beginShot(now);
      return "next";
    }
    if (this.photo) {
      this.photo = null;
      return this.afterPhoto(now);
    }
    if (this.paused || this.phase === "arm") return "ignore";
    if (this.phase !== "air") {
      this.finish(judge(-1, this.rules.lateMs), now);
      return "shot";
    }
    this.finish(judge(now - this.jumpAt, this.rules.lateMs), now);
    return "shot";
  }

  finish(result, now) {
    const earlyStyle = result.tier === "early" && this.rng() < 0.5 ? "empty" : "mock";
    const shot = {
      ...result,
      earlyStyle: result.tier === "early" ? earlyStyle : null,
      scene: this.scene,
      catId: this.cats[0],
      extras: this.cats.slice(1),
      lateMs: this.rules.lateMs,
      birds: this.rules.birds,
      laundry: this.rules.laundry,
      flicker: this.rules.flicker,
    };
    this.shots.push(shot);
    this.photo = { ...shot, at: now, frozen: now };
    this.signals.push("shot");
  }

  afterPhoto(now) {
    const fails = this.shots.filter((shot) => !shot.success).length;
    if (this.mode === "stage" && this.shots.length >= SHOTS_PER_STAGE) {
      this.over = true;
      return "done";
    }
    if (this.mode === "infinite" && fails >= INFINITE_FAILS) return "revive";
    this.beginShot(now);
    return "next";
  }

  revive(now) {
    const last = this.shots[this.shots.length - 1];
    if (last && !last.success) this.shots.pop();
    this.revived = true;
    this.photo = null;
    this.beginShot(now);
  }

  end() {
    this.over = true;
    this.photo = null;
  }

  pause(now) {
    if (this.paused || this.over) return;
    this.paused = true;
    this.pauseAt = now;
  }

  resume(now) {
    if (!this.paused) return;
    const delta = now - this.pauseAt;
    this.phaseStart += delta;
    this.phaseEnd += delta;
    this.jumpAt += delta;
    if (this.photo) this.photo.at += delta;
    this.paused = false;
  }

  hide() {
    if (this.over || this.voided || this.photo) return;
    this.voided = true;
  }

  consume() {
    const pending = this.signals;
    this.signals = [];
    return pending;
  }

  view(now) {
    const clock = this.paused ? this.pauseAt : now;
    const layout = layoutOf(this.scene);
    if (this.photo) {
      const elapsed = this.photo.tier === "late" ? this.photo.lateMs : this.photo.ms;
      return {
        scene: this.scene,
        time: this.photo.frozen,
        cats: frozenCats(this.photo, layout, elapsed),
        bird: this.rules.birds ? birdAt(this.photo.frozen) : null,
        laundry: !!this.rules.laundry,
        flicker: !!this.rules.flicker,
        flash: now - this.photo.at < 90 ? 0.9 : 0,
        tier: this.photo.tier,
        takeoff: false,
      };
    }
    const cats = this.cats.map((id, index) => {
      const slot = index === 0 ? layout.hero : layout.slots[index - 1];
      let pose = "idle";
      let x = slot.x;
      let y = slot.y;
      let anim = clock;
      if (index === 0 && this.phase === "air") {
        const pos = heroAt(this.scene, clock - this.jumpAt, this.rules.lateMs);
        x = pos.x;
        y = pos.y;
        pose = airPose(clock - this.jumpAt);
        anim = clock - this.jumpAt;
      } else if (this.phase === "fake" && this.currentEvent?.cat === index) {
        pose = this.currentEvent.kind;
        anim = clock - this.phaseStart;
      } else if (index === 0 && this.phase === "crouch") {
        pose = "crouch";
        anim = clock - this.phaseStart;
      }
      return { id, x, y, pose, anim };
    });
    return {
      scene: this.scene,
      time: clock,
      cats: this.voided ? cats.map((cat) => ({ ...cat, pose: "idle" })) : cats,
      bird: this.rules.birds ? birdAt(clock) : null,
      laundry: !!this.rules.laundry,
      flicker: !!this.rules.flicker,
      flash: 0,
      tier: null,
      takeoff: this.phase === "air" && clock - this.jumpAt < 90,
    };
  }
}

function frozenCats(shot, layout, elapsed) {
  if (shot.tier === "early" && shot.earlyStyle === "empty") return [];
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
    const pos = heroAt(shot.scene, elapsed, shot.lateMs);
    hero = { id: shot.catId, x: pos.x, y: pos.y, pose: airPose(elapsed), anim: elapsed };
  }
  return [hero, ...extras];
}
