'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{},console,Math,Date,Number,JSON,Array,Set,Map,Intl};
vm.createContext(ctx);
function load(f){vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});Object.assign(ctx,ctx.window);}
for(const f of ['js/config.js','js/core/ProgressionSystem.js','js/core/GameState.js','js/core/TimeSystem.js','js/core/EconomySystem.js','js/core/DailyQuestSystem.js','js/core/SadakaSystem.js','js/core/LandFamilySystem.js','js/core/FarmSystems.js'])load(f);
const F=ctx.OasisFarmSystems,E=ctx.OasisEconomy,G=ctx.OasisGameState,C=ctx.OASIS_CONFIG,L=ctx.OasisFamilyLand;
let s=G.createNew();F.ensure(s);assert(s.workers.gardener&&!s.workers.gardener.hired);
assert.equal(C.dayMinutes,60);assert.equal(C.nightMinutes,60);
// No automatic sadaqa, no hidden sale bonus. Price is exact even after charity.
s.barakatLevel=12;s.coins=100;s.hiddenSadaqaTotal=11;
assert.equal(E.receiveIncome(s,50).net,50);assert.equal(s.coins,150);assert.equal(s.hiddenSadaqaTotal,11);
s.inventory.watermelon=3;assert.equal(E.sell(s,'watermelon',3).net,12);
// Removal cannot conjure new crops or money; returns exactly one seed.
const i=45,now=Date.now();assert(E.plant(s,i,'clover',now).ok);
const before=s.seedBank.clover;assert.equal(F.uproot(s,i).returned,1);assert.equal(s.seedBank.clover,before+1);assert.equal(s.tiles[i].crop,null);
assert.equal(F.uproot(s,i).ok,false);s.tiles[46].canal=true;assert(F.dismantle(s,46).ok);assert(!s.tiles[46].canal);
// Network disconnected => timer is paused, without water-resource consumption.
assert(E.plant(s,i,'clover',1000).ok);s.tiles[i].lastIrrigationTick=1000;
F.updateIrrigation(s,()=>false,51000);assert.equal(s.tiles[i].plantedAt,51000);assert.equal(s.water,10);
F.updateIrrigation(s,()=>true,61000);assert.equal(s.tiles[i].plantedAt,51000,'connected growth must resume');
// Worker actually travels to a ready plot, and harvests products.
s.tiles[i].plantedAt=1000;s.tiles[i].lastIrrigationTick=now;
s.coins=2000;let hired=F.hire(s,'collector',now);assert(hired.ok);let w=s.workers.collector;
let first=F.tick(s,()=>true,now+1000);assert(w.state==='travel');assert.equal(w.target,i);
const finish=F.tick(s,()=>true,w.endsAt+1);assert(finish.completed.some(x=>x.action==='harvest'));
assert.equal(s.tiles[i].crop,null);assert(s.inventory.clover>=2);
// Gardener starts planting from seed stock. No human sprites are required.
assert(F.hire(s,'gardener',now).ok);const planted=F.tick(s,k=>k===48,now+5000);assert.equal(s.workers.gardener.state,'travel');
const jobIndex=s.workers.gardener.target;const jobEnd=s.workers.gardener.endsAt;
const resolved=F.tick(s,k=>k===48,jobEnd+1);assert(resolved.completed.some(x=>x.action==='plant'));assert(s.tiles[jobIndex].crop);
// In-game educational zakat: 355 two-hour days above symbolic threshold.
const a=G.createNew();a.coins=12000;let result=F.zakatStatus(a,1000000);assert(result.eligible&&!result.due);
result=F.zakatStatus(a,1000000+354*F.dayMS());assert(!result.due);
result=F.zakatStatus(a,1000000+355*F.dayMS()+1);assert(result.due);assert.equal(result.amount,300);
const paid=F.payZakat(a,1000000+355*F.dayMS()+1);assert(paid.ok);assert.equal(a.coins,11700);assert(!F.zakatStatus(a,1000000+355*F.dayMS()+100).due);
const r=G.normalize(JSON.parse(JSON.stringify(s)));F.ensure(r);assert.equal(r.workers.collector.hired,true);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const scene=fs.readFileSync(path.join(root,'js/scenes/SceneV180.js'),'utf8');
assert.equal((html.match(/class="market-stall"/g)||[]).length,5,'Five clickable market buildings');
assert(html.includes('id="crop-info"')&&html.includes('id="market-counter-back"'));
assert(!html.includes('Семена не продаются вместе с урожаем'));
assert(!html.includes('id="tutorial-replay" type="button" class="replay-guide"'));
assert(scene.includes('longPressTimer')&&scene.includes('swipeActive')&&scene.includes('ОАЗИС v1.8'));
assert(!html.includes('🤲 Баракат'));
assert(fs.existsSync(path.join(root,'assets/audio/market_ambience.mp3')));
console.log('PASS v1.8: exact prices, no water use, irrigation pause, removal, real worker tasks and path, educational zakat, plaza/card/gesture markup, migrated workers');
