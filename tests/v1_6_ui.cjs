'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');const elements=new Map();
let counter=0;
function make(tag='div',id=''){
 let v={tagName:tag.toUpperCase(),id,hidden:true,children:[],textContent:'',className:'',style:{},dataset:{},handlers:{},
  append(...nodes){this.children.push(...nodes)},replaceChildren(...nodes){this.children=[...nodes]},
  addEventListener(event,fn){(this.handlers[event]||=[]).push(fn)},click(){for(const fn of this.handlers.click||[])fn({target:this})},
  classList:{toggle(){},add(){},remove(){}},set disabled(x){this._disabled=!!x},get disabled(){return !!this._disabled}
 };
 return v;
}
function el(id){if(!elements.has(id))elements.set(id,make('div',id));return elements.get(id);}
let selectors={'.market-stall':['produce','seeds','orders','tools','sadaka'].map(id=>{const n=el('stall-'+id);n.dataset.stall=id;return n;}),'#toolbar button':[]};
const doc={getElementById:el,createElement(tag){return make(tag,tag+'-'+(++counter))},querySelectorAll(q){return selectors[q]||[]}};
const C={window:{},console,Math,Date,Number,JSON,Array,Set,Map,Intl,document:doc,Phaser:{Scene:class{constructor(){}}}};
vm.createContext(C);require('./dom_currency_fixture.cjs')(C);
for(const f of ['js/config.js','js/core/ProgressionSystem.js','js/core/GameState.js','js/core/TimeSystem.js','js/core/EconomySystem.js','js/core/DailyQuestSystem.js','js/core/SadakaSystem.js','js/core/LandFamilySystem.js','js/scenes/MainScene.js','js/scenes/SceneV160.js']){
 vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),C,{filename:f});Object.assign(C,C.window);
}
const scene=vm.runInContext('new MainScene()',C),s=C.OasisGameState.createNew();scene.s=s;
scene.g=new Proxy({}, {get(){return function(){}}});scene.overlay=scene.g;scene.scale={width:1280,height:800};scene.audio={play(){},setPhase(){}};scene.notify=function(text){this.message=text};scene.save=function(){};scene.renderQuests=function(){};
// Three proper sections, not a single mixed warehouse.
scene.openStorage();assert.equal(el('storage-items').children.length,3);assert.deepEqual(el('storage-items').children.map(g=>g.children[0].textContent),['🌱 Семена и саженцы','🧺 Сырьё','📦 Готовая продукция']);
// HUD replaces old game title with level + resources and no visible barakat.
scene.render();assert(el('family-hud').textContent.includes('Каналы'));assert(!el('family-hud').textContent.includes('Баракат'));
// Interact with the house on the map; show needs, upgrades and land.
const ids=C.OasisFamilyLand.footprint(s),c=scene.cells.find(v=>v.i===ids.at(-1));assert(c);
scene.onMapTap({x:c.x,y:c.y});assert.equal(el('home-panel').hidden,false,'tap house must open home');
assert(el('home-family').children.length>0);assert(el('home-land').children.length>0);assert(el('home-upgrades').children.length>0);
const upgrades=el('home-upgrades').children[0],land=el('home-land').children[0];
assert(upgrades.children.some(x=>x.tagName==='BUTTON'));assert(land.children.some(x=>x.tagName==='BUTTON'));
// Purchase land by clicking the actual generated UI button.
s.coins=9999;scene.renderHome();let btn=el('home-land').children[0].children.find(x=>x.tagName==='BUTTON');btn.click();
assert.equal(scene.s.worldSize,20);assert.equal(el('home-land').children[0].children.at(-1).textContent.includes('24×24'),true);
scene.closeHome();assert(el('home-panel').hidden);
// Orders: displayed composite text and buttons, no duplicated generic watermelon.
s.totalSold=1000000;scene.renderMarketTab('orders');assert.equal(el('market-items').children.length,6);
const names=el('market-items').children.map(row=>row.children[0].children[0].textContent);
assert(names.some(x=>x.includes(' + ')),'composite order not visible');assert.equal(new Set(names).size,6);
// Sadaqa UI must pass request.id and open custom acknowledgement window.
scene.renderMarketTab('sadaka');const row=el('market-items').children[0];assert(row.children[1].children[0].handlers.click.length);
row.children[1].children[0].click();assert.equal(el('reply-modal').hidden,false,'success must open blessing window');
assert(el('reply-modal-text').textContent.includes('Аллах'));assert(!el('market-message').textContent.includes('не найдена'));
console.log('PASS v1.6 UI: 4x4 home tap, home windows, land UI button, warehouse sections, top bar, composite orders, sadaka response modal');
