(function(){'use strict';
const F=OasisFarmSystems,E=OasisEconomy,C=OASIS_CONFIG,B=OASIS_BUILDINGS;
const ensure=F.ensure;
F.ensure=function(s){ensure(s);const p=s.workerPlan;if(!p.multiVersion){p.plantCrops=p.mode==='harvest'?[]:[p.crop||'clover'];p.harvestCrops=p.mode==='plant'?[]:Object.keys(C.crops);p.collectBuildings=[];p.feedAnimals=[];p.multiVersion=1;p.plantCursor=0;p.taskCursor=0;}
 for(const k of ['plantCrops','harvestCrops','collectBuildings','feedAnimals'])p[k]=[...new Set((Array.isArray(p[k])?p[k]:[]).filter(id=>(k.endsWith('Crops')?C.crops:B)[id]))];
 return s;};
F.jobs.gardener.name='Работник';
function production(s,i,action,now){const t=s.tiles[i],b=B[t?.building];if(!b)return{ok:false};
 if(action==='collect'&&t.productionAt>0&&t.productionAt<=now){const bonus=b.product==='wool'?OasisProgression.woolBonus(s):b.product==='camelMilk'?OasisProgression.milkBonus(s):0;const amount=b.amount+bonus+Math.max(0,(t.buildingLevel||1)-1);s.inventory[b.product]=(s.inventory[b.product]||0)+amount;t.productionAt=0;return{ok:true,amount};}
 if(action==='feed'&&!t.productionAt&&(s.inventory[b.feed]||0)>=b.feedAmount&&s.water>=b.water){s.inventory[b.feed]-=b.feedAmount;s.water-=b.water;t.productionAt=now+b.duration*1000/(1+.1*Math.max(0,(t.buildingLevel||1)-1));return{ok:true};}return{ok:false};}
function choose(s,wet,now){const p=s.workerPlan,allowed=i=>!Array.isArray(p.area)||p.area.includes(i),n=s.tiles.length;
 const kinds=['collect','harvest','feed','plant'];
 for(let k=0;k<4;k++){const action=kinds[((p.taskCursor||0)+k)%4];let job=null;
  if(action==='plant'){
   const seeds=p.plantCrops.filter(id=>(s.seedBank[id]||0)>0&&C.crops[id].unlock<=OasisProgression.level(s));if(seeds.length){const seed=seeds[(p.plantCursor||0)%seeds.length];for(let i=0;i<n;i++)if(allowed(i)&&wet(i)&&OasisMapLayout.check(s,i,{kind:'crop'}).ok){job={index:i,action,seed};break;}}
  }else for(let i=0;i<n;i++){const t=s.tiles[i];if(action==='harvest'&&allowed(i)&&p.harvestCrops.includes(t.crop)&&wet(i)&&OasisTimeSystem.isReady(t,now)){job={index:i,action};break;}
   if(action==='collect'&&p.collectBuildings.includes(t.building)&&t.productionAt>0&&t.productionAt<=now){job={index:i,action};break;}
   if(action==='feed'&&p.feedAnimals.includes(t.building)&&!t.productionAt){const b=B[t.building];if(b&&(s.inventory[b.feed]||0)>=b.feedAmount&&s.water>=b.water){job={index:i,action};break;}}
  }
  if(job){p.taskCursor=(kinds.indexOf(action)+1)%4;return job;}
 }return null;}
function nextEvent(s,t,end){let next=end;for(const x of s.tiles){if(x.crop){const due=x.plantedAt+C.crops[x.crop].growSeconds*1000;if(due>t)next=Math.min(next,due);}if(x.productionAt>t)next=Math.min(next,x.productionAt);}return next;}
F.tick=function(s,wet,now=Date.now()){
 F.ensure(s);const w=s.workers.gardener,p=s.workerPlan;const completed=[];let changed=false;
 if(!w.hired){s.workerClock=now;return{changed,completed};}
 if(p.paused||['canal','building','move','remove'].includes(s.tool)){s.workerClock=now;return{changed,completed};}
 let at=Math.min(now,s.workerClock||now);let count=0;
 while(at<=now&&count++<200){
  if(w.dayOffUntil>at){at=Math.min(now,w.dayOffUntil);if(at<w.dayOffUntil)break;w.paidAt=at;w.dayOffUntil=0;}
  if(at-(w.paidAt||at)>=F.dayMS()){const periods=Math.floor((at-w.paidAt)/F.dayMS()),due=periods*F.jobs.gardener.salary;if(s.coins<due){w.state='paused';w.target=-1;w.paidAt=at;at=now;changed=true;break;}s.coins=Math.round((s.coins-due)*100)/100;w.paidAt+=periods*F.dayMS();changed=true;}
  if(w.state==='paused'){if(s.coins<F.jobs.gardener.salary){at=now;break;}w.state='idle';w.paidAt=at;}
  if(w.state==='return')w.state='idle';
  if(w.state==='travel'){
   if(w.endsAt>now){at=now;break;}at=Math.max(at,w.endsAt);const t=s.tiles[w.target];let r={ok:false};
   if(w.action==='harvest'&&p.harvestCrops.includes(t?.crop)&&wet(w.target))r=E.harvest(s,w.target,at);
   if(w.action==='plant'&&p.plantCrops.includes(w.seed)&&wet(w.target))r=E.plant(s,w.target,w.seed,at);
   if(w.action==='collect'&&p.collectBuildings.includes(t?.building))r=production(s,w.target,'collect',at);
   if(w.action==='feed'&&p.feedAnimals.includes(t?.building))r=production(s,w.target,'feed',at);
   if(r.ok){if(w.action==='plant')p.plantCursor++;completed.push({action:w.action,index:w.target,amount:r.amount||1});}
   w.state='idle';w.from=w.target;w.target=-1;changed=true;
  }
  const job=choose(s,wet,at);
  if(job){Object.assign(w,{state:'travel',target:job.index,seed:job.seed,action:job.action,startedAt:at,endsAt:at+4000});changed=true;if(w.endsAt>now){at=now;break;}}
  else{const next=nextEvent(s,at,now);w.state='idle';w.target=-1;if(next<=at||next===now){at=now;break;}at=next;}
 }
 s.workerClock=at;
 return{changed,completed};
};
const hire=F.hire;F.hire=function(s,...args){const r=hire(s,...args);if(r.ok)s.workerClock=args[1]||Date.now();return r;};
F.production=production;
})();
