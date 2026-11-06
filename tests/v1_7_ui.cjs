'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');const elements=new Map();let created=0;
function create(tag='div',id=''){
 return {tagName:tag.toUpperCase(),id,hidden:true,children:[],textContent:'',className:'',dataset:{},style:{},handlers:{},value:'',disabled:false,
  append(...children){this.children.push(...children)},replaceChildren(...children){this.children=[...children]},
  addEventListener(kind,fn){(this.handlers[kind]||=[]).push(fn)},click(){for(const fn of this.handlers.click||[])fn({target:this})},setAttribute(name,value){this[name]=value},
  classList:{toggle(){},add(){},remove(){}}
 };
}
const get=id=>{if(!elements.has(id))elements.set(id,create('div',id));return elements.get(id);};
const marketTabs=['produce','seeds','orders','tools','sadaka'].map(id=>{const n=get('tab-'+id);n.dataset.stall=id;return n;});
const doc={getElementById:get,createElement:t=>create(t,'new-'+(++created)),querySelectorAll:s=>s==='.market-stall'?marketTabs:[]};
const context={window:{},console,Math,Date,Number,JSON,Array,Set,Map,Intl,document:doc,Phaser:{Scene:class{constructor(){}}}};
vm.createContext(context);
for(const f of ['js/config.js','js/core/ProgressionSystem.js','js/core/GameState.js','js/core/TimeSystem.js','js/core/EconomySystem.js','js/core/DailyQuestSystem.js','js/core/SadakaSystem.js','js/core/LandFamilySystem.js','js/scenes/MainScene.js','js/scenes/SceneV160.js','js/scenes/SceneV170.js']){
 vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});Object.assign(context,context.window);
}
const S=context.OasisSadaka,scene=vm.runInContext('new MainScene()',context),state=context.OasisGameState.createNew();
scene.s=state;state.coins=5000;scene.save=function(){this.saved=true};scene.render=function(){};scene.playSound=function(){};scene.notify=function(){};scene.marketNotice=text=>get('market-message').textContent=text;
scene.renderMarketTab('sadaka');
let cards=get('market-items').children;
assert(cards.some(n=>n.className==='charity-heading'));
const firstRequest=cards.find(n=>n.className==='market-product');assert(firstRequest);
const helpButton=firstRequest.children[1].children[0];
helpButton.click();
assert.equal(get('reply-modal').hidden,false);assert(scene.saved,'help not persisted');
const message=get('reply-modal-text').textContent,reply=get('reply-modal-close').textContent;
const matched=S.BLESSINGS.find(b=>b.text===message);assert(matched,'not one of the 4 blessings');assert.equal(reply,matched.reply,'reply must match the blessing');
assert(!get('market-items').children.some(n=>String(n.textContent).includes('Баракат')));
let project=get('market-items').children.find(x=>x.dataset.projectId==='mosque');assert(project,'mosque campaign missing');
let row=project.children.find(x=>x.className==='charity-contribution');assert(row);
const input=row.children[0],donate=row.children[1];input.value='38';donate.click();
assert.equal(S.projects(state)[0].raised,38);
assert.equal(state.coins,5000-15-38);
assert.equal(get('reply-modal').hidden,false);
project=get('market-items').children.find(x=>x.dataset.projectId==='mosque');
assert(project.children.some(x=>x.className==='charity-progress'));
const quick=project.children.find(x=>x.className==='charity-quick').children.find(x=>x.textContent==='50 🪙');quick.click();
assert.equal(S.projects(state)[0].raised,88,'quick donation must be recorded');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(src.includes('SceneV170.js')&&src.includes('v1.7.css'),'new script/style must be loaded');
console.log('PASS v1.7 UI: donation opens matching reply, campaign amount and quick donation, progress, hidden mechanic, script/style linkage');
