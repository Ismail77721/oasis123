/* ОАЗИС v1.8 — gestures, contextual information, interactive market, workers, zakat. */
(function(){'use strict';
 const M=MainScene.prototype,F=window.OasisFarmSystems,C=window.OASIS_CONFIG,S=window.OasisSadaka;
 const get=id=>document.getElementById(id);
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const oldCreate=M.create,oldRender=M.render,oldTap=M.onMapTap,oldRenderMarket=M.renderMarketTab,oldGoBack=M.goBack,oldHome=M.renderHome,oldCloseMarket=M.closeMarket,oldHelp=M.setupHelp,oldOpenUpgrades=M.openUpgrades;
 C.version='1.8.0';C.dayMinutes=60;C.nightMinutes=60;
 // Canal irrigation replaces consumption of water. Buildings remain useful without a water bar.
 for(const b of Object.values(window.OASIS_BUILDINGS))b.water=0;
 M.setupHelp=function(){oldHelp.call(this);};
 M.create=function(){
  oldCreate.call(this);F.ensure(this.s);this.toastTimer=0;this.swipeCandidate=null;this.swipeTargets=new Set();this.longPressTimer=0;
  get('market-counter-back')?.addEventListener('click',()=>this.showMarketSquare());
  get('help-toggle')?.addEventListener('click',()=>{get('help-panel').hidden=true;this.closeAllPanels();this.closeCropInfo();this.openTutorial();});
  get('crop-info-close')?.addEventListener('click',()=>this.closeCropInfo());
  get('remove-cancel')?.addEventListener('click',()=>this.closeRemoval());
  get('remove-yes')?.addEventListener('click',()=>this.commitRemoval());
  const marketMap=get('market-square');if(marketMap)marketMap.addEventListener('pointerdown',()=>{this.audio?.unlock?.();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.marketSound?.pause?.();else if(this.marketOpen)this.startMarketSound();});
  // Indistinct crowd-like rustling; no recognizable voices, music, or human figures.
  if(false){
   this.marketSound=new Audio('assets/audio/market_ambience.mp3');this.marketSound.loop=true;this.marketSound.preload='metadata';
  }
  this.workerMarker=node('div','worker-marker','');this.workerMarker.id='worker-marker';document.body.append(this.workerMarker);
  // Re-apply after new scene loads because old create initially renders the menu.
  this.render();
 };
 M.notify=function(message){
  const toast=get('feedback');if(!toast)return;
  toast.textContent=message;this.message=message;this.lastMessage=Date.now();
  toast.classList.remove('toast-open');void toast.offsetWidth;toast.classList.add('toast-open');
  clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>toast.classList.remove('toast-open'),3700);
 };
 M.render=function(){
  if(!this.s)return;F.ensure(this.s);
  this.calculateWater();const now=Date.now();
  const connected=i=>this.irrigated(i);
  const paused=this.updateEditClock?.(now)||false;
  const changes=!paused&&F.updateIrrigation(this.s,connected,now);
  const jobs=paused?{changed:false,completed:[]}:F.tick(this.s,connected,now);
  if(changes||jobs.changed){if(jobs.completed.length){this.lastWorkNotice=now;this.notify('Работа выполнена: '+jobs.completed.map(x=>x.action==='harvest'?'сбор урожая':'посадка').join(', '));}
   if(now-(this.lastPeriodicSave||0)>12000){this.lastPeriodicSave=now;this.save();}}
  oldRender.call(this);
  const resources=get('resources');if(resources)OasisUI.currency(resources,this.s.coins);
  const phase=get('phase');if(phase)phase.textContent=(OasisTimeSystem.getPhase()==='day'?'☀️ День':'🌙 Ночь')+' · v1.8.0';
  const info=get('mode-chip');if(info&&this.s.tool==='remove')info.textContent='🪓 Выбери дерево или канал для демонтажа';
  this.drawWorkerIndicator();
  if(this.marketOpen&&this.marketSound){if(!this.audio?.enabled||!this.audio?.ambience||!this.audio?.volume){this.marketSound.pause();}else{this.marketSound.volume=Math.min(.28,this.audio.volume*.18);if(this.marketSound.paused)this.startMarketSound();}}
  this.updateZakatReminder();
 };
 M.marketNotice=function(message){const e=get('market-message');if(e)e.textContent=message;};
 M.showMarketSquare=function(){const drawer=get('market-counter');if(drawer)drawer.hidden=true;this.currentStall='square';};
 M.openMarket=function(stall){
  this.closeAllPanels();this.closeCropInfo();get('quests-panel').hidden=true;get('help-panel').hidden=true;
  OasisUI.currency(get('market-coins'),this.s.coins);
  get('market-screen').hidden=false;this.marketOpen=true;document.body.classList.add('market-active');this.playSound?.('click');this.guideEvent('market');
  if(stall&&stall!=='produce'&&stall!=='square')this.renderMarketTab(stall);
  else this.showMarketSquare();
  this.audio?.pauseAmbience?.();this.startMarketSound();
 };
 M.renderMarketTab=function(stall='produce'){
  if(stall==='square'){this.showMarketSquare();return;}
  get('market-counter').hidden=false;
  oldRenderMarket.call(this,stall);
  if(stall==='sadaka')this.appendZakat();
  if(stall==='tools'){for(const item of get('market-items').children){if(item.textContent.includes('Ведро для воды'))item.remove();}}
 };
 M.startMarketSound=function(){
  if(!this.marketSound||!this.audio?.enabled||!this.audio?.ambience||!this.audio?.volume)return;
  this.marketSound.volume=Math.min(.28,this.audio.volume*.18);
  try{this.marketSound.play().catch(()=>{});}catch(_){/* mobile autoplay can be blocked */}
 };
 M.stopMarketSound=function(){if(this.marketSound){this.marketSound.pause();this.marketSound.currentTime=0;}};
 M.closeMarket=function(){this.stopMarketSound();document.body.classList.remove('market-active');oldCloseMarket.call(this);this.audio?.startAmbience?.();};
 M.goBack=function(){
  if(!get('crop-info').hidden){this.closeCropInfo();return;}
  if(!get('remove-confirm').hidden){this.closeRemoval();return;}
  if(this.marketOpen&&!get('market-counter').hidden){this.showMarketSquare();return;}
  return oldGoBack.call(this);
 };
 M.openBuildMenu=function(){
  this.closeCropInfo();this.closeAllPanels();this.guideEvent('buildMenu');
  const hint=document.querySelector('[data-build="canal"] small');if(hint)hint.textContent='Провести воду · '+OasisProgression.canalPrice(this.s)+' 🪙';
  get('build-menu').hidden=false;
 };
 M.hitCell=function(x,y){
  const hits=this.cells||[];let best=null,distance=Infinity;
  for(const c of hits){const d=Math.abs(x-c.x)/(c.w/2)+Math.abs(y-c.y)/(c.h/2);if(d<=1&&d<distance){best=c;distance=d;}}
  if(best)return best;
  for(const hit of this.visualHits||[])if(Math.abs(x-hit.x)<hit.w*.4&&y>=hit.y-hit.h*.8&&y<=hit.y+hit.h*.08){return hits.find(c=>c.i===hit.i)||null;}
  return null;
 };
 M.quickHarvest=function(i,quiet=false){
  const t=this.s.tiles[i];if(!t?.crop||!OasisTimeSystem.isReady(t))return false;
  const result=OasisEconomy.harvest(this.s,i,Date.now());
  if(!result.ok)return false;
  this.playSound?.('harvest');if(!quiet)this.notify('🧺 Собрано: '+OASIS_CONFIG.crops[result.id].title+' ×'+result.amount);
  return true;
 };
 M.onMapTap=function(pointer){
  if(!get('start-menu').hidden||this.marketOpen)return;
  const cell=this.hitCell(pointer.x,pointer.y),t=cell&&this.s.tiles[cell.i];
  if(this.well&&Math.abs(pointer.x-this.well.x)<this.well.w/2&&Math.abs(pointer.y-this.well.y)<this.well.h/2){this.notify('💧 Колодец снабжает каналы водой автоматически');return;}
  if(this.s.tool==='remove'){
   if(!cell||!t||(!t.crop&&!t.canal)){this.notify('Выбери растение или канал');return;}
   this.confirmRemoval(cell.i);return;
  }
  if(cell&&t?.crop&&this.s.tool==='plant'){
   if(this.quickHarvest(cell.i)){this.save();this.render();this.renderQuests();return;}
   this.notify('🌱 '+OASIS_CONFIG.crops[t.crop].title+' · рост '+Math.ceil(OasisTimeSystem.secondsLeft(t)/60)+' мин');return;
  }
  if(cell&&t?.canal&&this.s.tool==='plant'){
   this.openCropCard(cell.i);return;
  }
  return oldTap.call(this,pointer);
 };
 M.clearLongPress=function(){if(this.longPressTimer){clearTimeout(this.longPressTimer);this.longPressTimer=0;}};
 const oldBegin=M.beginMapPointer,oldMove=M.moveMapPointer,oldEnd=M.endMapPointer;
 M.beginMapPointer=function(p){
  this.clearLongPress();this.longPressHandled=false;this.swipeActive=false;this.swipeCandidate=null;this.swipeTargets=new Set();
  oldBegin.call(this,p);
  if(!get('start-menu').hidden||this.marketOpen||!get('crop-info').hidden||document.querySelector('.ui-modal:not([hidden])'))return;
  if(this.s.tool==='plant'&&this.visibleBuildingAt?.(p.x,p.y))return;
  const cell=this.hitCell(p.x,p.y),t=cell&&this.s.tiles[cell.i];
  this.swipeCandidate=this.s.tool==='plant'&&t?.crop&&OasisTimeSystem.isReady(t)?{i:cell.i,x:p.x,y:p.y,lastX:p.x,lastY:p.y}:null;
  if(cell&&(t?.crop||t?.canal)&&this.s.tool==='plant'){
   const targetIndex=cell.i;
   this.longPressTimer=setTimeout(()=>{
    if(this.dragPointer&&!this.dragPointer.drag&&!this.pinchStart){this.longPressHandled=true;this.swipeCandidate=null;this.dragPointer=null;this.openCropCard(targetIndex);}
   },520);
  }
 };
 M.moveMapPointer=function(p){
  const a=this.input.pointer1,b=this.input.pointer2;
  if(a?.isDown&&b?.isDown){this.clearLongPress();this.swipeCandidate=null;oldMove.call(this,p);return;}
  const start=this.swipeCandidate;
  if(start&&Math.hypot(p.x-start.x,p.y-start.y)>11&&this.s.tool==='plant'){
   this.clearLongPress();this.swipeActive=true;
   if(!this.swipeTargets.has(start.i)){if(this.quickHarvest(start.i,true))this.swipeTargets.add(start.i);}
   const steps=Math.max(1,Math.ceil(Math.hypot(p.x-start.lastX,p.y-start.lastY)/10));
   for(let k=1;k<=steps;k++){
    const x=start.lastX+(p.x-start.lastX)*k/steps,y=start.lastY+(p.y-start.lastY)*k/steps;
    const cell=this.hitCell(x,y);
    if(cell&&!this.swipeTargets.has(cell.i)&&this.quickHarvest(cell.i,true))this.swipeTargets.add(cell.i);
   }
   start.lastX=p.x;start.lastY=p.y;
   if(this.swipeTargets.size)this.render();return;
  }
  if(this.dragPointer&&Math.hypot(p.x-this.dragPointer.x,p.y-this.dragPointer.y)>11)this.clearLongPress();
  oldMove.call(this,p);
 };
 M.endMapPointer=function(p){
  this.clearLongPress();
  if(this.swipeActive){
   const n=this.swipeTargets?.size||0;this.swipeActive=false;this.swipeCandidate=null;this.dragPointer=null;
   if(n){this.notify('🧺 Собрано с '+n+' грядок');this.save();this.render();this.renderQuests();}return;
  }
  this.swipeCandidate=null;
  if(this.longPressHandled){this.longPressHandled=false;this.dragPointer=null;return;}
  oldEnd.call(this,p);
 };
 M.closeCropInfo=function(){const box=get('crop-info');if(box)box.hidden=true;};
 M.openCropCard=function(i){
  const t=this.s.tiles[i];if(!t)return;
  if(!t.crop&&!t.canal)return;
  const box=get('crop-info');box.hidden=false;
  get('crop-info-actions').replaceChildren();
  const cell=this.cells.find(c=>c.i===i),viewportW=window.innerWidth||this.scale.width,viewportH=window.innerHeight||this.scale.height;
  const px=cell?cell.x:viewportW/2,py=cell?cell.y:viewportH/2;
  box.style.left=Math.round(Math.max(8,Math.min(viewportW-315,px+16)))+'px';
  box.style.top=Math.round(Math.max(72,Math.min(viewportH-280,py-130)))+'px';
  const addAction=(text,fn,danger=false)=>{const b=node('button',danger?'danger':null,text);b.addEventListener('click',fn);get('crop-info-actions').append(b);};
  if(t.crop){
   const crop=C.crops[t.crop];const ready=OasisTimeSystem.isReady(t);
   get('crop-info-title').textContent=crop.icon+' '+crop.title;
   get('crop-info-desc').textContent=F.notes[t.crop]||'Растение оазиса.';
   get('crop-info-state').textContent=ready?'✅ Урожай готов':this.irrigated(i)?'🌱 Созреет через '+Math.ceil(OasisTimeSystem.secondsLeft(t)/60)+' мин':'⏸ Нет подключения к каналу';
   if(ready)addAction('🧺 Собрать',()=>{this.closeCropInfo();if(this.quickHarvest(i)){this.save();this.render();this.renderQuests();}});
   addAction('🪓 Выкорчевать',()=>{this.closeCropInfo();this.confirmRemoval(i);},true);
  }else{
   get('crop-info-title').textContent='💧 Канал';get('crop-info-desc').textContent='Передаёт воду от колодца к орошаемым участкам. Можно изменить расположение сети.';
   get('crop-info-state').textContent=this.connected?.has(i)?'💧 Подключён к колодцу':'⚠️ Нет соединения';
   addAction('🪓 Разобрать',()=>{this.closeCropInfo();this.confirmRemoval(i);},true);
  }
 };
 M.confirmRemoval=function(i){
  this.pendingRemoval=i;const t=this.s.tiles[i];
  get('remove-confirm-text').textContent=t?.crop?'Выкорчевать «'+(C.crops[t.crop]?.title||t.crop)+'»? Вернётся 1 семя или саженец.':'Разобрать канал? Сеть орошения может измениться.';
  get('remove-confirm').hidden=false;
 };
 M.closeRemoval=function(){get('remove-confirm').hidden=true;this.pendingRemoval=null;};
 M.commitRemoval=function(){
  const i=this.pendingRemoval,t=this.s.tiles[i];if(!t){this.closeRemoval();return;}
  const result=t.crop?F.uproot(this.s,i):F.dismantle(this.s,i);
  const wasCrop=!!t.crop;this.closeRemoval();if(result.ok){this.save();this.render();this.playSound?.('build');this.notify(wasCrop?'🌱 Семя или саженец возвращён':'🪓 Канал разобран');}
 };
 M.openUpgrades=function(){oldOpenUpgrades.call(this);const list=get('upgrade-items');for(const item of list.children){if(item.textContent.includes('Ведро для воды'))item.remove();}};
 M.renderHome=function(){
  oldHome.call(this);F.ensure(this.s);
  const target=get('home-workers');if(!target)return;target.replaceChildren();target.append(node('h3',null,'🧺 Работники хозяйства'));
  target.append(node('p','home-muted','Работники действительно выбирают участок, добираются до него и выполняют посадку или сбор. На карте показывается только маркер работы — без изображения людей.'));
  for(const [id,cfg] of Object.entries(F.jobs)){
   const w=this.s.workers[id],box=node('div','worker-card');box.append(node('h4',null,cfg.icon+' '+cfg.name));
   box.append(node('p',null,'Найм '+cfg.cost+' 🪙 · оплата '+cfg.salary+' 🪙 за игровые сутки.'));
   box.append(node('p',null,w.hired?(this.s.workerPlan?.paused?'Работа приостановлена':w.dayOffUntil>Date.now()?'Сегодня выходной':w.state==='paused'?'Нет денег на оплату':w.state==='idle'?'Ожидает работу':w.state==='travel'?'Выполняет задание':'Готовится к следующему заданию'):'Пока не нанят'));
   if(!w.hired){const b=node('button',null,'Нанять · '+cfg.cost+' 🪙');b.disabled=this.s.coins<cfg.cost;b.addEventListener('click',()=>{const result=F.hire(this.s,id);this.notify(result.ok?cfg.name+' нанят!':result.reason);if(result.ok){this.save();this.render();}this.renderHome();});box.append(b);}
   if(w.hired){
    const off=w.dayOffUntil>Date.now();
    const rest=node('button',null,off?'Вернуть к работе':'Дать выходной');
    rest.type='button';rest.addEventListener('click',()=>{F.setDayOff(this.s,id,!off);this.save();this.render();this.renderHome();});
    box.append(rest);
   }
   target.append(box);
  }
 };
 M.drawWorkerIndicator=function(){
  const marker=this.workerMarker;if(!marker)return;
  if(this.marketOpen||!get('start-menu').hidden){marker.style.display='none';return;}
  if(this.s.tool!=='plant'){marker.style.display='none';return;}
  const active=Object.entries(this.s.workers||{}).find(([id,w])=>w.hired&&w.state==='travel'&&this.cells.some(c=>c.i===w.target));
  if(!active){marker.style.display='none';return;}
  const [id,w]=active,cell=this.cells.find(c=>c.i===w.target);if(!cell)return;
  const start=this.cells.find(c=>c.i===OASIS_CONFIG.wellIndex+1)||cell;
  const fraction=Math.max(0,Math.min(1,(Date.now()-w.startedAt)/Math.max(1,w.endsAt-w.startedAt)));
  const x=start.x+(cell.x-start.x)*fraction,y=start.y+(cell.y-start.y)*fraction-20;
  marker.style.display='block';marker.style.left=Math.round(x)+'px';marker.style.top=Math.round(y)+'px';marker.textContent=id==='collector'?'📦':'🧺';
 };
 M.appendZakat=function(){};M.updateZakatReminder=function(){};
})();
