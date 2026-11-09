/* v2.1: explicit worker assignment, readiness and clear editing. */
(function(){
'use strict';
const M=MainScene.prototype, F=OasisFarmSystems;
const get=id=>document.getElementById(id);
const editing=s=>['canal','building','move','remove'].includes(s.tool);
const home=M.renderHome, render=M.render, create=M.create;
M.create=function(){create.call(this);get('edit-controls').append(get('stop-build'));};
M.renderHome=function(){
 home.call(this);
 const target=get('home-workers'); if(!target)return;
 const description=target.querySelector('.home-muted');
 if(description)description.textContent='Выбери культуру и работу. Во время строительства работа приостановлена.';
 const title=target.querySelector('h3');if(title)title.textContent='Работник хозяйства';
 F.ensure(this.s);
 const plan=this.s.workerPlan;
 for(const [key,label,options] of [
  ['mode','Задание',[['both','Сажать и собирать'],['plant','Только посадка'],['harvest','Только сбор']]],
  ['crop','Культура для посадки',Object.entries(OASIS_CONFIG.crops).filter(([id,c])=>c.unlock<=this.getLevel()).map(([id,c])=>[id,c.title])]
 ]){
  const wrap=document.createElement('label');wrap.className='worker-setting';wrap.textContent=label;
  const select=document.createElement('select');
  for(const [value,text] of options){const o=new Option(text,value);select.add(o);}
  select.value=plan[key];select.onchange=()=>{plan[key]=select.value;Object.assign(this.s.workers.gardener,{state:'idle',target:-1});this.save();};
  wrap.append(select);target.append(wrap);
 }
 const zone=document.createElement('p');zone.textContent=Array.isArray(plan.area)?'Участок работника: '+plan.area.length+' грядок':'Участок работника: вся ферма';target.append(zone);
 const plots=document.createElement('button');plots.textContent='Работать на текущих грядках';plots.disabled=!this.s.tiles.some(t=>t.crop);
 plots.onclick=()=>{plan.area=this.s.tiles.flatMap((t,i)=>t.crop?[i]:[]);Object.assign(this.s.workers.gardener,{state:'idle',target:-1});this.save();this.renderHome();};
 const all=document.createElement('button');all.textContent='Работать по всей ферме';all.onclick=()=>{delete plan.area;this.save();this.renderHome();};target.append(plots,all);
 const button=document.createElement('button');button.textContent=plan.paused?'Продолжить работу':'Приостановить работу';
 button.onclick=()=>{plan.paused=!plan.paused;Object.assign(this.s.workers.gardener,{state:'idle',target:-1,paidAt:Date.now()});this.save();this.renderHome();};target.append(button);
};
M.drawWorkerIndicator=function(){
 const marker=this.workerMarker;if(!marker)return;
 const w=this.s.workers?.gardener;
 const cell=w&&this.cells.find(c=>c.i===w.target);
 if(!cell||w.state!=='travel'||this.s.workerPlan?.paused||editing(this.s)||this.marketOpen||!get('start-menu').hidden){marker.style.display='none';return;}
 marker.textContent='';marker.classList.add('working-soil');marker.style.display='block';
 marker.style.left=cell.x+'px';marker.style.top=cell.y+'px';
 marker.setAttribute('aria-label',w.action==='plant'?'Посадка':'Сбор урожая');
};
M.render=function(){
 render.call(this);
 const paused=editing(this.s); document.body.classList.toggle('farm-editing',paused);
 for(const sprite of [this.homeSprite,this.wellSprite,...Object.values(this.art||{})])sprite?.setAlpha?.(paused?.28:1);
 if(!this.readyMarks)this.readyMarks=this.add.graphics().setDepth(100000);
 const g=this.readyMarks;g.clear();
 if(!paused&&!this.marketOpen&&get('start-menu').hidden){
  for(const cell of this.cells){
   const t=this.s.tiles[cell.i];if(!t)continue;
   if(!(t.crop&&OasisTimeSystem.isReady(t))&&!(t.building&&t.productionAt>0&&t.productionAt<=Date.now()))continue;
   const sprite=this.art?.[cell.i];
   const y=sprite?.visible?sprite.y-sprite.displayHeight*sprite.originY-8:cell.y-18;
   g.fillStyle(0xfff3b2,1);g.fillCircle(cell.x,y,9);g.lineStyle(2,0x31744c,1);g.strokeCircle(cell.x,y,9);
   g.lineBetween(cell.x-4,y,cell.x-1,y+3);g.lineBetween(cell.x-1,y+3,cell.x+5,y-4);
  }
 }
 const lv=this.getLevel();
 if(this.levelProfile!==this.s){this.levelProfile=this.s;this.lastAnnouncedLevel=lv;}
 if(lv>this.lastAnnouncedLevel){
  const unlocked=[...Object.values(OASIS_CONFIG.crops),...Object.values(OASIS_BUILDINGS)].filter(c=>c.unlock>this.lastAnnouncedLevel&&c.unlock<=lv).map(c=>c.title);
  this.notify('Уровень '+lv+(unlocked.length?' · Доступно: '+unlocked.join(', '):' · Хозяйство развивается'));this.lastAnnouncedLevel=lv;
 }
};
})();
/* Starting economy preserves old inventories and completed unlock milestones. */
(function(){
 const C=OASIS_CONFIG;
 const tuning={watermelon:[720,2],clover:[420,1],melon:[1500,4],fig:[5400,6],pomegranate:[7200,7],dates:[10800,9],olive:[7200,8],sidr:[14400,13],cumin:[2400,5],flowers:[2100,3],barley:[2700,4],wheat:[3000,5]};
 for(const [id,[seconds,price]]of Object.entries(tuning)){C.crops[id].growSeconds=seconds;C.crops[id].sellPrice=price;}
 const products={sheep:8,camel:14,apiary:10,oilpress:18,olivepress:23,mill:13,loom:24};
 for(const [id,price]of Object.entries(products))OASIS_BUILDINGS[id].price=price;
})();

(function(){
 const M=MainScene.prototype, open=M.openFarm;
 M.openFarm=function(index){
  open.call(this,index);
  const t=this.s.tiles[index],cfg=OASIS_BUILDINGS[t?.building];if(!cfg)return;
  const lv=Math.min(3,Math.max(1,t.buildingLevel||1));
  const p=document.createElement('p');p.textContent='Уровень постройки '+lv+' из 3';document.getElementById('farm-actions').append(p);
  if(lv>=3)return;
  const cost=Math.round(cfg.cost*(lv===1?15:65));
  const b=document.createElement('button');b.textContent='Улучшить · '+cost+' монет';
  b.disabled=this.s.coins<cost || t.productionAt>0;
  b.onclick=()=>{if(this.s.coins<cost||t.productionAt>0||(t.buildingLevel||1)!==lv)return;this.s.coins-=cost;t.buildingLevel=lv+1;this.save();this.render();this.openFarm(index);};
  const detail=document.createElement('p');detail.textContent='Новый облик, +1 продукт за цикл и быстрее производство. Улучшение доступно после сбора.';
  document.getElementById('farm-actions').append(detail,b);
 };
})();
(function(){
 const M=MainScene.prototype,irrigated=M.irrigated;
 M.irrigated=function(i){
  if(irrigated.call(this,i))return true;
  const n=this.s.worldSize,well=OASIS_CONFIG.wellIndex,level=this.s.wellLevel||1;
  return level>1 && Math.abs(Math.floor(i/n)-Math.floor(well/n))+Math.abs(i%n-well%n)<=level;
 };
 M.openWell=function(){
  const s=this.s,level=s.wellLevel||1;
  document.getElementById('farm-title').textContent='Колодец · уровень '+level+' из 3';
  document.getElementById('farm-error').hidden=true;
  document.getElementById('farm-status').textContent='Питает арыки и поливает ближайшие '+level+' ряда клеток. Улучшенный колодец занимает 2 × 2 клетки.';
  const actions=document.getElementById('farm-actions');actions.replaceChildren();
  if(level<3){
   const cost=level===1?1800:7200,b=document.createElement('button');
   b.textContent='Улучшить · '+cost+' монет';b.disabled=s.coins<cost;
   b.onclick=()=>{
    const room=OasisMapLayout.check(s,OASIS_CONFIG.wellIndex,{kind:'well',anchor:OASIS_CONFIG.wellIndex});
    if(!room.ok){const e=document.getElementById('farm-error');e.textContent='Освободи участок 2 × 2 вокруг основания колодца или переставь его на свободное место';e.hidden=false;return;}
    if(s.coins<cost||(s.wellLevel||1)!==level)return;
    s.coins-=cost;s.wellLevel=level+1;s.wellArea=true;this.save();this.render();this.openWell();
   };actions.append(b);
  }
  this.updateFarmStatus=()=>{};
  document.getElementById('farm').hidden=false;
 };
})();
(function(){
 const G=OasisGameState,normal=G.normalize,fresh=G.createNew;
 const oldSeconds={watermelon:240,clover:150,melon:360,fig:600,pomegranate:900,dates:1200,olive:900,sidr:1500,cumin:480,flowers:420,barley:570,wheat:660};
 G.createNew=function(){const s=fresh();s.balanceVersion=2;return s;};
 G.normalize=function(raw){
  const s=normal(raw);
  if(s.balanceVersion!==2){
   const now=Date.now();
   for(const t of s.tiles)if(t.crop&&t.plantedAt&&oldSeconds[t.crop]){
    const elapsed=Math.max(0,now-t.plantedAt),ratio=Math.min(1,elapsed/(oldSeconds[t.crop]*1000));
    t.plantedAt=now-ratio*OASIS_CONFIG.crops[t.crop].growSeconds*1000;
   }
   // Requote unfinished orders against the new prices, preserving their requested items.
   for(const order of s.orders||[]){
    const items=order.items||[{id:order.id,quantity:order.quantity}];
    const gross=items.reduce((n,x)=>n+x.quantity*(x.category==='seed'?(OASIS_CONFIG.crops[x.id]?.seedCost||0)*.65:(OASIS_CONFIG.crops[x.id]?.sellPrice||Object.values(OASIS_BUILDINGS).find(b=>b.product===x.id)?.price||0)),0);
    order.reward=Math.ceil(gross*(items.length>1?1.3+(items.length-2)*.05:1.15));
   }
   s.balanceVersion=2;
  }
  return s;
 };
})();
(function(){
 const expand=OasisFamilyLand.expand;
 OasisFamilyLand.expand=function(s){
  const n=s.worldSize, result=expand(s);if(!result.ok)return result;
  const shift=(s.worldSize-n)/2,remap=i=>(Math.floor(i/n)+shift)*s.worldSize+i%n+shift;
  if(Array.isArray(s.workerPlan?.area))s.workerPlan.area=s.workerPlan.area.map(remap);
  for(const w of Object.values(s.workers||{})){if(w.target>=0)w.target=remap(w.target);if(w.from>=0)w.from=remap(w.from);}
  return result;
 };
})();
