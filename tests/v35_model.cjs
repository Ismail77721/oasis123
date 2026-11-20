const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.resolve(__dirname,'..'),c={console,Date,performance,TextEncoder,crypto:require('crypto').webcrypto,localStorage:{getItem:()=>null,setItem(){}},document:{documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>0})};c.window=c;vm.createContext(c);
for(const f of ['config','core/GameState','core/ProgressionSystem','core/EconomySystem','core/TimeSystem','core/SadakaSystem','core/LandFamilySystem','core/FarmSystems','core/MapLayout','core/GeometryV220','core/WellV230','core/PlayLimit','core/WorldV300','core/WorkerV300','core/WorldV310','core/WorldV320','core/CartoonAssets','core/ContentV350'])vm.runInContext(fs.readFileSync(root+'/js/'+f+'.js','utf8'),c,{filename:f});
const G=c.OasisGameState,E=c.OasisEconomy,F=c.OasisFarmSystems,S=c.OasisSadaka,L=c.OasisMapLayout,W=c.OasisWorld,now=Date.now();let s=G.createNew();s.createdAt=now-1000;s.coins=10000;s.selectedCrop='olive';F.ensure(s);s.workers.gardener={hired:true,state:'idle',paidAt:now,dayOffUntil:0};s.workerClock=now;s.workerPlan.plantCrops=['watermelon'];s.workerPlan.harvestCrops=[];s.seedBank.watermelon=10;F.tick(s,()=>true,now+20000);assert(s.tiles.some(t=>t.crop==='watermelon'));assert.equal(s.selectedCrop,'olive');assert(!E.plant(s,s.tiles.length-1,'watermelon',now).ok);console.log('PASS worker keeps player crop selection; planting rejects map edge');
s.workerPlan.plantCrops=[];s.workerPlan.collectBuildings=[];s.workerPlan.feedAnimals=Object.keys(c.OASIS_BUILDINGS);s.water=1000;for(const [id,b] of Object.entries(c.OASIS_BUILDINGS)){const i=s.tiles.findIndex((t,i)=>L.check(s,i,{kind:'building',id}).ok);assert(i>=0);Object.assign(s.tiles[i],{building:id,buildingArea:true});s.inventory[b.feed]=1000;W.invalidate(s);}F.tick(s,()=>true,now+70000);for(const id of Object.keys(c.OASIS_BUILDINGS))assert(s.tiles.find(t=>t.building===id).productionAt>0,id);console.log('PASS worker starts all seven production buildings');
// Unlock all goods for a full catalog cycle without changing production prices.
s.totalSold=1e9;assert.equal(c.OasisContent35.orders.length,20);assert.equal(c.OasisContent35.requests.length,20);
let list=E.ensureOrders(s,now);assert.equal(list.length,15);const before=s.coins;for(const x of list[0].items)s.inventory[x.id]=0;assert(!E.completeOrder(s,0,now).ok);assert.equal(s.coins,before);const o=list[0];for(const x of o.items)s.inventory[x.id]=x.quantity;assert(E.completeOrder(s,0,now).ok);assert.equal(s.coins,before+o.reward);assert(!E.completeOrder(s,0,now).ok);assert(E.ensureOrders(s,now+1000)[0].done);const oldkey=o.key;assert(!E.ensureOrders(s,now+7200000)[0].done);assert(s.orders.every(x=>!x.done));console.log('PASS atomic shipments, exact reward, no double payout, next-day replacement');
let seen=new Set();for(let d=0;d<12;d++){for(const o of E.ensureOrders(s,now+d*2*7200000))seen.add(o.key);}assert.equal(seen.size,20);console.log('PASS all 20 shipment recipes rotate');
S.ensure(s,now);s.charity.campaigns.well.raised=123;const request=S.list(s,now).find(r=>r.items.length);assert(request);for(const x of request.items)(x.category==='seed'?s.seedBank:s.inventory)[x.id]=x.quantity;assert(S.donate(s,request.id,now).ok);assert(!S.donate(s,request.id,now).ok);const saved=G.normalize(JSON.parse(JSON.stringify(s)));assert.equal(S.projects(saved,now).find(p=>p.id==='well').raised,123);assert.equal(saved.ordersVersion35,1);assert(S.list(saved,now).some(r=>r.id===request.id&&r.done));assert(!S.contribute(saved,'well',-1,now).ok);assert(S.contribute(saved,'well',7,now).ok);assert.equal(S.projects(saved,now).find(p=>p.id==='well').raised,130);console.log('PASS saved rotation, donation once, persistent campaign contributions');
// Seed requests deduct the seed bank, not harvested produce.
let seed;for(let d=0;d<20&&!seed;d++){const time=now+d*2*7200000;seed=S.list(saved,time).find(r=>r.items.some(x=>x.category==='seed'));if(seed){const stock={...saved.inventory};for(const x of seed.items)saved.seedBank[x.id]=x.quantity;assert(S.donate(saved,seed.id,time).ok);assert.deepEqual(saved.inventory,stock);}}
assert(seed);console.log('PASS seed/sapling donations use correct inventory');
c.MainScene={prototype:{}};vm.runInContext(fs.readFileSync(root+'/js/scenes/EnvironmentV350.js','utf8'),c);for(const o of c.OasisEnvironment35.objects){const size=c.OasisEnvironment35.maxSide/2;assert(o.r+(o.rows||6)<-size||o.c+(o.cols||6)<-size||o.r>size||o.c>size,JSON.stringify(o));if(o.key==='dates-4')assert.equal(o.rows,2);}console.log('PASS all scenery outside maximum expansion, palms use 2x2 crop size');
const snapshot=G.normalize(JSON.parse(JSON.stringify(s)));
assert.equal(snapshot.orders.length,15);
assert.deepEqual(snapshot.orders.map(x=>x.done),s.orders.map(x=>x.done));
const stockBoard=G.createNew();stockBoard.createdAt=now;
const initial=E.ensureOrders(stockBoard,now);
assert(initial.length<15&&initial.every(o=>o.items.every(x=>c.OASIS_CONFIG.crops[x.id])));
stockBoard.tiles[0].building='mill';
assert.strictEqual(E.ensureOrders(stockBoard,now+1000),initial);
vm.runInContext(fs.readFileSync(root+'/js/core/DailyQuestSystem.js','utf8'),c);
const daily=c.OasisDailyQuests, date=new Date(2026,2,3,12).getTime(), next=date+86400000;
const dailyState=G.createNew();daily.ensure(dailyState,date);
const task=dailyState.dailyQuests.items[0];
const metric={sales:'totalSold',orders:'ordersCompleted'}[task.id];
if(metric)dailyState[metric]=(dailyState[metric]||0)+task.goal;else dailyState.stats[task.id]+=task.goal;
daily.ensure(dailyState,next);assert.equal(dailyState.savedReward36,task.reward);
daily.ensure(dailyState,next);assert.equal(G.normalize(JSON.parse(JSON.stringify(dailyState))).savedReward36,task.reward);
console.log('PASS 3.6 saved 15-slot board, fixed starting offers, reward rollover and reload');
