/* ОАЗИС 1.8: irrigation, cultivation, workers and educational in-game zakat.
   Pure model: browser/Phaser independent, persisted in the ordinary save. */
(function(){'use strict';
 const C=window.OASIS_CONFIG,E=window.OasisEconomy;
 const dayMS=()=>((C.dayMinutes||60)+(C.nightMinutes||60))*60*1000;
 const round=n=>Math.round(n*100)/100;
 const jobs={gardener:{name:'Работник хозяйства',cost:350,salary:38,icon:''}};
 const notes={
  watermelon:'Арбуз — сочный плод, который помогает разнообразить летний рацион.',
  clover:'Клевер обогащает кормовую базу хозяйства. Его выращивают также для улучшения почвы.',
  melon:'Дыня — ароматная бахчевая культура, содержащая воду и пищевые волокна.',
  fig:'Инжир — плод фигового дерева. Он содержит клетчатку и минеральные вещества.',
  pomegranate:'Гранат известен яркими зёрнами и характерным кисло-сладким вкусом.',
  dates:'Финики — плоды финиковой пальмы, источник углеводов и пищевых волокон.',
  olive:'Оливки собирают с оливковых деревьев; из них получают оливковое масло.',
  sidr:'Сидр — дерево зизифус (лотосовое дерево), растущее в жарком климате.',
  cumin:'Тмин используют как пряность. В игре из его семян получают масло.',
  flowers:'Цветущие растения обеспечивают пасеку нектаром для производства мёда.',
  barley:'Ячмень — злаковая культура, используемая для круп, муки и кормов.',
  wheat:'Пшеница — один из главных хлебных злаков. На мельнице её превращают в муку.'
 };
 function ensure(s){
  if(!s.workers||typeof s.workers!=='object')s.workers={};
  for(const id of Object.keys(jobs)){
   const w=s.workers[id];if(!w||typeof w!=='object')s.workers[id]={hired:false,state:'idle',target:-1,startedAt:0,endsAt:0,paidAt:0,from:-1};
   else {w.hired=!!w.hired;if(!['idle','travel','return','paused'].includes(w.state))w.state='idle';if(!Number.isFinite(w.endsAt))w.endsAt=0;}
  }
  if (!s.workerUnified) {
   const previous=s.workers.collector;
   if(previous?.hired) {
    if(s.workers.gardener.hired) s.coins=round(s.coins+260);
    else s.workers.gardener={...previous};
   }
   delete s.workers.collector;
   s.workerUnified=true;
  }
  s.workerPlan ||= {mode:'both',crop:s.selectedCrop||'clover',paused:false};
  if(!['both','plant','harvest'].includes(s.workerPlan.mode))s.workerPlan.mode='both';
  if(!C.crops[s.workerPlan.crop])s.workerPlan.crop='clover';
  if(Array.isArray(s.workerPlan.area))s.workerPlan.area=[...new Set(s.workerPlan.area.filter(i=>Number.isInteger(i)&&i>=0&&i<s.tiles.length))];
  if(!s.zakat||typeof s.zakat!=='object')s.zakat={startAt:0,dueAt:0,dueAmount:0,paidAt:0};
  return s;
 }
 function updateIrrigation(s,connected,now=Date.now()){
  let changed=false;
  s.tiles.forEach((t,i)=>{
   if(!t||!t.crop)return;
   const last=Number.isFinite(t.lastIrrigationTick)&&t.lastIrrigationTick>0?t.lastIrrigationTick:now;
   const delta=Math.max(0,now-last);
   if(!connected(i)&&delta>0){t.plantedAt+=delta;changed=true;}
   t.lastIrrigationTick=now;
  });
  return changed;
 }
 function canUseTile(s,i,connected){const t=s.tiles[i];return !!t&&window.OasisMapLayout?.objectAt(s,i)?.kind!=='well'&&i!==C.wellIndex&&!window.OasisFamilyLand?.isHome?.(s,i)&&window.OasisMapLayout?.buildingAt(s,i)==null&&!t.building&&!t.canal&&!t.crop&&connected(i);}
 function uproot(s,i){
  const t=s.tiles[i];if(!t||!t.crop)return{ok:false,reason:'Здесь нет растения'};
  const id=t.crop; s.seedBank[id]=(s.seedBank[id]||0)+1;
  t.crop=null;t.plantedAt=0;t.perennialEstablished=false;t.watered=false;t.lastIrrigationTick=0;
  return{ok:true,id,returned:1};
 }
 function dismantle(s,i){
  const t=s.tiles[i];if(!t||!t.canal)return{ok:false,reason:'Здесь нет канала'};
  t.canal=false;return{ok:true};
 }
 function hire(s,id,now=Date.now()){
  if(id==='collector')id='gardener';
  ensure(s);const cfg=jobs[id],w=s.workers[id];
  if(!cfg)return{ok:false,reason:'Неизвестная профессия'};
  if(w.hired)return{ok:false,reason:'Работник уже нанят'};
  if(s.coins<cfg.cost)return{ok:false,reason:'Не хватает монет'};
  s.coins=round(s.coins-cfg.cost);Object.assign(w,{hired:true,state:'idle',target:-1,paidAt:now,startedAt:now});
  return{ok:true,cost:cfg.cost};
 }
 function setDayOff(s,id,off,now=Date.now()){
  const w=s.workers?.[id];if(!w?.hired)return;
  w.dayOffUntil=off?now+dayMS():0;
  w.state='idle';w.target=-1;w.from=-1;w.paidAt=now;
 }
 function chooseTask(s,id,connected,now){
  const allowed=i=>!Array.isArray(s.workerPlan.area)||s.workerPlan.area.includes(i);
  const reserved=new Set(Object.values(s.workers).filter(w=>w.state==='travel').map(w=>w.target));
  const collectorAvailable=s.workerPlan.mode==='plant';
  if(id==='collector'||!collectorAvailable){
   for(let i=0;i<s.tiles.length;i++){
    if(allowed(i)&&!reserved.has(i)&&connected(i)&&window.OasisTimeSystem.isReady(s.tiles[i],now))return{index:i,action:'harvest'};
   }
  }
  if(id==='gardener' && s.workerPlan.mode!=='harvest'){
   const seeds=Object.keys(C.crops).filter(k=>(s.seedBank[k]||0)>0&&C.crops[k].unlock<=window.OasisProgression.level(s));
   const seed=seeds.includes(s.workerPlan.crop)?s.workerPlan.crop:null;
   if(seed)for(let i=0;i<s.tiles.length;i++)if(allowed(i)&&!reserved.has(i)&&canUseTile(s,i,connected))return{index:i,action:'plant',seed};
  }
  return null;
 }
 function tick(s,connected,now=Date.now()){
  ensure(s);let changed=false,completed=[];
  if(s.workerPlan.paused || ['canal','building','move','remove'].includes(s.tool)) return {changed,completed};
  for(const [id,cfg] of Object.entries(jobs)){
   const w=s.workers[id];if(!w.hired)continue;
   if(w.dayOffUntil>now)continue;
   if(w.dayOffUntil){w.paidAt=w.dayOffUntil;w.dayOffUntil=0;changed=true;}
   const since=now-(Number(w.paidAt)||now);
   if(since>=dayMS()){
    const periods=Math.min(30,Math.floor(since/dayMS()));const due=cfg.salary*periods;
    if(s.coins<due){w.state='paused';w.target=-1;w.paidAt=now;changed=true;continue;}
    s.coins=round(s.coins-due);w.paidAt+=periods*dayMS();changed=true;
   }
   if(w.state==='paused'){if(s.coins>=cfg.salary){w.state='idle';changed=true;}else continue;}
   if(w.state==='travel'&&now>=w.endsAt){
    const target=s.tiles[w.target];let result={ok:false};
    if(w.action==='harvest'&&target?.crop&&connected(w.target)&&window.OasisTimeSystem.isReady(target,now))result=E.harvest(s,w.target,now);
    if(w.action==='plant'&&canUseTile(s,w.target,connected))result=E.plant(s,w.target,w.seed,now);
    if(result.ok){completed.push({role:id,action:w.action,index:w.target,amount:result.amount||1});changed=true;}
    w.from=w.target;w.state='return';w.startedAt=now;w.endsAt=now+1600;changed=true;
   }else if(w.state==='return'&&now>=w.endsAt){w.state='idle';w.target=-1;changed=true;}
   if(w.state==='idle'){
    const job=chooseTask(s,id,connected,now);
    if(job){Object.assign(w,{state:'travel',target:job.index,action:job.action,seed:job.seed||null,from:-1,startedAt:now,endsAt:now+Math.max(1300,1800+Math.abs(job.index%(s.worldSize||C.worldSize)-((s.house?.col||0)+2))*160)});changed=true;}
   }
  }
  return{changed,completed};
 }
 const ZAKAT_NISAB=12000;
 function zakatStatus(s,now=Date.now()){
  ensure(s);const z=s.zakat,wealth=Math.floor(Math.max(0,s.coins||0));
  if(wealth<ZAKAT_NISAB){if(!z.dueAt){z.startAt=0;z.dueAt=0;z.dueAmount=0;}return{due:!!z.dueAt,eligible:false,amount:z.dueAt?(z.dueAmount||0):0,threshold:ZAKAT_NISAB,daysLeft:0};}
  if(!z.startAt)z.startAt=now;
  const end=z.startAt+355*dayMS();
  if(now>=end){if(!z.dueAt)z.dueAmount=Math.floor(wealth*.025);z.dueAt=end;}
  return{due:!!z.dueAt,eligible:true,amount:z.dueAt?(z.dueAmount||Math.floor(wealth*.025)):Math.floor(wealth*.025),threshold:ZAKAT_NISAB,daysLeft:Math.max(0,Math.ceil((end-now)/dayMS()))};
 }
 function payZakat(s,now=Date.now()){
  const st=zakatStatus(s,now);if(!st.due)return{ok:false,reason:'Пока нет обязанности по игровому расчёту'};
  if(st.amount<1||s.coins<st.amount)return{ok:false,reason:'Недостаточно монет'};
  s.coins=round(s.coins-st.amount);s.zakat.paidAt=now;s.zakat.startAt=s.coins>=ZAKAT_NISAB?now:0;s.zakat.dueAt=0;s.zakat.dueAmount=0;
  return{ok:true,amount:st.amount};
 }
 window.OasisFarmSystems={ensure,updateIrrigation,uproot,dismantle,hire,setDayOff,tick,zakatStatus,payZakat,notes,jobs,nisab:ZAKAT_NISAB,dayMS};
})();
