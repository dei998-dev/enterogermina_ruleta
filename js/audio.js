// ============================================================
//  audio.js — Sound Manager
//  
//
//  API:
//    AudioManager.init()         → preload all sounds (call on page load)
//    AudioManager.play('key')    → play a sound
//    AudioManager.stop('key')    → stop a looping sound
//    AudioManager.toggleMute()   → toggle on/off, returns new muted state
//    AudioManager.isMuted()      → returns true/false
//    AudioManager._node('key')   → returns raw Audio element
// ============================================================

const AudioManager = (() => {

  const SOUNDS = {
    spin:        { src: 'audio/spin.wav',        loop: true,  volume: 0.7 },
    tick:        { src: 'audio/tick.wav',        loop: false, volume: 0.6 },
    correct:     { src: 'audio/correct.wav',     loop: false, volume: 1.0 },
    wrong:       { src: 'audio/wrong.wav',       loop: false, volume: 1.0 },
    bg_music:    { src: 'audio/bg_music.wav',    loop: true,  volume: 0.3 },
    final_music: { src: 'audio/final_music.wav', loop: false, volume: 1.0 },
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

  function _node(key) { return nodes[key] || null; }

  return { init, play, stop, toggleMute, isMuted, _node };

})();