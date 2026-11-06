'use strict';
const assert=require('node:assert/strict');const fs=require('fs');const vm=require('vm');const path=require('path');
const root=path.resolve(__dirname,'..'),box={window:{},Date,Math,Set,Array,Number,Object,JSON};vm.createContext(box);
for(const f of ['js/config.js','js/core/ProgressionSystem.js','js/core/GameState.js','js/core/TimeSystem.js','js/core/EconomySystem.js','js/core/DailyQuestSystem.js','js/core/SadakaSystem.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),box,{filename:f});Object.assign(box,box.window);
const E=box.OasisEconomy,G=box.OasisGameState,S=box.OasisSadaka,C=box.OASIS_CONFIG;
const s=G.createNew();assert.equal(C.worldSize,16);assert.equal(s.tiles.length,256);assert.equal(C.wellIndex,119);
let old=Array.from({length:100},()=>({crop:null,canal:false}));old[44]={crop:null,canal:false};old[45]={crop:null,canal:true};old[55]={building:'sheep',productionAt:Date.now()+120000};old[32]={crop:'pomegranate',plantedAt:Date.now()-30000};
let migrated=G.normalize({tiles:old,coins:117,water:4,seedBank:{clover:5},barakatLevel:3,inventory:{wool:12},tools:{rake:5}});
assert.equal(migrated.tiles[120].canal,true,'existing canal remains adjacent to well');assert.equal(migrated.tiles[136].building,'sheep','building survives map expansion');assert.equal(migrated.tiles[6*16+5].crop,'pomegranate','old crop preserved spatially');assert.equal(migrated.tiles.length,256);assert.equal(migrated.inventory.wool,12);assert.equal(migrated.barakatLevel,3);
const round=G.normalize(JSON.parse(JSON.stringify(migrated)));assert.equal(round.tiles[136].building,'sheep','no repeated migration');assert.equal(round.tiles[120].canal,true);
for(const id of ['olive','sidr','cumin','flowers','barley','wheat']){
 assert(C.crops[id],id+' crop missing');assert.equal(s.inventory[id],0);assert.equal(s.seedBank[id],0);
 s.totalSold=100000;s.coins=2000;assert(E.buySeed(s,id,2).ok,'can buy '+id);const idx=80+Object.keys(C.crops).indexOf(id);assert(E.plant(s,idx,id,Date.now()-C.crops[id].growSeconds*1000-1000).ok,'plant '+id);
 const out=E.harvest(s,idx,Date.now());assert(out.ok,'harvest '+id);assert(s.inventory[id]>0,'inventory '+id);
 if(C.crops[id].type==='perennial')assert.equal(s.tiles[idx].crop,id,'tree stays after harvest '+id);
 else assert.equal(s.tiles[idx].crop,null,'annual clears after harvest '+id);
}
for(const building of ['apiary','oilpress','olivepress']){const b=box.OASIS_BUILDINGS[building];assert(b&&s.inventory[b.product]===0,'building and product '+building);}
s.tiles[150].building='apiary';s.tiles[151].building='oilpress';s.tiles[152].building='olivepress';s.orders=[];E.ensureOrders(s);assert.equal(s.orders.length,6);
for(const order of s.orders){const crop=C.crops[order.id],building=Object.values(box.OASIS_BUILDINGS).find(b=>b.product===order.id),price=crop?.sellPrice||building?.price;assert(price&&order.reward>=order.quantity*price*1.59,'order must be profitable');}
const chosen=s.orders[0];s.inventory[chosen.id]=chosen.quantity;const result=E.completeOrder(s,0);assert(result.ok&&result.net>0);
const before=s.coins;const request=S.list(s).find(q=>q.coins===15);assert(request&&!request.done);const donated=S.donate(s,request.id);assert(donated.ok);assert(s.coins<before&&s.barakatPoints>0);assert(!S.donate(s,request.id).ok,'one request per day');
for(const item of S.list(s).filter(q=>q.coins&&!q.done)){s.coins+=item.coins;assert(S.donate(s,item.id).ok);}
assert(s.barakatLevel>=1);const prior=s.coins;const inc=E.receiveIncome(s,100);assert(inc.ok&&inc.net===100&&inc.barakatBonus===0,'sale is exact without automatic sadaqa');assert.equal(s.coins,prior+100);
const product=Object.values(box.OASIS_BUILDINGS).find(b=>b.product==='honey');s.inventory.honey=3;assert(E.sell(s,'honey',2).ok,'honey sale');assert.equal(s.inventory.honey,1);
assert.equal(S.localDay(new Date('2026-11-02T12:00:00').getTime()).length,10);
const code=fs.readFileSync(path.join(root,'js/scenes/MainScene.js'),'utf8');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const css=fs.readFileSync(path.join(root,'css/v1.4.css'),'utf8');
assert(code.includes('drawFence(')&&code.includes('setupLiveGuide()')&&code.includes("stall==='sadaka'"));
assert(html.includes('id="guide-ring"')&&html.includes('id="live-guide"')&&html.includes('data-stall="sadaka"'));
assert(html.includes('Мужской')&&html.includes('Женский')&&!html.includes('Мужчина · советник'));
assert(html.includes('id="quests-close" type="button" aria-label="Закрыть задания">✕'));
assert(css.includes('#market-screen .market-stalls{position:relative')&&css.includes('grid-template-rows:auto'));
assert.equal(C.crops.sidr.type,'perennial');
console.log('PASS v1.4: 16x16 migration, six crops, repeat harvest, 3 new productions, 6 premium orders, sadaqa, barakat, honey sales, real-time guide markup, market art visibility, profile labels and quest close');
