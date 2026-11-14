/* Standalone mocked-browser audio regression tests; no DOM or device required. */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const elements = Object.create(null);
const events = Object.create(null);
const store = Object.create(null);
let playCount = 0;
class MockAudio {
  constructor(src) {this.src=src;this.paused=true;this.ended=false;this.volume=1;this.loop=false;this.currentTime=0;this.playsInline=false;}
  play(){this.paused=false;playCount++;return Promise.resolve();}
  pause(){this.paused=true;}
}
function el(id){return elements[id] ||= {
  id, hidden: true, value:'', checked:true, textContent:'', title:'',attrs:{},
  handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},setAttribute(k,v){this.attrs[k]=v;}
};}
const doc={hidden:false,getElementById:el,addEventListener(name,fn){(events[name]||=([])).push(fn);}};
const win={};
const context={window:win, Audio:MockAudio, document:doc, localStorage:{getItem(k){return store[k]||null;},setItem(k,v){store[k]=v;}}, console};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/core/AudioSystem.js'),'utf8'),context,{filename:'AudioSystem.js'});
const au=win.OasisAudio;
assert(au, 'global manager exists');
assert.strictEqual(playCount,0,'no autoplay before user gesture');
au.attach();au.attach();
assert.strictEqual(events.pointerdown.length,1,'event listeners only bind once');
assert.strictEqual(playCount,0,'attach does not trigger playback');
for(const fn of events.pointerdown) fn();
assert.strictEqual(playCount,0,'no background audio after interaction');
au.play('plant');
assert.strictEqual(au.activeFX.plant.length,1);
assert.strictEqual(playCount,1);
assert.strictEqual(au.activeFX.plant[0].volume,au.volume*.46);
au.setPhase('night');
au.setVolume(.30);
assert.strictEqual(au.volume,.30);
assert.strictEqual(JSON.parse(store['oasis_audio_v1']).volume,.30);
au.setAmbience(false);
assert.equal(Object.keys(au.loops).length,0);
const before = playCount;
au.play('harvest');
assert.strictEqual(playCount,before+1, 'SFX still works with atmosphere off');
au.setEnabled(false);
const muted=playCount;
au.play('coin');
assert.strictEqual(playCount,muted,'mute prevents all SFX');
assert.strictEqual(el('sound-toggle').attrs['aria-pressed'],'false');
au.setEnabled(true);au.setAmbience(true);
doc.hidden=true;
for(const fn of events.visibilitychange) fn();
const hiddenCount=playCount;au.play('collect');assert.strictEqual(playCount,hiddenCount,'no SFX when hidden');
doc.hidden=false;for(const fn of events.visibilitychange) fn();
assert.strictEqual(au.enabled,true);
assert.strictEqual(au.ambience,true);
assert.strictEqual(au.volume,.30);
// Simulate DOM controls as an ordinary user would.
el('sound-open-settings').handlers.click();
assert.strictEqual(el('sound-settings').hidden,false,'gear reveals settings');
el('sound-volume').value='45';el('sound-volume').handlers.input();
assert.strictEqual(au.volume,.45,'slider applies volume');
el('sound-ambience').checked=false;el('sound-ambience').handlers.change();
assert.strictEqual(au.ambience,false,'ambience checkbox works');
el('sound-toggle').handlers.click();
assert.strictEqual(au.enabled,false,'mute button works');
el('sound-toggle').handlers.click();
assert.strictEqual(au.enabled,true,'unmute button works');
el('sound-settings-close').handlers.click();
assert.strictEqual(el('sound-settings').hidden,true,'settings close button works');

// Reinitialization must restore preferences, not mix with game-save key.
const restore={window:{},Audio:MockAudio,document:doc,localStorage:context.localStorage};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/core/AudioSystem.js'),'utf8'),restore);
assert.strictEqual(restore.window.OasisAudio.volume,.45);
assert.strictEqual(restore.window.OasisAudio.ambience,false);
au.setAmbience(true);au.setContext('farm');assert(!au.loops.water_loop.paused);au.setContext('market');assert(au.loops.water_loop.paused);assert(!au.loops.market_loop.paused);au.setContext('menu');assert(au.loops.market_loop.paused);
console.log('PASS audio: approved local assets, no autoplay, unlock, game SFX, mute, volume, ambience, phase, tab visibility, persistence');