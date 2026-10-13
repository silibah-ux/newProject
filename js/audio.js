export function createAudio() {
  let ctx = null;
  let timer = null;
  let step = 0;

  function context() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, at, dur, type, gain) {
    const audio = context();
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    amp.gain.setValueAtTime(gain, at);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  function noiseClick(at) {
    const audio = context();
    const length = Math.floor(audio.sampleRate * 0.04);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = audio.createBufferSource();
    const amp = audio.createGain();
    src.buffer = buffer;
    amp.gain.setValueAtTime(0.18, at);
    src.connect(amp);
    amp.connect(audio.destination);
    src.start(at);
    src.stop(at + 0.05);
  }

  return {
    unlock() {
      context();
    },
    shutter() {
      const at = context().currentTime;
      noiseClick(at);
      tone(880, at, 0.08, "square", 0.04);
    },
    meow() {
      const audio = context();
      const at = audio.currentTime;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, at);
      osc.frequency.exponentialRampToValueAtTime(760, at + 0.08);
      osc.frequency.exponentialRampToValueAtTime(420, at + 0.22);
      amp.gain.setValueAtTime(0.05, at);
      amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
      osc.connect(amp);
      amp.connect(audio.destination);
      osc.start(at);
      osc.stop(at + 0.26);
    },
    good() {
      const at = context().currentTime;
      tone(660, at, 0.1, "square", 0.04);
      tone(880, at + 0.08, 0.14, "square", 0.04);
    },
    bad() {
      const at = context().currentTime;
      tone(180, at, 0.16, "sine", 0.05);
    },
    ui() {
      const at = context().currentTime;
      tone(520, at, 0.05, "square", 0.03);
    },
    startBgm() {
      if (timer) return;
      const audio = context();
      const notes = [392, 440, 494, 440, 370, 440, 494, 523];
      timer = setInterval(() => {
        if (audio.state !== "running") return;
        tone(notes[step % notes.length], audio.currentTime, 0.18, "triangle", 0.018);
        step += 1;
      }, 420);
    },
    stopBgm() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
