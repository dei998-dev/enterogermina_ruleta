// ============================================================
//  audio.js — Sound Manager
//  All audio logic lives here. No audio code in game.js.
//
//  API:
//    AudioManager.init()         → preload all sounds (call on page load)
//    AudioManager.play('key')    → play a sound
//    AudioManager.stop('key')    → stop a looping sound
//    AudioManager.toggleMute()   → toggle on/off, returns new muted state
//    AudioManager.isMuted()      → returns true/false
// ============================================================

const AudioManager = (() => {

  // Add or remove sounds here. Use loop:true for continuous sounds.
  const SOUNDS = {
    spin:    { src: 'audio/spin.mp3',    loop: true,  volume: 0.7 },
    tick:    { src: 'audio/tick.mp3',    loop: false, volume: 0.6 },
    correct: { src: 'audio/correct.mp3', loop: false, volume: 1.0 },
    wrong:   { src: 'audio/wrong.mp3',   loop: false, volume: 1.0 },
    bgm:     { src: 'audio/bgm.mp3',     loop: true,  volume: 0.3 },
  };

  let muted = false;
  let ready = false;
  const nodes = {};

  function init() {
    Object.entries(SOUNDS).forEach(([key, cfg]) => {
      const audio   = new Audio(cfg.src);
      audio.loop    = cfg.loop;
      audio.volume  = cfg.volume;
      audio.preload = 'auto';
      nodes[key]    = audio;
    });
    ready = true;
  }

  function play(key) {
    if (!ready || muted) return;
    const audio = nodes[key];
    if (!audio) { console.warn(`AudioManager: unknown sound "${key}"`); return; }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function stop(key) {
    const audio = nodes[key];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function toggleMute() {
    muted = !muted;
    Object.values(nodes).forEach(a => { a.muted = muted; });
    return muted;
  }

  function isMuted() { return muted; }

  return { init, play, stop, toggleMute, isMuted };

})();