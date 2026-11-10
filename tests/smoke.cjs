'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path').resolve(__dirname,'..')+'/';
let store={};const elements={};const groups={};
function element(id){return elements[id]??=({id,hidden:true,textContent:'',style:{},dataset:{},children:[],classList:{toggle(){},add(){}},addEventListener(name,fn){this.handlers??={};(this.handlers[name]??=[]).push(fn)},click(){(this.handlers?.click||[]).forEach(fn=>fn({target:this}))},append(...xs){this.children.push(...xs)},querySelector(q){return this.children.find(c=>'.'+c.className===q)},setAttribute(){},get valueAsNumber(){return this.value===''?NaN:Number(this.value)},replaceChildren(){this.children=[]},set disabled(v){this._disabled=v},get disabled(){return this._disabled}});}
for(const [selector,ids] of Object.entries({
 '#toolbar button':['build','inventory','quests','market'],
 '#build-menu-actions button':['canal','buildings','upgrades','cancel'],
 '.market-stall':['produce','seeds','orders','tools','sadaka'],
 '#map-controls button':['in','out','reset']
}))groups[selector]=ids.map(id=>{const el=element('button-'+id);if(selector==='#toolbar button')el.dataset.action=id;else if(selector==='#build-menu-actions button')el.dataset.build=id;else if(selector==='.market-stall')el.dataset.stall=id;else el.dataset.map=id;return el;});
const context={console,Date,Math,Set,Array,Object,JSON,Number,window:{},localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},document:{getElementById:element,querySelectorAll:q=>groups[q]||[],createElement:tag=>element('new-'+tag+'-'+Math.random())},Phaser:{Scene:class{constructor(){}},Scale:{}}};
vm.createContext(context);require('./dom_currency_fixture.cjs')(context);
for(const f of ['js/config.js','js/core/GameState.js','js/core/SaveSystem.js','js/core/TimeSystem.js','js/core/ProgressionSystem.js','js/core/EconomySystem.js','js/core/DailyQuestSystem.js','js/scenes/MainScene.js'])vm.runInContext(fs.readFileSync(path+f,'utf8'),context,{filename:f});
Object.assign(context,context.window);
let scene=new (vm.runInContext('MainScene',context))();
scene.s=context.OasisGameState.createNew();scene.g=new Proxy({}, {get:()=>()=>{}});scene.scale={width:1200,height:800};
const sound=[];scene.audio={play:name=>sound.push(name),setPhase:()=>{}};scene.notify=function(msg){this.lastNotice=msg};scene.render();
function tap(i){let cell=scene.cells.find(c=>c.i===i);assert(cell,'cell '+i+' not found');scene.onMapTap({x:cell.x,y:cell.y});}
function pick(id){const rows=element('picker-items').children;const row=rows.find(x=>x.children?.[0]?.textContent?.includes(context.OASIS_CONFIG.crops[id].title));assert(row,'seed row '+id);row.children[1].click();}
let initialCoins=scene.s.coins;
tap(120);assert.strictEqual(element('picker').hidden,false,'empty cell must open picker');pick('clover');
assert.strictEqual(scene.s.tiles[120].crop,'clover');assert.strictEqual(scene.s.coins,initialCoins,'planting must cost seeds not coins');
scene.s.tiles[120].plantedAt-=180000;tap(120);assert.strictEqual(scene.s.seedBank.clover,3);assert.strictEqual(scene.s.inventory.clover,2);
scene.openMarket('seeds');assert.strictEqual(element('market-screen').hidden,false,'bazaar must occupy separate screen');
let seedRow=element('market-items').children.find(x=>x.children?.[0]?.children?.[0]?.textContent?.includes('Клевер'));
assert(seedRow);seedRow.children[1].children[0].click();assert.strictEqual(scene.s.seedBank.clover,4);
scene.closeMarket();assert.strictEqual(element('market-screen').hidden,true);
scene.s.tool='canal';tap(120);assert(scene.s.tiles[120].canal);scene.s.tool='plant';
scene.s.coins=300;scene.s.selectedBuilding='sheep';scene.s.tool='building';tap(136);assert.strictEqual(scene.s.tiles[136].building,'sheep');
scene.s.inventory.clover=10;scene.openFarm(136);element('farm-actions').children.at(-1).click();assert(scene.s.tiles[136].productionAt>0);assert.strictEqual(scene.s.inventory.clover,7);
scene.s.tiles[136].productionAt=Date.now()-1;scene.openFarm(136);element('farm-actions').children.at(-1).click();assert.strictEqual(scene.s.inventory.wool,2);
scene.openMarket('produce');let product=element('market-items').children.find(x=>x.children?.[0]?.children?.[0]?.textContent?.includes('Шерсть'));
assert(product);product.children[1].children[2].click();assert.strictEqual(scene.s.inventory.wool,1);
scene.s.totalSold=1850;scene.s.coins=1000;scene.openMarket('seeds');
let fig=element('market-items').children.find(x=>x.children?.[0]?.children?.[0]?.textContent?.includes('Инжир'));fig.children[1].children[0].click();scene.closeMarket();
tap(104);pick('fig');assert.strictEqual(scene.s.tiles[104].crop,'fig');scene.s.tiles[104].plantedAt-=800000;tap(104);assert.strictEqual(scene.s.tiles[104].crop,'fig');
scene.openMarket('orders');const order=scene.s.orders[0];scene.s.inventory[order.id]=order.quantity;scene.renderMarketTab('orders');const oldCompleted=scene.s.ordersCompleted;element('market-items').children[0].children[1].children[0].click();assert.strictEqual(scene.s.ordersCompleted,oldCompleted+1);
scene.closeMarket();scene.openStorage();assert(element('storage-items').children.length>=22);
scene.s.stats.planted=1;scene.renderQuests();element('quests-list').children.find(row=>row.children?.[0]?.textContent?.includes('Посади первое растение')).children[1].click();assert(scene.s.claimedQuests.includes(0));
scene.openUpgrades();assert(!element('upgrade-items').children[0].children[1], 'farm tools must be read-only');scene.openMarket('tools');const price=context.OasisProgression.toolPrice(scene.s,'rake');assert(price>0);element('market-items').children[0].children[1].children[0].click();assert(scene.s.tools.rake===2,'market workshop upgrades tool');
scene.changeZoom(1.5);assert(scene.mapZoom>1);scene.input={pointer1:{isDown:true,x:200,y:200},pointer2:{isDown:false}};
const before=scene.s.stats.planted;scene.beginMapPointer({id:1,x:200,y:200});scene.moveMapPointer({id:1,x:260,y:240});scene.endMapPointer({id:1,x:260,y:240});assert.strictEqual(scene.s.stats.planted,before,'drag must not plant');
scene.input.pointer1={isDown:true,x:100,y:100};scene.input.pointer2={isDown:true,x:200,y:100};scene.beginMapPointer({id:2,x:200,y:100});let z=scene.mapZoom;scene.input.pointer2.x=250;scene.moveMapPointer({id:2,x:250,y:100});assert(scene.mapZoom>=z);scene.endMapPointer({id:2,x:250,y:100});
const sprite={texture:{key:'art-dates-ripe'},setOrigin(){return this},setDepth(){return this},setDisplaySize(){return this},setPosition(){return this},setVisible(){return this},setTint(){return this},clearTint(){return this},setTexture(k){this.texture.key=k;return this}};
scene.add={image:(x,y,k)=>{sprite.texture.key=k;return sprite}};scene.textures={exists:()=>true};assert(scene.renderArtwork(90,{crop:'dates',plantedAt:Date.now()-1000000},100,100,40,20));
for(const name of ['plant','harvest','canal','build','coin','upgrade','quest','collect'])assert(sound.includes(name),'missing sound '+name);
console.log('PASS: context planting, free seeds, full-screen market, seed shop, building, animals behind doors, produce sale, perennial, orders, storage, quest, upgrade, camera, art, audio');
