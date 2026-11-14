class MainScene extends Phaser.Scene {
 constructor(){super('MainScene');this.cells=[];this.message='';this.lastMessage=0;this.mapZoom=1;this.panX=0;this.panY=0;this.art=[];this.wasGesture=false;this.dragPointer=null;this.pinchStart=null;}
 create(){this.s=OasisSaveSystem.load();OasisEconomy.ensureOrders(this.s);this.g=this.add.graphics();this.overlay=this.add.graphics().setDepth(10000);this.input.on('pointerdown',p=>this.beginMapPointer(p));this.input.on('pointermove',p=>this.moveMapPointer(p));this.input.on('pointerup',p=>this.endMapPointer(p));this.input.on('pointerupoutside',()=>{this.clearLongPress?.();this.dragPointer=null;this.pinchStart=null;this.swipeCandidate=null;if(this.swipeActive)this.save();this.swipeActive=false;});this.scale.on('resize',()=>this.render());this.audio=window.OasisAudio||null;if(this.audio)this.audio.attach();this.bindToolbar();this.bindMarket();this.bindExtra();this.bindBuildings();this.setupHelp();this.setupQuests();this.setupMapControls();this.setupMenu();this.setupLiveGuide();OasisDailyQuests.ensure(this.s);this.time.addEvent({delay:1000,loop:true,callback:()=>{if(!document.hidden)this.render();}});this.render();this.openMainMenu();}
 setupMenu(){
  this.menuMode='continue';
  const menu=document.getElementById('start-menu'),profile=document.getElementById('profile-screen'),tutorial=document.getElementById('tutorial-screen');
  document.getElementById('open-menu').addEventListener('click',()=>this.openMainMenu());
  document.getElementById('menu-continue').addEventListener('click',()=>{
   if(!this.s.profile?.created){this.menuMode='continue';this.openProfile();}
   else this.enterGame();
  });
  document.getElementById('menu-new').addEventListener('click',()=>{this.menuMode='new';this.openProfile();});
  document.getElementById('menu-sound').addEventListener('click',()=>{if(this.audio){this.audio.setEnabled(!this.audio.enabled);this.updateMenuSound();}});
  document.getElementById('menu-about').addEventListener('click',()=>{const p=document.getElementById('menu-about-text');p.hidden=!p.hidden;});
  this.updateMenuSound();
  document.getElementById('profile-back').addEventListener('click',()=>{profile.hidden=true;menu.hidden=false;});
  document.getElementById('profile-start').addEventListener('click',()=>{
   const name=document.getElementById('profile-name').value.trim();
   const gender=document.querySelector('input[name="player-gender"]:checked')?.value;
   if(name.length<2||name.length>20){document.getElementById('profile-error').textContent='Укажи имя от 2 до 20 символов';return;}
   if(!['male','female'].includes(gender)){document.getElementById('profile-error').textContent='Выбери пол';return;}
   if(this.menuMode==='new' && this.hasPreviousGame && !document.getElementById('confirm-new').checked){
    document.getElementById('profile-error').textContent='Подтверди создание новой игры — прежнее сохранение будет заменено';return;
   }
   const hadProfile=!!this.s.profile?.created;
   if(this.menuMode==='new')this.s=OasisGameState.createNew();
   this.s.profile={name,gender,created:true};this.s.tutorialDone=this.menuMode==='new'||!hadProfile?false:this.s.tutorialDone;
   this.selectedTile=null;this.s.tool='plant';OasisEconomy.ensureOrders(this.s);OasisDailyQuests.ensure(this.s);this.save();this.enterGame();
  });
  document.getElementById('tutorial-next').addEventListener('click',()=>this.nextTutorial());
  document.getElementById('tutorial-skip').addEventListener('click',()=>this.finishTutorial());
  document.getElementById('tutorial-replay').addEventListener('click',()=>{this.closePanel('build-menu');this.openTutorial();});
  for(const panel of ['buildings','upgrades']){
   const b=document.getElementById(panel+'-back');if(b)b.addEventListener('click',()=>{this.closePanel(panel);this.openBuildMenu();});
  }
  document.getElementById('back-key').addEventListener('click',()=>this.goBack());
  document.addEventListener('keydown',e=>{if((e.key==='Escape'||e.key==='Backspace')&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();this.goBack();}});
  const previous=typeof localStorage!=='undefined'&&!!localStorage.getItem(OASIS_CONFIG.storageKey);
  this.hasPreviousGame=previous;
  document.getElementById('menu-continue').hidden=!previous;
  this.refreshMenu();
 }
 updateMenuSound(){document.getElementById('menu-sound').textContent=this.audio?(this.audio.enabled?'🔊 Звук: включён':'🔇 Звук: выключен'):'🔇 Звук недоступен';}
 refreshMenu(){
  document.getElementById('menu-greeting').textContent=this.s.profile?.created?'С возвращением, '+this.s.profile.name+'! Ваш оазис ждёт.':'Вырастите свой оазис среди золотых песков';
  document.getElementById('menu-continue').textContent=this.s.profile?.created?'Продолжить игру':'Продолжить сохранённую ферму';
 }
 openMainMenu(){
  this.closeAllPanels();this.closeMarket();if(this.guideActive)this.finishTutorial();document.getElementById('tutorial-screen').hidden=true;
  document.getElementById('profile-screen').hidden=true;document.getElementById('start-menu').hidden=false;
  document.getElementById('menu-continue').hidden=!this.hasPreviousGame;this.refreshMenu();this.updateMenuSound();
 }
 openProfile(){
  document.getElementById('start-menu').hidden=true;document.getElementById('profile-screen').hidden=false;
  document.getElementById('profile-error').textContent='';document.getElementById('profile-name').value=this.s.profile?.name||'';
  document.getElementById('confirm-wrap').hidden=!(this.menuMode==='new'&&this.hasPreviousGame);
  document.getElementById('confirm-new').checked=false;
  const radio=document.querySelector('input[name="player-gender"][value="'+(this.s.profile?.gender||'male')+'"]');if(radio)radio.checked=true;
  document.getElementById('profile-title').textContent=this.menuMode==='new'?'Новое путешествие':'Настройка профиля';
 }
 enterGame(){
  this.hasPreviousGame=true;
  for(const id of ['start-menu','profile-screen'])document.getElementById(id).hidden=true;
  document.getElementById('player-name').textContent='🌿 '+this.s.profile.name;
  this.render();if(!this.s.tutorialDone)this.openTutorial();
 }
 openTutorial(){
  document.getElementById('tutorial-screen').hidden=true;
  this.s.tutorialStep=0;this.guideActive=true;this.showGuideStep();
 }
 showTutorialStep(){this.showGuideStep();}
 nextTutorial(){if(!this.guideActive)return;this.s.tutorialStep=Math.min(7,this.s.tutorialStep+1);if(this.s.tutorialStep>=7)this.finishTutorial();else{this.showGuideStep();this.save();}}
 finishTutorial(){this.guideActive=false;this.s.tutorialDone=true;this.s.tutorialStep=7;
  for(const id of ['tutorial-screen','live-guide','guide-ring'])document.getElementById(id).hidden=true;
  this.save();this.notify('Ты освоил основы хозяйства!');
 }
 setupLiveGuide(){
  this.guideActive=false;
  document.getElementById('guide-skip').addEventListener('click',()=>this.finishTutorial());
  document.getElementById('guide-next').addEventListener('click',()=>this.nextTutorial());
 }
 guideSteps(){return [
  {event:'openPlot',target:'plot',text:'Начнём с грядки. Нажми на подсвеченный участок рядом с колодцем, чтобы выбрать семена.'},
  {event:'planted',target:'#picker .market-card',text:'Выбери доступный клевер или арбуз и нажми «Посадить». Семя расходуется, но после урожая вернётся в запас.'},
  {event:'buildMenu',target:'#toolbar button[data-action="build"]',text:'Отлично! Теперь открой «Строить» внизу. Каналы помогают расширять полив.'},
  {event:'canalMode',target:'[data-build="canal"]',text:'Выбери «Каналы» в меню строительства. Затем нажми на свободную землю возле колодца.'},
  {event:'canalBuilt',target:'canal',text:'Проведи первый канал, нажав на подсвеченный участок. Соединённая сеть будет доставлять воду.'},
  {event:'market',target:'#toolbar button[data-action="market"]',text:'Ферма развивается! Теперь открой «Базар» — там покупают семена, продают урожай и выполняют заказы.'},
  {event:'orders',target:'.market-stall[data-stall="orders"]',text:'На торговой площади выбери «Заказы». За них платят выгоднее, чем за обычную продажу.'},
  {event:'marketBack',target:'#market-back',text:'Вернись на ферму. В любое время открой задания или повтори обучение через меню строительства.'}
 ];}
 showGuideStep(){
  if(!this.guideActive)return;
  const step=this.guideSteps()[this.s.tutorialStep||0];if(!step){this.finishTutorial();return;}
  document.getElementById('live-guide').hidden=false;
  document.getElementById('guide-mentor').textContent=(this.s.profile?.gender==='female'?'Аиша':'Саид')+' · подсказка';
  document.getElementById('guide-progress').textContent=(this.s.tutorialStep+1)+'/8';
  document.getElementById('guide-body').textContent=step.text;
  document.getElementById('guide-next').textContent=this.s.tutorialStep===7?'Завершить':'Далее →';
  this.positionGuide();
 }
 positionGuide(){
  if(!this.guideActive)return;
  const step=this.guideSteps()[this.s.tutorialStep||0];if(!step)return;
  const ring=document.getElementById('guide-ring');
  let bounds=null;
  if(step.target==='plot'||step.target==='canal'){
   const center=OASIS_CONFIG.wellIndex,idx=step.target==='plot'?center+1:center+OASIS_CONFIG.worldSize;
   const c=this.cells.find(v=>v.i===idx);
   if(c)bounds={left:c.x-c.w*.45,top:c.y-c.h*.7,width:c.w*.9,height:c.h*1.4};
  }else{
   const target=document.querySelector(step.target);
   if(target&&(!target.closest||!target.closest('[hidden]'))&&target.getBoundingClientRect){const b=target.getBoundingClientRect();bounds={left:b.left,top:b.top,width:b.width,height:b.height};}
  }
  if(!bounds){ring.hidden=true;return;}
  ring.hidden=false;ring.style.left=Math.round(bounds.left-5)+'px';ring.style.top=Math.round(bounds.top-5)+'px';ring.style.width=Math.round(bounds.width+10)+'px';ring.style.height=Math.round(bounds.height+10)+'px';
 }
 guideEvent(event){
  if(!this.guideActive)return;
  const step=this.guideSteps()[this.s.tutorialStep||0];
  if(step&&step.event===event)this.nextTutorial();else this.positionGuide();
 }
 goBack(){
  if(this.guideActive){this.finishTutorial();return;}
  if(!document.getElementById('profile-screen').hidden){document.getElementById('profile-screen').hidden=true;document.getElementById('start-menu').hidden=false;return;}
  if(!document.getElementById('start-menu').hidden)return;
  if(this.marketOpen){this.closeMarket();return;}
  if(!document.getElementById('buildings').hidden){this.closePanel('buildings');this.openBuildMenu();return;}
  if(!document.getElementById('upgrades').hidden){this.closePanel('upgrades');this.openBuildMenu();return;}
  for(const id of ['picker','farm','storage-screen','build-menu']){if(!document.getElementById(id).hidden){this.closePanel(id);return;}}
  if(!document.getElementById('quests-panel').hidden){document.getElementById('quests-panel').hidden=true;return;}
  if(!document.getElementById('help-panel').hidden){document.getElementById('help-panel').hidden=true;return;}
  this.openMainMenu();
 }

 bindToolbar(){
  document.querySelectorAll('#toolbar button').forEach(b=>b.addEventListener('click',()=>{
   const a=b.dataset.action;
   if(a==='market')this.openMarket();
   else if(a==='inventory')this.openStorage();
   else if(a==='quests'){const panel=document.getElementById('quests-panel');panel.hidden=!panel.hidden;if(!panel.hidden)this.renderQuests();}
   else if(a==='build')this.openBuildMenu();
  }));
  document.getElementById('build-menu-close').addEventListener('click',()=>this.closePanel('build-menu'));
  document.querySelectorAll('#build-menu-actions button').forEach(b=>b.addEventListener('click',()=>{
   this.closePanel('build-menu');this.resetEditDraft?.();const a=b.dataset.build;
   if(a==='canal'){this.s.tool='canal';this.notify('Выбери клетки канала. Повторное касание убирает клетку из выбора');this.guideEvent('canalMode');}
   else if(a==='move'){this.s.tool='move';this.notify('Выбери объект на карте, затем новое место');}
   else if(a==='remove'){this.s.tool='remove';this.notify('Выбери растение или канал для расчистки');}
   else if(a==='buildings')this.openBuildings();
   else if(a==='upgrades')this.openUpgrades();
   else{this.s.tool='plant';this.notify('🌱 Коснись пустого участка для посадки');}
   this.save();this.render();
  }));
  document.getElementById('storage-close').addEventListener('click',()=>this.closePanel('storage-screen'));
  document.getElementById('storage-go-market').addEventListener('click',()=>{this.closePanel('storage-screen');this.openMarket();});
 }
 openBuildMenu(){this.closeAllPanels();this.guideEvent('buildMenu');const hint=document.querySelector('[data-build="canal"] small');if(hint)hint.textContent='Провести воду · '+OasisProgression.canalPrice(this.s)+' 🪙';document.getElementById('build-menu').hidden=false;this.positionGuide();}
 closeAllPanels(){for(const id of ['build-menu','buildings','farm','picker','upgrades','storage-screen'])document.getElementById(id).hidden=true;}
 openStorage(){
  const el=document.getElementById('storage-items');el.replaceChildren();
  const heading=document.createElement('h3');heading.textContent='🌱 Семенной запас';el.append(heading);
  for(const [id,c] of Object.entries(OASIS_CONFIG.crops)){
   const count=this.s.seedBank[id]||0;
   const row=document.createElement('div');row.className='market-row';row.textContent=c.icon+' '+c.title+' · '+count+' '+(c.type==='perennial'?'саженцев':'семян');el.append(row);
  }
  const title=document.createElement('h3');title.textContent='🧺 Урожай и продукция';el.append(title);
  for(const [id,c] of [...Object.entries(OASIS_CONFIG.crops),...Object.entries(OASIS_BUILDINGS)]){
   const itemId=c.product||id,count=this.s.inventory[itemId]||0;
   const row=document.createElement('div');row.className='market-row';row.textContent=(c.icon||'📦')+' '+(c.product?this.productName(c.product):c.title)+' · '+count+' шт.';el.append(row);
  }
  document.getElementById('storage-screen').hidden=false;
 }
 playSound(name){if(this.audio&&typeof this.audio.play==='function')this.audio.play(name);}
 notify(m){this.message=m;this.lastMessage=Date.now();document.getElementById('feedback').textContent=m;if(/^(Нужно|Недостаточно|Не хватает|Клетка занята|Культура ещё не открыта|Для канала нужны)/u.test(m))this.playSound('error');}
 save(){OasisSaveSystem.save(this.s);}
 onMapTap(pointer){
  if(this.marketOpen||!document.getElementById('start-menu').hidden||!document.getElementById('tutorial-screen').hidden)return;
  const px=pointer.x,py=pointer.y,well=this.well;
  if(well&&Math.abs(px-well.x)<well.w/2&&Math.abs(py-well.y)<well.h/2){
   if(this.s.water>=OasisProgression.maxWater(this.s))this.notify('Колодец: запас воды полный');
   else if(this.s.coins<2)this.notify('Нужно 2 монеты для воды');
   else{this.s.coins-=2;this.s.water=Math.min(OasisProgression.maxWater(this.s),this.s.water+3+Math.floor((OasisProgression.rank(this.s,'bucket')-1)/2));this.notify('Вода пополнена');this.playSound('water');}
   this.save();this.render();return;
  }
  let chosen=null,score=Infinity;
  for(const cell of this.cells){const d=Math.abs(px-cell.x)/(cell.w/2)+Math.abs(py-cell.y)/(cell.h/2);if(d<=1&&d<score){chosen=cell;score=d;}}
  if(!chosen){
   const hits=(this.visualHits||[]).filter(o=>Math.abs(px-o.x)<o.w*.39&&py<o.y+o.h*.06&&py>o.y-o.h*.76);
   if(hits.length){const hit=hits.sort((a,b)=>Math.abs(py-a.y)-Math.abs(py-b.y))[0];chosen=this.cells.find(c=>c.i===hit.i)||null;}
  }
  if(!chosen){this.notify('Коснись участка земли');return;}
  const i=chosen.i,t=this.s.tiles[i],now=Date.now();this.selectedTile=i;
  if(t.building){this.playSound('click');this.openFarm(i);return;}
  if(this.s.tool==='building'){
   const cfg=OASIS_BUILDINGS[this.s.selectedBuilding];
   if(!cfg){this.notify('Выбери постройку');return;}
   if((cfg.unlock||1)>this.getLevel()){this.notify('Постройка откроется на уровне '+cfg.unlock);return;}
   if(t.crop||t.canal||t.building){this.notify('Клетка занята');return;}
   if(this.s.coins<cfg.cost){this.notify('Недостаточно монет для постройки');return;}
   this.s.coins-=cfg.cost;this.s.stats.buildingsBuilt=(this.s.stats.buildingsBuilt||0)+1;
   t.building=this.s.selectedBuilding;t.productionAt=0;this.s.tool='plant';
   this.notify(cfg.title+' построен!');this.playSound('build');this.save();this.render();this.renderQuests();return;
  }
  if(this.s.tool==='canal'){
   if(t.crop){this.notify('Клетка занята');return;}
   if(!t.canal){const price=OasisProgression.canalPrice(this.s);if(this.s.coins<price)this.notify('Недостаточно монет для канала');
    else{this.s.coins-=price;this.s.stats.canalsBuilt=(this.s.stats.canalsBuilt||0)+1;t.canal=true;this.notify('Канал построен!');this.playSound('canal');}}
   else{t.canal=false;this.s.coins+=Math.min(2,OasisProgression.canalPrice(this.s));this.notify('Канал разобран');this.playSound('canal');}
   this.save();this.render();this.renderQuests();if(t.canal)this.guideEvent('canalBuilt');return;
  }
  if(t.canal){this.notify('💧 Канал доставляет воду к грядкам');return;}
  if(!t.crop){
   if(!this.irrigated(i))this.notify('Сначала проведи канал от колодца к грядке');
   else{this.openPicker(i);this.guideEvent('openPlot');}
   this.render();return;
  }
  if(OasisTimeSystem.isReady(t,now)){
   const result=OasisEconomy.harvest(this.s,i,now);
   if(result.ok){this.notify(result.perennial?'Собрано +'+result.amount+'! Дерево продолжает расти.':'Собрано +'+result.amount+'! Одно семя вернулось в запас.');this.playSound('harvest');}
   else this.notify(result.reason);
  }else if(!t.watered){
   const crop=OASIS_CONFIG.crops[t.crop];
   if(this.s.water<crop.waterCost)this.notify('Недостаточно воды');
   else{this.s.water-=crop.waterCost;t.watered=true;t.plantedAt-=crop.growSeconds*200;this.notify('Грядка полита!');this.playSound('water');}
  }else this.notify('До урожая '+OasisTimeSystem.secondsLeft(t,now)+' сек.');
  this.save();this.render();this.renderQuests();
 }

 setupMapControls(){
  for(const button of document.querySelectorAll('#map-controls button'))button.addEventListener('click',()=>{
   const mode=button.dataset.map;
   this.manualMapZoom=true;
   if(mode==='reset'){this.mapZoom=1;this.panX=0;this.panY=0;this.notify('Карта показана целиком');}
   else this.changeZoom(mode==='in'?1.25:1/1.25);
   this.render();
  });
 }
 changeZoom(factor){
  this.manualMapZoom=true;
  const old=this.mapZoom||1;
  this.mapZoom=Math.min(3.5,Math.max(1,old*factor));
  if(this.mapZoom<=1){this.panX=0;this.panY=0;}
  this.clampPan();
 }
 clampPan(){
  const w=this.scale.width||390,h=this.scale.height||800;
  const n=OASIS_CONFIG.worldSize,{height,tw}=this.mapGeometry(w,h);
  const maxX=Math.max(12,(tw*n-w)/2+tw*.5);
  const maxY=Math.max(12,(tw*n*.52-height)/2+tw);
  this.panX=Math.max(-maxX,Math.min(maxX,this.panX||0));
  this.panY=Math.max(-maxY,Math.min(maxY,this.panY||0));
 }
 beginMapPointer(p){
  this.wasGesture=false;
  const a=this.input.pointer1,b=this.input.pointer2;
  if(a&&b&&a.isDown&&b.isDown){
   const dist=Math.hypot(a.x-b.x,a.y-b.y);
   this.pinchStart={dist,zoom:this.mapZoom};this.wasGesture=true;this.dragPointer=null;
  }else this.dragPointer={id:p.id,x:p.x,y:p.y,lastX:p.x,lastY:p.y,drag:false};
 }
 moveMapPointer(p){
  const a=this.input.pointer1,b=this.input.pointer2;
  if(a&&b&&a.isDown&&b.isDown){
   if(!this.pinchStart)this.pinchStart={dist:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:this.mapZoom};
   this.manualMapZoom=true;
   this.mapZoom=Math.min(3.5,Math.max(1,this.pinchStart.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,this.pinchStart.dist)));
   this.wasGesture=true;this.dragPointer=null;this.clampPan();this.queueMapRender?this.queueMapRender():this.render();return;
  }
  const drag=this.dragPointer;
  if(!drag||drag.id!==p.id)return;
  if(Math.hypot(p.x-drag.x,p.y-drag.y)>9)drag.drag=true;
  if(drag.drag){this.panX+=p.x-drag.lastX;this.panY+=p.y-drag.lastY;this.clampPan();this.queueMapRender?this.queueMapRender():this.render();}
  drag.lastX=p.x;drag.lastY=p.y;
 }
 endMapPointer(p){
  const dragging=this.dragPointer;
  if(this.pinchStart){this.pinchStart=null;this.wasGesture=true;this.dragPointer=null;return;}
  if(this.wasGesture){this.wasGesture=false;this.dragPointer=null;return;}
  if(dragging&&dragging.id===p.id){this.dragPointer=null;if(!dragging.drag)this.onMapTap(p);}
 }
 renderArtwork(i,t,x,y,tw,tileH){
  if(!this.add||typeof this.add.image!=='function'||!this.textures||!this.textures.exists)return false;
  let key=null,w=0,h=0;
  if(t.building){key='art-building-'+t.building;
   if(t.building==='sheep'){w=tw*1.95;h=tw*1.58;}
   else{w=tw*1.76;h=tw*1.46;}}
  else if(t.crop){key='art-'+t.crop+'-'+(OasisTimeSystem.isReady(t)||t.perennialEstablished?'ripe':'grow');
   const dimensions={watermelon:[1.52,1.08],clover:[1.08,.91],melon:[1.47,1.05],fig:[1.33,1.87],pomegranate:[1.34,1.84],dates:[1.55,2.20],olive:[1.45,1.9],sidr:[1.65,2.15],cumin:[1.1,.95],flowers:[1.1,.95],barley:[1.3,1.2],wheat:[1.3,1.25]};
   const d=dimensions[t.crop]||[1,1];w=tw*d[0];h=tw*d[1];
  }
  let spr=this.art[i];
  if(!key){if(spr)spr.setVisible(false);return true;}
  if(!this.textures.exists(key))return false;
  if(!spr){spr=this.add.image(0,0,key);spr.setOrigin(.5,.88);this.art[i]=spr;}
  if(spr.texture.key!==key)spr.setTexture(key);
  spr.setDisplaySize(w,h);spr.setPosition(x,y+tileH*.15+(t.crop&&['dates','fig','pomegranate','olive','sidr'].includes(t.crop)?Math.sin(Date.now()/1300+i)*Math.min(2,tw*.018):0));spr.setDepth(100+Math.round(y));
  spr.setVisible(true);
  if(OasisTimeSystem.getPhase()==='night')spr.setTint(0xb3b5d1);else spr.clearTint();
  return true;
 }
 renderWellSprite(x,y,tw,tileH){
  if(!this.add||typeof this.add.image!=='function'||!this.textures||!this.textures.exists('art-well'))return false;
  if(!this.wellSprite){this.wellSprite=this.add.image(x,y,'art-well').setOrigin(.5,.84).setDepth(100+Math.round(y));}
  this.wellSprite.setPosition(x,y+tileH*.17).setDisplaySize(tw*1.3,tw*1.51).setDepth(100+Math.round(y));
  if(OasisTimeSystem.getPhase()==='night')this.wellSprite.setTint(0xb3b5d1);else this.wellSprite.clearTint();
  return true;
 }

 neighbors(i){const r=Math.floor(i/OASIS_CONFIG.worldSize),c=i%OASIS_CONFIG.worldSize;return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([y,x])=>x>=0&&x<OASIS_CONFIG.worldSize&&y>=0&&y<OASIS_CONFIG.worldSize).map(([y,x])=>y*OASIS_CONFIG.worldSize+x);}
 calculateWater(){this.connected=new Set();const queue=[OASIS_CONFIG.wellIndex];const visited=new Set([OASIS_CONFIG.wellIndex]);while(queue.length){const i=queue.shift();for(const n of this.neighbors(i)){if(visited.has(n))continue;if(this.s.tiles[n]?.canal){visited.add(n);this.connected.add(n);queue.push(n);}}}}
 irrigated(i){const radius=OasisProgression.irrigationRadius(this.s);const origin=[OASIS_CONFIG.wellIndex,...this.connected];const row=Math.floor(i/OASIS_CONFIG.worldSize),col=i%OASIS_CONFIG.worldSize;return origin.some(n=>Math.abs(Math.floor(n/OASIS_CONFIG.worldSize)-row)+Math.abs(n%OASIS_CONFIG.worldSize-col)<=radius);}
 bindMarket(){
  document.getElementById('market-back').addEventListener('click',()=>this.closeMarket());
  document.querySelectorAll('.market-stall').forEach(b=>b.addEventListener('click',()=>this.renderMarketTab(b.dataset.stall)));
 }
 productName(id){const names={wool:'🧶 Шерсть',camelMilk:'🥛 Верблюжье молоко',honey:'🍯 Мёд',cuminOil:'🫙 Масло тмина',oliveOil:'🫒 Оливковое масло'};return names[id]||('📦 '+id);}
 marketRow(title,detail,actions){
  const row=document.createElement('div');row.className='market-product';
  const text=document.createElement('div');const top=document.createElement('div');top.className='item-title';top.textContent=title;
  const sub=document.createElement('div');sub.className='item-detail';sub.textContent=detail;text.append(top,sub);
  const buttons=document.createElement('div');buttons.className='item-actions';
  for(const action of actions){const b=document.createElement('button');b.textContent=action.text;b.disabled=!!action.disabled;b.addEventListener('click',action.onClick);buttons.append(b);}
  row.append(text,buttons);return row;
 }
 openMarket(stall='produce'){
  this.closeAllPanels();document.getElementById('quests-panel').hidden=true;
  document.getElementById('help-panel').hidden=true;
  document.getElementById('market-screen').hidden=false;this.marketOpen=true;
  this.renderMarketTab(stall);this.playSound('click');this.guideEvent('market');
 }
 closeMarket(){document.getElementById('market-screen').hidden=true;this.marketOpen=false;this.render();this.guideEvent('marketBack');}
 marketNotice(message){document.getElementById('market-message').textContent=message;}
 renderMarketTab(stall='produce'){
  if(!['produce','seeds','orders','tools','sadaka'].includes(stall))stall='produce';
  this.currentStall=stall;if(stall==='orders')this.guideEvent('orders');
  document.querySelectorAll('.market-stall').forEach(b=>b.classList.toggle('selected',b.dataset.stall===stall));
  const cfg={produce:['🏺 Торговый ряд','Продавай излишки урожая и готовой продукции.','Лавка 1/5'],seeds:['🌱 Семенная лавка','Покупай семена и саженцы для новых участков.','Лавка 2/5'],orders:['📜 Доска заказов','Шесть выгодных заказов: получай больше монет, чем от обычной продажи.','Лавка 3/5'],tools:['🔧 Мастерская','Улучшай инструменты и орошение.','Лавка 4/5'],sadaka:['🤲 Садака','Помощь нуждающимся.','Лавка 5/5']}[stall];
  document.getElementById('market-section-title').textContent=cfg[0];
  document.getElementById('market-section-desc').textContent=cfg[1];
  document.getElementById('market-location').textContent=cfg[2];
  OasisUI.currency(document.getElementById('market-coins'),this.s.coins);
  const rows=document.getElementById('market-items');rows.replaceChildren();this.marketNotice('');
  if(stall==='produce'){
   for(const [id,c] of [...Object.entries(OASIS_CONFIG.crops),...Object.entries(OASIS_BUILDINGS)]){
    const productId=c.product||id,count=this.s.inventory[productId]||0,price=c.sellPrice||c.price;
    const name=c.product?this.productName(c.product):c.icon+' '+c.title;
    const row=this.marketRow(name,'В амбаре: '+count+' · цена '+price+' 🪙/шт',[]);
    const actions=row.querySelector('.item-actions');
    const input=document.createElement('input'),sell=document.createElement('button'),all=document.createElement('button');
    input.type='number';input.min='1';input.step='1';input.max=String(count);input.inputMode='numeric';
    input.value=count?'1':'';input.disabled=count<1;input.setAttribute('aria-label','Количество для продажи — '+name);
    sell.type=all.type='button';all.textContent='Всё';all.disabled=count<1;
    const refresh=()=>{
     const qty=input.valueAsNumber,valid=Number.isInteger(qty)&&qty>=1&&qty<=count;
     sell.disabled=!valid;sell.textContent=valid?'Продать · '+qty*price+' 🪙':'Продать';
    };
    input.addEventListener('input',refresh);all.addEventListener('click',()=>{input.value=String(count);refresh();});
    const commit=()=>{
     if(sell.disabled)return;
     const result=OasisEconomy.sell(this.s,productId,input.valueAsNumber);
     if(!result.ok){this.marketNotice(result.reason);return;}
     const counter=document.getElementById('market-counter'),scroll=counter.scrollTop;
     this.save();this.playSound('sale');this.render();this.renderQuests();this.renderMarketTab(stall);
     counter.scrollTop=scroll;this.marketNotice('Продано '+result.quantity+' шт. · получено '+result.net+' монет');
    };
    sell.addEventListener('click',commit);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit();}});
    actions.append(input,all,sell);actions.classList.add('quantity-actions');rows.append(row);refresh();
   }
  }else if(stall==='seeds'){
   for(const [id,c] of Object.entries(OASIS_CONFIG.crops)){
    const unlock=c.unlock<=this.getLevel(),quantity=this.s.seedBank[id]||0;
    const name=c.icon+' '+(c.type==='perennial'?'Саженец: ':'Семена: ')+c.title;
    rows.append(this.marketRow(name,'В запасе: '+quantity+' · '+c.seedCost+' 🪙 за шт.'+(unlock?'':' · откроется на уровне '+c.unlock),[
     {text:'Купить 1',disabled:!unlock||this.s.coins<c.seedCost,onClick:()=>this.buyMarketSeed(id,1)},
     {text:'Купить 5',disabled:!unlock||this.s.coins<c.seedCost*5,onClick:()=>this.buyMarketSeed(id,5)}
    ]));
   }
   const available=Object.values(OASIS_CONFIG.crops).some(c=>c.type==='annual');

  }else if(stall==='orders'){
   OasisEconomy.ensureOrders(this.s);
   this.s.orders.forEach((o,i)=>{
    const crop=OASIS_CONFIG.crops[o.id],stock=this.s.inventory[o.id]||0;const title=crop?crop.icon+' '+crop.title:this.productName(o.id);
    rows.append(this.marketRow((o.kind||'Заказ')+' · '+title+' × '+o.quantity,'В амбаре: '+stock+' · награда '+o.reward+' 🪙 · выгоднее обычной продажи',[
     {text:'Отгрузить',disabled:stock<o.quantity,onClick:()=>{
      const result=OasisEconomy.completeOrder(this.s,i);
      if(!result.ok){this.marketNotice(result.reason);return;}
      this.save();this.playSound('coin');this.notify('Заказ выполнен! +'+result.net+' монет');this.render();this.renderQuests();this.renderMarketTab('orders');this.marketNotice('Заказ отправлен! Получено '+result.net+' монет');
     }}
    ]));
   });
  }else if(stall==='tools'){
   for(const [id,t] of Object.entries(OASIS_TOOLS)){
    const lv=OasisProgression.rank(this.s,id),cost=OasisProgression.toolPrice(this.s,id);
    rows.append(this.marketRow(t.icon+' '+t.title,'Уровень '+lv+'/10 · '+t.description,[
     {text:cost===null?'МАКС':'Улучшить · '+cost+' 🪙',disabled:cost===null||this.s.coins<cost,onClick:()=>{
      const result=OasisProgression.upgrade(this.s,id);
      if(!result.ok){this.marketNotice(result.reason);return;}
      this.save();this.playSound('upgrade');this.notify(t.title+' · уровень '+result.level);this.render();this.renderMarketTab('tools');this.marketNotice('Улучшение куплено за '+result.price+' монет');
     }}
    ]));
   }
  }else if(stall==='sadaka'){
   const summary=document.createElement('div');summary.className='barakat-summary';
   summary.textContent='Помощь нуждающимся';
   rows.append(summary);
   for(const q of OasisSadaka.list(this.s)){
    const detail=q.description+' · '+(q.coins?q.coins+' 🪙':q.amount+' '+this.productName(q.goods));
    const enough=q.coins?this.s.coins>=q.coins:(this.s.inventory[q.goods]||0)>=q.amount;
    rows.append(this.marketRow('🤲 '+q.title,detail,[{text:q.done?'Помощь оказана':'Помочь',disabled:q.done||!enough,onClick:()=>{
     const result=OasisSadaka.donate(this.s,q.id);
     if(!result.ok){this.marketNotice(result.reason);return;}
     this.save();this.playSound('quest');this.notify('Спасибо за помощь');this.render();this.renderMarketTab('sadaka');this.marketNotice('Помощь оказана');
    }}]));
   }
  }
 }
 buyMarketSeed(id,quantity){
  const result=OasisEconomy.buySeed(this.s,id,quantity);
  if(!result.ok){this.marketNotice(result.reason);return;}
  this.save();this.playSound('coin');this.render();this.renderMarketTab('seeds');
  this.marketNotice('Куплено '+quantity+' '+(quantity===1?'семя/саженец':'семян/саженцев')+' · -'+result.cost+' 🪙');
 }

 bindExtra(){
  for(const [name,fn] of [['picker',()=>this.closePanel('picker')],['upgrades',()=>this.closePanel('upgrades')]]){
   document.getElementById(name+'-close').addEventListener('click',fn);
   document.getElementById(name).addEventListener('click',e=>{if(e.target.id===name)fn();});
  }
 }
 closePanel(id){document.getElementById(id).hidden=true;}
 getLevel(){return OasisEconomy.level(this.s);}
 openPicker(tileIndex=null){
  const target=document.getElementById('picker-items');target.replaceChildren();
  const planting=Number.isInteger(tileIndex),lv=this.getLevel();
  document.getElementById('picker-help').textContent=planting?'Семена из запаса не требуют монет. После сбора вернётся семя или дерево продолжит расти.':'Выбери культуру для следующих посадок.';
  for(const [id,c] of Object.entries(OASIS_CONFIG.crops)){
   const quantity=this.s.seedBank[id]||0,unlocked=lv>=c.unlock;
   const row=document.createElement('div');row.className='market-row';
   const label=document.createElement('span');label.textContent=c.icon+' '+c.title+' · запас '+quantity;
   const hint=document.createElement('small');hint.textContent=(c.type==='perennial'?'Многолетнее · ':'Семя возвращается · ')+'урожай '+c.yield+' · рост ~'+Math.ceil(c.growSeconds/60)+' мин';label.append(hint);
   const b=document.createElement('button');b.textContent=!unlocked?'Ур. '+c.unlock:quantity<1?'Нет семян':planting?'Посадить':'Выбрать';
   b.disabled=!unlocked||quantity<1;
   b.addEventListener('click',()=>{
    if(planting){if(!this.irrigated(tileIndex)){this.notify('Сначала проведи канал');return;}
     const result=OasisEconomy.plant(this.s,tileIndex,id);
     if(!result.ok){this.notify(result.reason);return;}
     this.notify(c.title+' посажен. Семян осталось: '+this.s.seedBank[id]);this.playSound('plant');
    }else{this.s.selectedCrop=id;this.notify('Выбрано: '+c.title);}
    this.save();this.closePanel('picker');this.render();this.renderQuests();if(planting)this.guideEvent('planted');
   });
   row.append(label,b);target.append(row);
  }
  const go=document.createElement('button');go.className='primary-wide';go.textContent='🏺 Купить семена на торговой площади';
  go.addEventListener('click',()=>{this.closePanel('picker');this.openMarket('seeds');});target.append(go);
  document.getElementById('picker').hidden=false;
 }
 openUpgrades(){
  const target=document.getElementById('upgrade-items');target.replaceChildren();
  for(const [id,t] of Object.entries(OASIS_TOOLS)){
   const lv=OasisProgression.rank(this.s,id),cost=OasisProgression.toolPrice(this.s,id);
   const row=document.createElement('div');row.className='market-row';
   const info=document.createElement('span');info.textContent=t.icon+' '+t.title+' · '+lv+'/10';
   const hint=document.createElement('small');hint.textContent=t.description+(cost===null?' · максимальный уровень':' · следующее улучшение '+cost+' монет');info.append(hint);
   row.append(info);target.append(row);
  }
  const go=document.createElement('button');go.className='primary-wide';go.textContent='🏺 Перейти в мастерскую торговой площади';
  go.addEventListener('click',()=>{this.closePanel('upgrades');this.openMarket('tools');});target.append(go);
  document.getElementById('upgrades').hidden=false;
 }

 bindBuildings(){for(const id of ['buildings','farm']){document.getElementById(id+'-close').addEventListener('click',()=>this.closePanel(id));document.getElementById(id).addEventListener('click',e=>{if(e.target.id===id)this.closePanel(id);});}}
 openBuildings(){const target=document.getElementById('building-items');target.replaceChildren();for(const [id,c] of Object.entries(OASIS_BUILDINGS)){const row=document.createElement('div');row.className='market-row';const label=document.createElement('span');label.textContent=c.title+(window.OasisMapLayout?' · '+OasisMapLayout.buildingSize(id).slice().reverse().join('×')+' клетки':'')+' · '+c.cost+' 🪙 · '+c.feedAmount+' '+(OASIS_CONFIG.crops[c.feed]?.title||OasisFamilyLand.labels(c.feed))+' за цикл';const b=document.createElement('button');b.textContent=(c.unlock||1)>this.getLevel()?'Ур. '+c.unlock:'Выбрать';b.disabled=(c.unlock||1)>this.getLevel();b.addEventListener('click',()=>{this.resetEditDraft?.();this.s.tool='building';this.s.selectedBuilding=id;this.closePanel('buildings');this.notify('Выбери свободный участок и подтверди постройку');this.render();});row.append(label,b);target.append(row);}document.getElementById('buildings').hidden=false;}
 openFarm(i){const t=this.s.tiles[i],cfg=OASIS_BUILDINGS[t.building];if(!cfg)return;const ready=t.productionAt&&Date.now()>=t.productionAt,working=t.productionAt&&Date.now()<t.productionAt;document.getElementById('farm-title').textContent=cfg.title;document.getElementById('farm-status').textContent=ready?'Продукция готова!':working?'До готовности '+Math.ceil((t.productionAt-Date.now())/1000)+' сек.':'Нужно для производства: '+cfg.feedAmount+' '+(OASIS_CONFIG.crops[cfg.feed]?.title||cfg.feed)+(cfg.water?' и '+cfg.water+' воды':'');const target=document.getElementById('farm-actions');target.replaceChildren();const b=document.createElement('button');b.style.cssText='background:#33805a;color:white;border:0;padding:13px;border-radius:10px;font-weight:bold';b.textContent=ready?'Собрать продукцию':working?'Производство идёт':(['sheep','camel'].includes(t.building)?'Накормить и запустить':'Загрузить сырьё и запустить');b.disabled=!!working;b.addEventListener('click',()=>{if(ready){this.s.inventory[cfg.product]=(this.s.inventory[cfg.product]||0)+cfg.amount+(cfg.product==='wool'?OasisProgression.woolBonus(this.s):cfg.product==='camelMilk'?OasisProgression.milkBonus(this.s):0);t.productionAt=0;this.notify('Продукция добавлена в амбар!');this.playSound('collect');}else if(!working){if((this.s.inventory[cfg.feed]||0)<cfg.feedAmount||this.s.water<cfg.water){this.notify('Не хватает корма или воды');return;}this.s.inventory[cfg.feed]-=cfg.feedAmount;this.s.water-=cfg.water;t.productionAt=Date.now()+cfg.duration*1000;this.notify('Производство началось');this.playSound('plant');}this.save();this.render();this.openFarm(i);});target.append(b);document.getElementById('farm').hidden=false;}


 setupQuests(){
  const toggle=document.getElementById('quests-toggle'),panel=document.getElementById('quests-panel'),close=document.getElementById('quests-close');
  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)this.renderQuests();});
  close.addEventListener('click',()=>panel.hidden=true);
  this.renderQuests();
 }
 getQuests(){
  const stats=this.s.stats||{},sales=this.s.totalSold||0;
  return [
   {title:'Посади первое растение',value:stats.planted||0,goal:1,reward:15},
   {title:'Собери первый урожай',value:stats.harvested||0,goal:3,reward:20},
   {title:'Продай товаров на 50 монет',value:sales,goal:50,reward:25},
   {title:'Построй три канала',value:stats.canalsBuilt||0,goal:3,reward:30},
   {title:'Построй хозяйственное здание',value:stats.buildingsBuilt||0,goal:1,reward:45},
   {title:'Заработай 250 монет на торговой площади',value:sales,goal:250,reward:70}
  ];
 }
 renderQuests(){
  const target=document.getElementById('quests-list');if(!target)return;target.replaceChildren();
  const dailyHeading=document.createElement('h4');dailyHeading.textContent='☀️ Ежедневные задания · обновляются каждый день';target.append(dailyHeading);
  OasisDailyQuests.overview(this.s).forEach(q=>{
   const row=document.createElement('div');row.className='quest-row';
   const label=document.createElement('span');label.textContent=(q.claimed?'✓ ':'')+q.title+' ('+Math.floor(q.progress)+'/'+q.goal+')';
   const btn=document.createElement('button');btn.textContent=q.claimed?'Получено':q.progress>=q.goal?'Забрать +'+q.reward:'+'+q.reward+' 🪙';btn.disabled=q.claimed||q.progress<q.goal;
   btn.addEventListener('click',()=>{const result=OasisDailyQuests.claim(this.s,q.index);if(result.ok){this.save();this.notify('Ежедневная награда: +'+result.reward+' монет');this.playSound('quest');this.render();this.renderQuests();}});
   row.append(label,btn);target.append(row);
  });
  if(this.getQuests().some((_,i)=>!this.s.claimedQuests.includes(i))){const heading=document.createElement('h4');heading.textContent='🏅 Достижения · выполняются один раз';target.append(heading);}
  this.getQuests().forEach((q,i)=>{
   const done=this.s.claimedQuests.includes(i),complete=q.value>=q.goal;if(done)return;
   const row=document.createElement('div');row.className='quest-row';
   const label=document.createElement('span');label.textContent=(done?'✓ ':'')+q.title+' ('+Math.min(q.value,q.goal)+'/'+q.goal+')';
   const btn=document.createElement('button');btn.textContent=done?'Получено':complete?'Забрать +'+q.reward:'+'+q.reward+' 🪙';btn.disabled=done||!complete;
   btn.addEventListener('click',()=>{if(this.s.claimedQuests.includes(i)||this.getQuests()[i].value<q.goal)return;this.s.claimedQuests.push(i);this.s.coins+=q.reward;this.save();this.notify('Награда за достижение: +'+q.reward+' монет');this.playSound('quest');this.render();this.renderQuests();});
   row.append(label,btn);target.append(row);
  });
 }
 setupHelp(){
  const help=document.getElementById('help-toggle'),panel=document.getElementById('help-panel'),close=document.getElementById('help-close');
  if(help&&panel&&close){help.addEventListener('click',()=>panel.hidden=!panel.hidden);close.addEventListener('click',()=>panel.hidden=true);}
 }
 drawPalm(g,x,y,u){
  g.fillStyle(0x79502d);g.fillRect(x-u*.07,y-u*.52,u*.14,u*.54);
  g.lineStyle(Math.max(1,u*.075),0x347a43);
  for(let k=0;k<7;k++){const a=k*Math.PI*2/7;g.beginPath();g.moveTo(x,y-u*.55);g.lineTo(x+Math.cos(a)*u*.47,y-u*.56+Math.sin(a)*u*.25);g.strokePath();}
  g.fillStyle(0xc58b35);g.fillCircle(x+u*.08,y-u*.4,Math.max(2,u*.06));
 }
 drawCrop(g,t,x,y,tw,tileH){
  const c=OASIS_CONFIG.crops[t.crop];if(!c)return;
  const ready=OasisTimeSystem.isReady(t),u=tw*.22;
  if(t.crop==='dates'){this.drawPalm(g,x,y,u*2.0);return;}
  g.fillStyle(0x7d9b47,.42);g.fillEllipse(x,y+tileH*.13,tw*.58,tileH*.42);
  if(t.crop==='clover'){for(let j=0;j<4;j++){const a=j*1.57;g.fillStyle(ready?0x7dce4c:0x4c9945);g.fillCircle(x+Math.cos(a)*u*.55,y+Math.sin(a)*u*.24,u*.37);}}
  else if(t.crop==='fig'||t.crop==='pomegranate'){
   g.fillStyle(0x7c5235);g.fillRect(x-u*.08,y-u*.8,u*.16,u*.85);
   for(let j=0;j<5;j++){g.fillStyle(j%2?0x2c844c:0x4eab56);g.fillCircle(x+(j-2)*u*.37,y-u*.8+(j%2)*u*.18,u*.54);}
   if(ready){for(let j=0;j<3;j++){g.fillStyle(t.crop==='fig'?0x81519b:0xd54439);g.fillCircle(x+(j-1)*u*.44,y-u*.65+(j%2)*u*.3,u*.2);}}
  }else{
   for(let j=0;j<3;j++){g.fillStyle(0x318448);g.fillEllipse(x+(j-1)*u*.6,y+tileH*.02,u*.8,u*.4);}
   if(ready){for(let j=0;j<2;j++){g.fillStyle(t.crop==='melon'?0xeac85b:0x3e9951);g.fillEllipse(x+(j-.5)*u*.72,y-tileH*.06,u*.82,u*.62);g.lineStyle(Math.max(1,tw*.018),t.crop==='melon'?0xcaa147:0x2b6c3d);g.strokeEllipse(x+(j-.5)*u*.72,y-tileH*.06,u*.82,u*.62);}}
  }
  if(!ready){const elapsed=Math.max(0,Date.now()-t.plantedAt),pct=Math.min(1,elapsed/(c.growSeconds*1000));g.fillStyle(0x473e29,.65);g.fillRect(x-tw*.2,y+tileH*.32,tw*.4,Math.max(2,tw*.035));g.fillStyle(0x74c75d);g.fillRect(x-tw*.2,y+tileH*.32,tw*.4*pct,Math.max(2,tw*.035));}
 }
 drawBuilding(g,t,x,y,tw,tileH){
  const sheep=t.building==='sheep',u=tw;
  g.fillStyle(0x4d3524,.25);g.fillEllipse(x,y+tileH*.27,u*.75,tileH*.52);
  if(sheep){
   g.fillStyle(0x4b3930);g.fillTriangle(x-u*.34,y+tileH*.12,x,y-tileH*.86,x+u*.34,y+tileH*.12);
   g.fillStyle(0x715244);g.fillRect(x-u*.28,y-tileH*.08,u*.56,tileH*.32);
   g.fillStyle(0x2d2522);g.fillTriangle(x-u*.1,y+tileH*.2,x,y-tileH*.2,x+u*.1,y+tileH*.2);
   g.lineStyle(Math.max(1,u*.025),0xb68d65);g.lineBetween(x-u*.32,y+tileH*.12,x+u*.32,y+tileH*.12);
  }else{
   g.fillStyle(0xb47c4b);g.fillRect(x-u*.3,y-tileH*.48,u*.6,tileH*.69);
   g.fillStyle(0x8b5537);g.fillTriangle(x-u*.38,y-tileH*.48,x,y-tileH*.83,x+u*.38,y-tileH*.48);
   g.fillStyle(0x5b3c2b);g.fillRect(x-u*.12,y-tileH*.15,u*.24,tileH*.37);
   g.lineStyle(Math.max(1,u*.02),0xe4b476);g.strokeRect(x-u*.3,y-tileH*.48,u*.6,tileH*.69);
  }
  if(t.productionAt){g.fillStyle(Date.now()>=t.productionAt?0xffd36c:0x4eb2c8);g.fillCircle(x+u*.27,y-tileH*.8,Math.max(3,u*.085));}
 }
 mapGeometry(w,h){
  const landscape=w>h&&h<=560;
  const top=landscape?58:94,bottom=landscape?62:118;
  const height=Math.max(70,h-top-bottom),n=OASIS_CONFIG.worldSize;
  const tw=Math.max(4,Math.min((w-26)/(n+1),(height)/(n*.52+1.1)))*(this.mapZoom||1);
  return {top,height,tw};
 }
 renderGround(w,h){
  if(!this.add||typeof this.add.image!=='function'||!this.textures?.exists?.('art-ground'))return false;
  if(!this.groundSprite){this.groundSprite=this.add.image(0,0,'art-ground').setOrigin(.5).setDepth(-10);}
  this.groundSprite.setPosition(w/2,h/2).setDisplaySize(w,h);
  if(OasisTimeSystem.getPhase()==='night')this.groundSprite.setTint(0x77849a);
  else this.groundSprite.clearTint();
  return true;
 }
 drawSandDecoration(g,x,y,tw,th,i){
  // Decorative rocks and dry tufts are deterministic and have no gameplay collision.
  if(i%19===3||i%27===12){
   const shift=(i%3-1)*tw*.13;
   g.fillStyle(0xa8784d,.24);g.fillEllipse(x+shift,y+th*.20,tw*.27,th*.24);
   g.fillStyle(0xe8cf94,.65);g.fillEllipse(x+shift-tw*.04,y+th*.11,tw*.16,th*.18);
   g.lineStyle(Math.max(1,tw*.018),0x5b8753,.67);
   for(let k=-1;k<=1;k++)g.lineBetween(x+shift+k*tw*.033,y+th*.15,x+shift+k*tw*.07,y-th*.13+(k%2)*th*.03);
  }else if(i%11===5){
   g.lineStyle(Math.max(1,tw*.015),0x6f9355,.4);
   g.lineBetween(x-tw*.10,y+th*.14,x-tw*.12,y-th*.05);
   g.lineBetween(x-tw*.10,y+th*.14,x-tw*.025,y-th*.02);
  }
 }
 drawCultivatedSoil(g,x,y,tw,th){
  // Low, organic soil beds appear only around actual crops (no visible tile borders).
  g.fillStyle(0x6f4c2a,.20);g.fillEllipse(x+tw*.025,y+th*.21,tw*.79,th*.66);
  g.fillStyle(0x926237,.50);g.fillEllipse(x,y+th*.12,tw*.76,th*.61);
  g.fillStyle(0xb77d45,.45);g.fillEllipse(x-tw*.03,y+th*.055,tw*.70,th*.45);
  g.lineStyle(Math.max(1,tw*.013),0x6d4b2d,.30);
  for(let k=-1;k<=1;k++)g.lineBetween(x-tw*.26,y+th*(.08+k*.07),x+tw*.24,y+th*(.08+k*.07));
 }
 drawFence(g,ox,oy,tw,th,n){
  const points=[{x:ox,y:oy-th/2},{x:ox+n*tw/2,y:oy+(n-1)*th/2},{x:ox,y:oy+(n-1)*th+th/2},{x:ox-n*tw/2,y:oy+(n-1)*th/2}];
  g.lineStyle(Math.max(3,tw*.07),0x8a5834,.9);
  for(let k=0;k<4;k++){
   const a=points[k],b=points[(k+1)%4];g.lineBetween(a.x,a.y,a.x+(b.x-a.x)*.48,a.y+(b.y-a.y)*.48);
   g.lineBetween(a.x+(b.x-a.x)*.54,a.y+(b.y-a.y)*.54,b.x,b.y);
   const segments=n*2;
   for(let j=0;j<=segments;j++){
    if(j===segments/2)continue;
    const x=a.x+(b.x-a.x)*j/segments,y=a.y+(b.y-a.y)*j/segments;
    g.lineStyle(Math.max(2,tw*.05),0x664229,.96);g.lineBetween(x,y-th*.23,x,y+th*.11);
    g.fillStyle(0xb9864e);g.fillCircle(x,y-th*.24,Math.max(2,tw*.043));
   }
  }
 }
 drawCanal(g,r,c,i,x,y,tw,th){
  const wet=this.connected.has(i),n=this.neighbors(i).filter(j=>j===OASIS_CONFIG.wellIndex||this.s.tiles[j]?.canal);
  const links=n.length?n:[i];
  // Isometric stone-lined water channels; unconnected ends are dry.
  for(const j of links){
   const nr=Math.floor(j/OASIS_CONFIG.worldSize),nc=j%OASIS_CONFIG.worldSize;
   const dx=j===i?tw*.16:((nc-c)-(nr-r))*tw*.25;
   const dy=j===i?th*.08:((nc-c)+(nr-r))*th*.25;
   const x2=x+dx,y2=y+dy;
   g.lineStyle(Math.max(6,tw*.24),0x96704d,.92);g.lineBetween(x,y+th*.045,x2,y2+th*.045);
   g.lineStyle(Math.max(5,tw*.195),0xe8c28a,1);g.lineBetween(x,y,x2,y2);
   g.lineStyle(Math.max(3,tw*.135),wet?0x257fa3:0x9b8265,1);g.lineBetween(x,y,x2,y2);
   if(wet){g.lineStyle(Math.max(1,tw*.035),0x9ce8e9,.68);g.lineBetween(x-tw*.015,y-th*.014,x2-tw*.015,y2-th*.014);}
  }
  g.fillStyle(0xc8a06f,1);g.fillEllipse(x,y,tw*.29,th*.44);
  g.fillStyle(wet?0x359ec1:0xb69b78,1);g.fillEllipse(x,y,tw*.205,th*.31);
  if(wet){const pulse=(Math.sin(Date.now()/700+i*1.13)+1)/2;
   g.fillStyle(0xc5ffff,.5+pulse*.28);g.fillEllipse(x-tw*.025,y-th*.035,Math.max(2,tw*.07),Math.max(1,th*.08));}
 }
 render(){
  if(!this.s)return;
  const g=this.g,ui=this.overlay||g,w=this.scale.width,h=this.scale.height,night=OasisTimeSystem.getPhase()==='night';
  g.clear();if(ui!==g)ui.clear();
  if(!this.renderGround(w,h)){g.fillStyle(night?0x625a48:0xebc88a);g.fillRect(0,0,w,h);}
  this.cells=[];this.visualHits=[];this.calculateWater();if(this.audio)this.audio.setPhase(OasisTimeSystem.getPhase());
  const {top,height:availH,tw}=this.mapGeometry(w,h),cols=OASIS_CONFIG.worldSize,rows=cols,tileH=tw*.5;
  const ox=w/2+(this.panX||0),oy=top+(availH-rows*tileH)/2+(this.panY||0);
  this.well=null;
  this.drawFence(g,ox,oy,tw,tileH,cols);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
   const i=r*cols+c,t=this.s.tiles[i],x=ox+(c-r)*tw/2,y=oy+(c+r)*tileH/2;
   if(x < -tw*5 || x > w+tw*5 || y < -tw*2 || y > h+tw*6){this.art?.[i]?.setVisible(false);continue;}
   const points=[{x,y:y-tileH/2},{x:x+tw/2,y},{x,y:y+tileH/2},{x:x-tw/2,y}];
   const isWell=i===OASIS_CONFIG.wellIndex;
   // Transparent cells preserve the full 10x10 logical grid, but do not expose a checkerboard.
   if(['canal','building','move'].includes(this.s.tool)){
    g.lineStyle(Math.max(.6,tw*.014),0x8b694b,.17);g.strokePoints(points,true);
   }
   if(!t.crop&&!t.canal&&!t.building&&!isWell&&!window.OasisFamilyLand?.isHome(this.s,i)&&window.OasisMapLayout?.buildingAt(this.s,i)==null)this.drawSandDecoration(g,x,y,tw,tileH,i);
   if(t.crop&&!t.perennialEstablished&&(Date.now()-t.plantedAt)<OASIS_CONFIG.crops[t.crop].growSeconds*120)this.drawCultivatedSoil(g,x,y,tw,tileH);
   if(this.s.tool!=='plant'&&this.irrigated(i)&&!t.crop&&!t.canal&&!t.building&&!isWell&&window.OasisMapLayout?.buildingAt(this.s,i)==null&&!window.OasisFamilyLand?.isHome(this.s,i)){
    g.fillStyle(0x5e994e,.34);g.fillEllipse(x,y+tileH*.10,Math.max(2,tw*.09),Math.max(1,tileH*.13));
   }
   if(t.canal&&!window.OasisWell?.inside(this.s,i))this.drawCanal(g,r,c,i,x,y,tw,tileH);
   if(!this.renderArtwork(i,t,x,y,tw,tileH)){
    if(t.building)this.drawBuilding(g,t,x,y,tw,tileH);
    if(t.crop)this.drawCrop(g,t,x,y,tw,tileH);
   }
   if(t.crop){
    if(OasisTimeSystem.isReady(t)){
     // Mature crops are visually distinguishable by the full-color sprite; no bright yellow dots.
    }else{
     const sec=OASIS_CONFIG.crops[t.crop].growSeconds;
     const pct=Math.min(1,Math.max(0,(Date.now()-t.plantedAt)/(sec*1000)));
     ui.fillStyle(0x59482c,.65);ui.fillRoundedRect(x-tw*.22,y+tileH*.4,tw*.44,Math.max(2,tw*.043),tw*.02);
     ui.fillStyle(0x72c95b);ui.fillRoundedRect(x-tw*.22,y+tileH*.4,tw*.44*pct,Math.max(2,tw*.043),tw*.02);
    }
   }
   if(this.selectedTile===i){ui.lineStyle(Math.max(2,tw*.035),0xfff0a4,.95);ui.strokePoints(points,true);}
   if(isWell){
    if(window.OasisMapLayout)this.drawCanal(g,r,c,i,x,y,tw,tileH);
    if(!this.renderWellSprite(x,y,tw,tileH)){
     g.fillStyle(0x9c683b);g.fillEllipse(x,y+tileH*.08,tw*.5,tileH*.65);
     g.fillStyle(0x654326);g.fillCircle(x,y,tw*.22);g.fillStyle(0x4aa7ba);g.fillCircle(x,y,tw*.14);
    }
    this.well={x,y,w:tw*.78,h:tw*.84};
   }else{
    this.cells.push({i,x,y,w:tw,h:tileH});
    if(t.crop||t.building){const tall=t.building?tw*1.4:(['dates','fig','pomegranate','olive','sidr'].includes(t.crop)?tw*1.8:tw*.9);
     this.visualHits.push({i,x,y,w:tw*1.2,h:tall});
    }
   }
  }
  document.getElementById('phase').textContent=(night?'🌙 Ночь':'☀️ День')+' · v'+OASIS_CONFIG.version;
  document.getElementById('mode-chip').textContent=this.s.tool==='canal'?'💧 Прокладывай каналы · нажимай землю':this.s.tool==='building'?'🏠 Выбери место для постройки':'🌱 Коснись земли, чтобы посадить';
  OasisUI.currency(document.getElementById('resources'),this.s.coins);
  document.getElementById('inventory').textContent='Уровень '+this.getLevel()+'/20'+' · Семена '+Object.values(this.s.seedBank).reduce((a,v)=>a+v,0)+' · Амбар '+Object.values(this.s.inventory).reduce((a,v)=>a+v,0)+' · Каналы '+this.s.tiles.filter(t=>t.canal).length;
  document.querySelectorAll('#toolbar button').forEach(b=>b.classList.toggle('active',b.dataset.action==='build'&&this.s.tool!=='plant'));if(this.guideActive)this.positionGuide();
 }

}
