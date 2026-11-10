const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),elements={},store={},groups={};
function el(id){return elements[id]??={id,tagName:'DIV',textContent:'',value:'',checked:false,hidden:true,dataset:{},style:{},children:[],classList:{toggle(){}},handlers:{},addEventListener(kind,fn){(this.handlers[kind]??=[]).push(fn)},click(){(this.handlers.click||[]).forEach(fn=>fn({target:this}))},replaceChildren(){this.children=[]},append(...v){this.children.push(...v)}};}
for(const id of ['male','female'])el('gender-'+id).value=id;el('gender-male').checked=true;
const doc={getElementById:el,querySelectorAll:()=>[],querySelector:q=>q.includes('[data-build=')?null:q==='input[name="player-gender"]:checked'?(['male','female'].map(x=>el('gender-'+x)).find(x=>x.checked)||null):q.includes('value="female"')?el('gender-female'):el('gender-male'),addEventListener(){},createElement:t=>el('generated-'+t+'-'+Math.random())};
const c={window:{},document:doc,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},console,Math,Date,Number,Array,Set,Object,JSON,Phaser:{Scene:class{constructor(){}},Scale:{}}};vm.createContext(c);require('./dom_currency_fixture.cjs')(c);
for(const file of ['js/config.js','js/core/ProgressionSystem.js','js/core/GameState.js','js/core/SaveSystem.js','js/core/TimeSystem.js','js/core/EconomySystem.js','js/core/DailyQuestSystem.js','js/scenes/MainScene.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c,{filename:file});Object.assign(c,c.window);
const scene=new (vm.runInContext('MainScene',c))();
const graphic=new Proxy({setDepth(){return this}},{get(target,k){return target[k]||(()=>{})}});
scene.add={graphics:()=>graphic};scene.input={on(){}};scene.scale={width:1000,height:700,on(){}};scene.time={addEvent(){}};
scene.create();assert.equal(el('start-menu').hidden,false,'scene should open main menu at startup');

assert.equal(el('menu-continue').hidden,true);el('menu-new').click();assert.equal(el('profile-screen').hidden,false);
el('profile-name').value='Марьям';el('gender-male').checked=false;el('gender-female').checked=true;el('profile-start').click();
assert.equal(scene.s.profile.name,'Марьям');assert.equal(scene.s.profile.gender,'female');assert.equal(el('live-guide').hidden,false);assert(el('guide-mentor').textContent.includes('Аиша'));
for(let i=0;i<8;i++)el('guide-next').click();assert.equal(scene.s.tutorialDone,true);assert.equal(el('live-guide').hidden,true);assert(store[c.OASIS_CONFIG.storageKey]);
scene.openMainMenu();assert.equal(el('menu-continue').hidden,false);assert(el('menu-greeting').textContent.includes('Марьям'));
el('menu-continue').click();assert.equal(el('start-menu').hidden,true);assert.equal(el('live-guide').hidden,true);
scene.openUpgrades();assert.equal(el('upgrade-items').children.length,6);assert.equal(el('upgrades').hidden,false);el('upgrades-back').click();assert.equal(el('upgrades').hidden,true);assert.equal(el('build-menu').hidden,false);
scene.openBuildings();assert.equal(el('buildings').hidden,false);el('buildings-back').click();assert.equal(el('build-menu').hidden,false);
scene.openMarket('tools');assert.equal(scene.marketOpen,true);scene.goBack();assert.equal(scene.marketOpen,false);
scene.openMainMenu();el('menu-new').click();el('profile-name').value='Амин';el('gender-female').checked=true;el('profile-start').click();assert.equal(el('profile-error').textContent.includes('Подтверди'),true);assert.equal(scene.s.profile.name,'Марьям');
el('confirm-new').checked=true;el('profile-start').click();assert.equal(scene.s.profile.name,'Амин');assert.equal(scene.s.totalSold,0);
console.log('PASS: menu, profile choice, female text-only mentor, onboarding, continue, back navigation, tools read-only, separate workshop, new-game confirmation');
