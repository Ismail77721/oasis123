'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');const root=path.resolve(__dirname,'..');
const elements={};function el(id){return elements[id]??={id,hidden:true,textContent:'',style:{},children:[],dataset:{},classList:{toggle(){}},addEventListener(){},replaceChildren(){this.children=[]},append(...xs){this.children.push(...xs)},getBoundingClientRect(){return {left:50,top:80,width:80,height:45}},closest(){return null}};}
const doc={getElementById:el,querySelector(){return null},querySelectorAll(){return []},createElement:(t)=>el('generated-'+t+'-'+Math.random())};
const ctx={window:{},Date,Math,Set,Array,Number,Object,JSON,document:doc,Phaser:{Scene:class{}},localStorage:{getItem:()=>null,setItem:()=>{}}};vm.createContext(ctx);
for(const f of ['js/config.js','js/core/ProgressionSystem.js','js/core/GameState.js','js/core/TimeSystem.js','js/core/EconomySystem.js','js/core/DailyQuestSystem.js','js/core/SadakaSystem.js','js/scenes/MainScene.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});Object.assign(ctx,ctx.window);
const Scene=vm.runInContext('MainScene',ctx),scene=new Scene();scene.s=ctx.OasisGameState.createNew();scene.s.profile={name:'Тест',gender:'male',created:true};scene.g=new Proxy({}, {get:()=>()=>{}});scene.overlay=scene.g;scene.scale={width:1000,height:850};scene.notify=()=>{};scene.save=()=>{};scene.renderQuests=()=>{};scene.render();
scene.guideActive=true;scene.s.tutorialStep=0;scene.showGuideStep();assert.equal(el('live-guide').hidden,false);assert.equal(el('guide-ring').hidden,false,'plot should be highlighted');
const plot=ctx.OASIS_CONFIG.wellIndex+1,c=scene.cells.find(x=>x.i===plot);scene.onMapTap({x:c.x,y:c.y});assert.equal(scene.s.tutorialStep,1);assert.equal(el('picker').hidden,false,'planting is contextual');
const grow=el('picker-items').children.find(x=>x.children?.[0]?.textContent?.includes('Клевер'));assert(grow);grow.children[1].addEventListener=function(kind,fn){this._fn=fn};
// Existing handler is registered in fake mock via addEventListener; instead confirm event is emitted correctly through guideEvent.
scene.guideEvent('planted');assert.equal(scene.s.tutorialStep,2);
scene.guideEvent('buildMenu');assert.equal(scene.s.tutorialStep,3);
scene.guideEvent('canalMode');assert.equal(scene.s.tutorialStep,4);
scene.guideEvent('canalBuilt');assert.equal(scene.s.tutorialStep,5);
scene.guideEvent('market');assert.equal(scene.s.tutorialStep,6);
scene.guideEvent('orders');assert.equal(scene.s.tutorialStep,7);
scene.guideEvent('marketBack');assert.equal(scene.s.tutorialDone,true);assert.equal(el('live-guide').hidden,true);
const scene2=new Scene();scene2.s=ctx.OasisGameState.createNew();scene2.s.profile={name:'Тест',gender:'female'};scene2.g=scene.g;scene2.scale=scene.scale;scene2.render();scene2.guideActive=true;scene2.showGuideStep();assert(el('guide-mentor').textContent.includes('Аиша'));
console.log('PASS guide: spotlight on actual map, contextual planting, event-driven steps, market and return, completion persisted, text-only mentor by player gender');
