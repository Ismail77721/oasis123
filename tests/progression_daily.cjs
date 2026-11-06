const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..'),ctx={window:{},Math,Date,Array,Object,Set,Number};vm.createContext(ctx);
for(const file of ['js/config.js','js/core/ProgressionSystem.js','js/core/GameState.js','js/core/DailyQuestSystem.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});Object.assign(ctx,ctx.window);
const S=ctx.OasisGameState,P=ctx.OasisProgression,D=ctx.OasisDailyQuests;
const s=S.createNew();assert.equal(P.level(s),1);assert.equal(P.maxWater(s),10);assert.equal(P.canalPrice(s),4);assert.equal(P.irrigationRadius(s),1);
assert.equal(P.level({...s,totalSold:79}),1);assert.equal(P.level({...s,totalSold:80}),2);assert.equal(P.level({...s,totalSold:30000}),20);
let last=0;for(let i=1;i<=9;i++){const cost=P.toolPrice(s,'spade');assert(cost>last);last=cost;s.coins=cost;assert(P.upgrade(s,'spade').ok);assert.equal(s.tools.spade,i+1);}
assert.equal(P.rank(s,'spade'),10);assert.equal(P.toolPrice(s,'spade'),null);assert(!P.upgrade(s,'spade').ok);assert.equal(P.irrigationRadius(s),3);assert.equal(P.canalPrice(s),1);
s.coins=99999;for(let i=0;i<9;i++)assert(P.upgrade(s,'bucket').ok);assert.equal(P.maxWater(s),28);
let normalized=S.normalize(JSON.parse(JSON.stringify(s)));normalized.water=20;normalized=S.normalize(normalized);assert.equal(normalized.water,20,'save should retain upgraded water');
let old=S.normalize({coins:50,water:7,upgrades:{harvest:5,irrigation:3},tiles:[],stats:{planted:2}});assert.equal(old.tools.rake,9);assert.equal(old.tools.spade,5);assert.equal(old.coins,50);
const a=new Date('2026-11-02T10:00:00').getTime(),b=new Date('2026-11-03T10:00:00').getTime();const q=D.overview(s,a);assert.equal(q.length,3);assert(q.every(x=>x.progress===0));
const task=q[0];if(task.id==='sales')s.totalSold=task.goal;else if(task.id==='orders')s.ordersCompleted=task.goal;else s.stats[task.id]=task.goal;
const updated=D.overview(s,a);assert.equal(updated[0].progress,task.goal);const before=s.coins;assert(D.claim(s,0,a).ok);assert.equal(s.coins,before+task.reward);assert(!D.claim(s,0,a).ok);
const next=D.overview(s,b);assert.equal(next.length,3);assert.equal(next[0].claimed,false);assert.equal(next[0].progress,0);assert.notEqual(s.dailyQuests.date,D.key(a));
console.log('PASS: 20 levels, 10 tool ranks, prices, canal discounts, irrigation, water capacity, old saves, daily quest rotation, no duplicate claims');
