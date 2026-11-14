/* ОАЗИС: автономное аудио без музыки, голосов и внешних аудиосервисов.
 * Утверждённые записи пользователя и сохранённые эффекты проекта.
 * HTMLAudioElement обеспечивает совместимость с Safari/Telegram WebView.
 */
(function () {
  'use strict';
  const KEY = 'oasis_audio_v1';
  const ROOT = 'assets/audio/';
  const FX = Object.freeze({
    click: 0.27, plant: 0.46, plant2:0.46, water: 0.53, harvest: 0.50, grass:.5, cloth:.5, sale:.5, sheep:.35, ui_open:.4, ui_close:.35,
    canal: 0.47, build: 0.48, coin: 0.57, upgrade: 0.49,
    collect: 0.48, error: 0.26, quest: 0.51
  });
  const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

  class OasisAudioManager {
    constructor() {
      this.enabled = true;
      this.ambience = false;
      this.volume = .65;
      this.unlocked = false;
      this.phase = 'day';
      this.bound = false; this.context = 'menu'; this.lastFX = Object.create(null);
      this.activeFX = Object.create(null);
      this.loops = Object.create(null);
      this.supported = typeof Audio !== 'undefined';
      this.readSettings();
    }
    readSettings() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const state = JSON.parse(raw);
        if (typeof state.enabled === 'boolean') this.enabled = state.enabled;
        this.ambience = !!state.ambience;
        if (Number.isFinite(state.volume)) this.volume = clamp(state.volume, 0, 1);
      } catch (_) { /* private mode / disabled localStorage */ }
    }
    saveSettings() {
      try {
        localStorage.setItem(KEY, JSON.stringify({enabled:this.enabled, ambience:this.ambience, volume:this.volume}));
      } catch (_) { /* audio continues without persistence */ }
    }
    make(name, loop = false) {
      const audio = new Audio(ROOT + name + (loop ? '.wav' : '.mp3'));
      audio.preload = loop ? 'auto' : 'metadata';
      audio.loop = loop;
      audio.playsInline = true;
      return audio;
    }
    attach() {
      if (this.bound) return;
      this.bound = true;
      if (this.supported) {
        
        
      }
      const toggle = document.getElementById('sound-toggle');
      const settings = document.getElementById('sound-settings');
      const slider = document.getElementById('sound-volume');
      const ambientCheckbox = document.getElementById('sound-ambience');
      const close = document.getElementById('sound-settings-close');
      const unlock = () => this.unlock();
      // Capture ensures the first game touch can start audio under mobile policies.
      document.addEventListener('pointerdown', unlock, {capture:true,passive:true});
      document.addEventListener('keydown', unlock, {capture:true});
      document.addEventListener('click', event => {
        const target = event.target;
        if (target && typeof target.closest === 'function' && target.closest('button') && !target.closest('#sound-toggle')) {
          this.play(target.closest('[data-dismiss],.modal-back,.close-modal,#sound-settings-close')?'ui_close':'click');
        }
      }, true);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pauseAll();
        else this.startAmbience();
      });
      toggle.addEventListener('click', () => {
        this.setEnabled(!this.enabled);
        this.unlock();
        this.syncUI();
      });
      toggle.addEventListener('contextmenu', event => event.preventDefault());
      document.getElementById('sound-open-settings').addEventListener('click', () => {
        settings.hidden = !settings.hidden;
        if (!settings.hidden) this.syncUI();
      });
      close.addEventListener('click', () => settings.hidden = true);
      slider.addEventListener('input', () => this.setVolume(Number(slider.value)/100));
      ambientCheckbox.addEventListener('change', () => this.setAmbience(ambientCheckbox.checked));
      this.syncUI();
    }
    unlock() {
      if (!this.unlocked) this.unlocked = true;
      this.startAmbience();
    }
    tryPlay(audio) {
      try {
        const promise = audio.play();
        if (promise && typeof promise.catch === 'function') promise.catch(() => {});
      } catch (_) { /* blocked audio should never crash gameplay */ }
    }
    applyVolumes() {
      if (!this.supported) return;
      const active = this.enabled && this.ambience && (typeof document === 'undefined' || !document.hidden);
      for (const clip of Object.values(this.loops)) clip.volume = active ? this.volume * .16 : 0;
      for (const [name,clips] of Object.entries(this.activeFX)) for (const clip of clips) clip.volume = this.enabled ? this.volume * FX[name] : 0;
    }
    startAmbience() {
      if (!this.unlocked || !this.supported) return;
      if (!this.enabled || !this.ambience || !this.volume || document.hidden) {this.pauseAmbience(); return;}
      this.applyVolumes();
      if (this.context === 'menu') {this.pauseAmbience();return;}
      const name=this.context==='market'?'market_loop':'water_loop';
      for(const [key,clip] of Object.entries(this.loops)) if(key!==name)clip.pause();
      const clip=this.loops[name]||(this.loops[name]=this.make(name,true));
      this.applyVolumes(); if(clip.paused)this.tryPlay(clip);
    }
    setContext(context) {if(this.context===context)return;this.context=context;this.startAmbience();}

    pauseAmbience() {for (const audio of Object.values(this.loops)) audio.pause();}
    pauseAll() {
      this.pauseAmbience();
      for (const clips of Object.values(this.activeFX)) for (const clip of clips) clip.pause();
    }
    setEnabled(enabled) {
      this.enabled = !!enabled;
      this.saveSettings();
      if (!this.enabled) this.pauseAll();
      else this.startAmbience();
      this.applyVolumes();
      this.syncUI();
    }
    setVolume(volume) {
      this.volume = clamp(Number.isFinite(volume) ? volume : .65, 0, 1);
      this.saveSettings();
      this.applyVolumes();
      if (!this.volume) this.pauseAmbience(); else this.startAmbience();
      this.syncUI();
    }
    setAmbience(enabled) {
      this.ambience = !!enabled;
      this.saveSettings();
      if (this.ambience) this.startAmbience(); else this.pauseAmbience();
      this.applyVolumes();
      this.syncUI();
    }
    setPhase(phase) {
      if (phase !== 'day' && phase !== 'night') return;
      if (this.phase !== phase) {this.phase = phase; this.applyVolumes();}
    }
    play(name) {
      if (!Object.prototype.hasOwnProperty.call(FX, name)) return;
      if (!this.unlocked || !this.supported || !this.enabled || document.hidden || !this.volume) return;
      const now=Date.now(); if(now-(this.lastFX[name]||0)<(name==='sheep'?5000:75))return; this.lastFX[name]=now;
      if(Object.values(this.activeFX).flat().filter(a=>!a.paused&&!a.ended).length>=6)return;
      const clips = this.activeFX[name] || (this.activeFX[name] = []);
      let clip = clips.find(a => a.paused || a.ended);
      if (!clip && clips.length < 3) {clip = this.make(name); clips.push(clip);}
      if (!clip) return; // cap simultaneously active sounds to avoid noise/memory growth
      try {clip.currentTime = 0;} catch (_) {}
      clip.volume = this.volume * FX[name];
      this.tryPlay(clip);
    }
    syncUI() {
      if (typeof document === 'undefined') return;
      const toggle = document.getElementById('sound-toggle');
      if (!toggle) return;
      toggle.textContent = this.enabled ? '🔊' : '🔇';
      toggle.title = this.enabled ? 'Выключить звук' : 'Включить звук';
      toggle.setAttribute('aria-label', toggle.title);
      toggle.setAttribute('aria-pressed', String(this.enabled));
      const volume = document.getElementById('sound-volume');
      const amount = document.getElementById('sound-volume-value');
      const ambience = document.getElementById('sound-ambience');
      if (volume) volume.value = String(Math.round(this.volume * 100));
      if (amount) amount.textContent = Math.round(this.volume*100) + '%';
      if (ambience) { ambience.checked = this.ambience; ambience.disabled = false; const label=ambience.closest?.("label"); if(label)label.hidden=false; }
    }
  }
  window.OasisAudio = new OasisAudioManager();
})();
