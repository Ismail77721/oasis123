/* Approved art, mobile layout, and a non-blocking chapter tutorial. */
(function(){'use strict';
const M=MainScene.prototype,$=id=>document.getElementById(id),L=OasisMapLayout,P=OasisPlacement34;
const editing=s=>['canal','building','move','remove'].includes(s.tool);
const previousPlace=M.placeCartoon;
M.placeCartoon=function(sprite,key,x,y,tw,th,rows,cols,flipped=false){
 const a=P[key];if(!a)return previousPlace.call(this,sprite,key,x,y,tw,th,rows,cols);
 const scale=a.scale*tw/40,cx=x+(cols-rows)*tw/4,cy=y+(rows+cols-2)*th/4,sign=flipped?-1:1;
 return sprite.setTexture('cartoon-'+key).setOrigin(.5).setFlipX(flipped)
  .setPosition(cx+sign*(a.width/2-a.centerPixel[0])*scale,cy+(a.height/2-a.centerPixel[1])*scale)
  .setDisplaySize(a.width*scale,a.height*scale).setDepth(100+cy).setVisible(true).setAlpha(editing(this.s)?.35:1);
};
const artwork=M.renderArtwork;M.renderArtwork=function(i,t,x,y,tw,th){
 if(!t.building)return artwork.call(this,i,t,x,y,tw,th);
 const key=t.building+'-'+(Math.min(3,t.buildingLevel||1)-1),[rows,cols]=L.buildingSize(t.building,t.buildingRotated);
 const sprite=this.art[i]||(this.art[i]=this.add.image(0,0,'cartoon-'+key));
 this.placeCartoon(sprite,key,x,y,tw,th,rows,cols,!!t.buildingRotated);return true;
};
M.drawHouseImage=function(){const h=this.s.house,c=this.cellPosition(h.row*this.s.worldSize+h.col),key='home-'+(Math.min(5,h.level||1)-1),side=OasisFamilyLand.houseSide(h);this.homeSprite||=this.add.image(0,0,'cartoon-'+key);this.placeCartoon(this.homeSprite,key,c.x,c.y,c.w,c.h,side,side,!!h.flipped);};
M.renderWellSprite=function(x,y,tw,th){const key='well-'+(Math.min(3,this.s.wellLevel||1)-1),side=this.s.wellSize||4;this.wellSprite||=this.add.image(0,0,'cartoon-'+key);this.placeCartoon(this.wellSprite,key,x,y,tw,th,side,side,!!this.s.wellFlipped);return true;};
const preview=M.drawEditPreview;M.drawEditPreview=function(){preview.call(this);this.ghost34?.setVisible(false);if(!['building','move'].includes(this.s.tool)||this.editTarget==null)return;const o=this.s.tool==='building'?{kind:'building',id:this.s.selectedBuilding}:this.editObject;if(!o||!['home','well','building'].includes(o.kind))return;const t=this.s.tiles[o.anchor],flipped=!!(this.editRotation??(o.kind==='home'?this.s.house.flipped:o.kind==='well'?this.s.wellFlipped:t?.buildingRotated));let key,rows,cols;if(o.kind==='home'){key='home-'+(Math.min(5,this.s.house.level||1)-1);rows=cols=OasisFamilyLand.houseSide(this.s.house);}else if(o.kind==='well'){key='well-'+(Math.min(3,this.s.wellLevel||1)-1);rows=cols=this.s.wellSize||4;}else{const id=o.id||t?.building;key=id+'-'+(Math.min(3,t?.buildingLevel||this.s.packedBuildings?.[this.packedSelection]?.buildingLevel||1)-1);[rows,cols]=L.buildingSize(id,flipped);}if(!P[key])return;const c=this.cellPosition(this.editTarget);this.ghost34||=this.add.image(0,0,'cartoon-'+key);this.placeCartoon(this.ghost34,key,c.x,c.y,c.w,c.h,rows,cols,flipped).setAlpha(.85).setDepth(9000);if(this.s.tool==='move'){if(o.kind==='home')this.homeSprite?.setAlpha(.12);else if(o.kind==='well')this.wellSprite?.setAlpha(.12);else this.art[o.anchor]?.setAlpha(.12);}};
const farm=M.openFarm;M.openFarm=function(i,...a){const r=farm.call(this,i,...a);return r;};
const guard=M.updateGuard;M.updateGuard=function(){const before=this.limitRemaining34;guard.call(this);const left=OasisPlayLimit.remaining(OasisPlayLimit.read());if(before!=null&&[300000,60000,0].some(t=>before>t&&left<=t))this.audio?.play('time_limit');this.limitRemaining34=left;};
const remove=OasisFarmSystems.dismantle;OasisFarmSystems.dismantle=function(...args){const r=remove.apply(this,args);return r;};
const uproot=OasisFarmSystems.uproot;OasisFarmSystems.uproot=function(...args){const r=uproot.apply(this,args);if(r.ok)OasisAudio.play('remove');return r;};
const upgrades=OasisProgression.upgrade;OasisProgression.upgrade=function(...args){const r=upgrades.apply(this,args);if(r.ok)OasisAudio.play('tool_upgrade');return r;};
// Voice files are optional: only explicitly mapped clips are loaded. Text always remains.
window.OasisNarrationFiles=window.OasisNarrationFiles||{};
M.stopNarration=function(){this.narration34?.pause();this.narration34=null;};
M.playNarration=function(id){this.stopNarration();const file=OasisNarrationFiles[id];if(!file||!this.audio?.enabled)return;const clip=this.narration34=new Audio(file);clip.volume=this.audio.volume;clip.play().catch(()=>{});};
const info=(id,text,target,prepare)=>({id,text,target,prepare});
const action=(id,text,target,event)=>({id,text,target,event});
const chapters=[
 {id:'basics',title:'Начало и посадка',steps:[
 info('welcome','Добро пожаловать в оазис! Передвигай карту пальцем. Кнопки справа меняют масштаб, а домик возвращает общий вид.','#map-controls'),
 info('navigation','Слева — строительство, амбар, задания и торговая поездка. Монеты показаны справа вверху.','#toolbar'),
 action('choose_plot','Нажми на свободный подсвеченный участок у воды, чтобы выбрать культуру.','plot','openPlot'),
 action('choose_seed','Выбери доступную культуру. Для посадки нужны семена из запаса.','#picker-items .crop-choice:not(:disabled)','seedChosen'),
 action('plant','Нажми «Посадить». Если семян не осталось, этот шаг можно пропустить и купить семена на рынке.','#plant-confirm','planted'),
 info('harvest','Созревший урожай отмечается галочкой. Нажми на грядку, чтобы собрать его. Семена однолетних культур возвращаются при сборе.'),
 info('trees','Деревья продолжают плодоносить после сбора. Новые саженцы при этом не появляются.'),
 info('storage','В амбаре видны семена, сырьё и готовая продукция. Здесь удобно проверить запас перед покупкой или производством.','#storage-items',s=>s.openStorage())]},
 {id:'water',title:'Вода и каналы',steps:[
 info('well','Колодец снабжает хозяйство водой. Открой его, чтобы увидеть доступное улучшение и стоимость.',null,s=>s.openWell()),
 action('build_menu','Открой «Строить».','#toolbar [data-action="build"]','buildMenu'),
 action('canal_mode','Выбери «Каналы».','#build-menu [data-build="canal"]','canalMode'),
 info('canal_route','Отмечай клетки по одной, начиная рядом с колодцем или соединённым каналом. Повторное нажатие убирает клетку из выбора.','#edit-controls'),
 info('canal_confirm','Сумма появится на кнопке подтверждения. Строй только при достаточном запасе монет; неподходящие клетки будут отмечены.','#edit-apply'),
 info('water_reach','Орошение распространяется от колодца и соединённых каналов. Улучшение лопаты увеличивает охват грядок.')]},
 {id:'buildings',title:'Постройки и перестановка',steps:[
 info('building_list','Выбери здание в списке. Здесь указаны стоимость и необходимое сырьё.','#building-items',s=>s.openBuildings()),
 info('building_place','После выбора нажми на свободный участок. Подсветка показывает всю занятую площадь, включая запас вокруг основания.'),
 info('building_rotate','«Развернуть вход» меняет сторону входа и площадку вытянутой постройки. Проверь положение и подтверди.'),
 info('building_move','В разделе «Переставить» выбери объект и новое свободное место. Рост и работа при редактировании приостанавливаются.','#build-menu',s=>s.openBuildMenu()),
 info('building_remove','«Расчистка» удаляет выбранный объект. Перед подтверждением прочитай условия; удаление отличается от переноса.'),
 info('building_levels','Открой построенное здание, чтобы посмотреть производство и улучшения. Доступность зависит от уровня хозяйства и запасов.')]},
 {id:'production',title:'Производство',steps:[
 info('production_start','Для запуска открой здание. Проверь сырьё и воду, затем запусти цикл. Готовую продукцию нужно собрать в амбар.'),
 info('production_sheep','Шатёр для овец расходует клевер и даёт шерсть. В загоне для верблюдов получают молоко.'),
 info('production_apiary','Пасеке нужны цветы; её продукция — мёд.'),
 info('production_oils','Пресс для тминного масла перерабатывает тмин. Оливковому прессу нужны оливки.'),
 info('production_mill','Мельница перерабатывает пшеницу в муку. Ткацкая мастерская использует шерсть для изготовления ткани.'),
 info('production_ready','Галочка над зданием означает готовую продукцию. Если запасов не хватает, окно подскажет, что нужно добавить.')]},
 {id:'home',title:'Дом и работник',steps:[
 info('home_family','В доме собраны потребности семьи, улучшение дома и управление работником.','#home-panel',s=>s.openHome()),
 info('home_needs','Проверяй текущую потребность семьи и доступные способы её обеспечить. Стоимость показывается перед действием.','#home-panel'),
 action('worker_open','Открой «Задания работнику» в доме.','#home-worker-open','workerOpen'),
 info('worker_hire','Здесь указаны стоимость найма и оплата за игровой день. Нанимай работника, когда готов оплачивать его труд.','#worker-hire'),
 info('worker_tasks','Отметь нужные культуры и здания в списках посадки, сбора, продукции и кормления. Изменения сохраняются сразу.','#worker-body'),
 info('worker_pause','Работу можно приостановить или предоставить выходной. Для заданий по-прежнему нужны семена, корм и другие ресурсы.','#worker-pause')]},
 {id:'market',title:'Покупка и продажа',steps:[
 action('market_go','Открой «Торговая поездка».','#toolbar [data-action="market"]','market'),
 info('market_square','Лавки разделены по назначению: продажа урожая, семена, инструменты, заказы и помощь.','#market-square'),
 info('market_seeds','В лавке семян выбери культуру и количество. Проверь сумму перед покупкой.','#market-items',s=>s.renderMarketTab('seeds')),
 info('market_sell','В лавке урожая выбери товар из амбара и количество для продажи. После продажи запас уменьшается, а монеты начисляются.','#market-items',s=>s.renderMarketTab('produce')),
 info('market_return','Кнопка сверху возвращает на площадь, а с площади — на ферму.','#market-back')]},
 {id:'orders',title:'Заказы, задания и помощь',steps:[
 info('orders_list','В заказе указаны нужные товары, твой запас и награда. Выполняй заказ, когда собраны все товары.','#market-items',s=>{s.openMarket();s.renderMarketTab('orders');}),
 info('quests','Раздел «Задания» показывает цели хозяйства и награды. Проверяй прогресс и забирай доступные награды.','#toolbar [data-action="quests"]',s=>s.closeMarket()),
 info('charity','В разделе помощи можно добровольно поддержать нуждающихся. Прочитай обращение и выбери доступный вклад.','#market-items',s=>{s.openMarket();s.renderMarketTab('sadaka');}),
 info('charity_choice','Размер помощи выбираешь ты. Необязательно отдавать последние запасы: можно вернуться к обращению позже.')]},
 {id:'tools',title:'Инструменты и настройки',steps:[
 info('tools_shop','В лавке инструментов видны текущие уровни, действие улучшений и цена. Прочитай описание перед покупкой.','#market-items',s=>{s.openMarket();s.renderMarketTab('tools');}),
 info('settings_menu','Настройки открываются из главного меню. Там можно настроить звук и родительский контроль.',null,s=>s.closeMarket()),
 info('play_limit','Дневной лимит меняется по PIN. Игра предупредит за пять минут и за минуту до окончания времени.'),
 info('save','Прогресс сохраняется автоматически на этом устройстве. Чтобы вернуться к хозяйству, выбери «Продолжить» в меню.'),
 info('tutorial_end','Любую главу можно повторить через «Обучение» в меню. Развивай оазис в удобном темпе!')]}
];
window.OasisTutorial34=chapters;
M.openTutorial=function(){this.stopNarration();this.guideActive=false;$('live-guide').hidden=true;$('guide-ring').hidden=true;this.closeAllPanels();$('start-menu').hidden=true;this.s.tutorialDone=true;this.save();let panel=$('tutorial-chapters34');if(!panel){panel=document.createElement('section');panel.id='tutorial-chapters34';panel.className='ui-modal';panel.innerHTML='<div class="market-card"><div class="dialog-header33"><button class="close-modal" aria-label="Закрыть">×</button><h2>Обучение</h2></div><p>Выбери главу. Её можно прервать и повторить в любое время.</p><div class="chapter-grid34"></div></div>';document.body.append(panel);panel.querySelector('button').onclick=()=>panel.hidden=true;for(const ch of chapters){const b=document.createElement('button');b.textContent=ch.title;b.onclick=()=>{panel.hidden=true;this.startChapter34(ch.id);};panel.querySelector('.chapter-grid34').append(b);}}panel.hidden=false;};
M.startChapter34=function(id){this.closeAllPanels();if(this.marketOpen)this.closeMarket();this.plantMode=false;this.s.tool='plant';this.resetEditDraft();this.guideChapter34=chapters.find(x=>x.id===id)||chapters[0];this.s.tutorialStep=0;this.guideActive=true;this.showGuideStep();};
M.guideSteps=function(){return(this.guideChapter34||chapters[0]).steps;};
M.nextTutorial=function(force=false){if(!this.guideActive)return;const step=this.guideSteps()[this.s.tutorialStep];if(step?.event&&!force)return;this.s.tutorialStep++;if(this.s.tutorialStep>=this.guideSteps().length)this.finishTutorial(true);else this.showGuideStep();};
M.guideEvent=function(event){if(!this.preparingGuide34&&this.guideActive&&this.guideSteps()[this.s.tutorialStep]?.event===event)this.nextTutorial(true);};
M.finishTutorial=function(completed=false){this.stopNarration();this.guideActive=false;$('live-guide').hidden=true;$('guide-ring').hidden=true;if(completed){this.s.completedChapters34||=[];const id=(this.guideChapter34||chapters[0]).id;if(!this.s.completedChapters34.includes(id))this.s.completedChapters34.push(id);this.s.tutorialDone=true;this.notify('Глава завершена. Другие главы доступны в меню обучения.');}this.save();};
M.showGuideStep=function(){if(!this.guideActive)return;const step=this.guideSteps()[this.s.tutorialStep];if(!step)return this.finishTutorial(true);this.preparingGuide34=true;if(step.target?.startsWith("#toolbar")){this.closeAllPanels();if(this.marketOpen)this.closeMarket();this.plantMode=false;this.s.tool="plant";this.render();}if(step.id==="harvest"){this.plantMode=false;this.render();}step.prepare?.(this);this.preparingGuide34=false;if(step.target==='plot'){this.mapZoom=Math.max(this.mapZoom,2);const b=this.guideBounds34(step);if(b){this.panX=(this.panX||0)+this.scale.width*.45-(b.left+b.width/2);this.panY=(this.panY||0)+this.scale.height*.5-(b.top+b.height/2);}this.render();}$('live-guide').hidden=false;$('guide-mentor').textContent=(this.s.profile?.gender==='female'?'Аиша':'Саид')+' · '+(this.guideChapter34||chapters[0]).title;$('guide-progress').textContent=(this.s.tutorialStep+1)+'/'+this.guideSteps().length;$('guide-body').textContent=step.text;$('guide-next').hidden=!!step.event;$('guide-next').textContent=this.s.tutorialStep===this.guideSteps().length-1?'Завершить':'Далее';$('guide-skip').textContent=step.event?'Пропустить шаг':'Закрыть';this.playNarration(step.id);this.positionGuide();};
// Choose a free irrigated plot, not a tile inside the well footprint.
M.guideBounds34=function(step){
 if(step.target==='plot'){this.calculateWater();const n=this.s.worldSize,well=OASIS_CONFIG.wellIndex;let best=null,dist=Infinity;for(let i=0;i<this.s.tiles.length;i++){if(!this.irrigated(i)||!L.check(this.s,i,{kind:'crop'}).ok)continue;const d=Math.abs(i%n-well%n)+Math.abs(Math.floor(i/n)-Math.floor(well/n));if(d<dist){dist=d;best=i;}}if(best==null)return null;const c=this.cellPosition(best);return{left:c.x-c.w/2,top:c.y-c.h/2,width:c.w*2,height:c.h*2};}
 if(!step.target)return null;const el=document.querySelector(step.target);if(!el||el.closest('[hidden]'))return null;const b=el.getBoundingClientRect();return b.width&&b.height?b:null;
};
M.positionGuide=function(){if(!this.guideActive||this.preparingGuide34)return;const step=this.guideSteps()[this.s.tutorialStep];if(!step)return;const card=$('live-guide'),ring=$('guide-ring'),b=this.guideBounds34(step);ring.hidden=!b;if(b)Object.assign(ring.style,{left:(b.left-3)+'px',top:(b.top-3)+'px',width:(b.width+6)+'px',height:(b.height+6)+'px'});
 const vw=window.visualViewport?.width||innerWidth,vh=window.visualViewport?.height||innerHeight,top=(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--controls-top'))||8)+4;
 const w=Math.min(300,vw-24),h=Math.min(card.offsetHeight||150,vh-top-12);card.style.width=w+'px';
 const candidates=[{x:vw-w-12,y:vh-h-12},{x:vw-w-12,y:top},{x:110,y:vh-h-12},{x:110,y:top}].map(p=>({x:Math.max(8,Math.min(vw-w-8,p.x)),y:Math.max(top,p.y)}));
 const overlap=(p,r)=>Math.max(0,Math.min(p.x+w,r.left+r.width)-Math.max(p.x,r.left))*Math.max(0,Math.min(p.y+h,r.top+r.height)-Math.max(p.y,r.top));
 const controls=['#plant-controls','#edit-controls','#map-controls','#market-back','#open-menu'].map(s=>document.querySelector(s)).filter(e=>e&&!e.hidden&&e.offsetWidth).map(e=>e.getBoundingClientRect());
 const score=p=>(b?overlap(p,b)*10:0)+controls.reduce((n,r)=>n+overlap(p,r),0);candidates.sort((a,b)=>score(a)-score(b));const pos=candidates[0];card.style.setProperty('--guide-x',pos.x+'px');card.style.setProperty('--guide-y',pos.y+'px');
};
const picker=M.openPicker;M.openPicker=function(...args){const r=picker.apply(this,args);this.guideEvent('openPlot');$('picker-items').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>this.guideEvent('seedChosen')));return r;};
const worker=M.openWorker;M.openWorker=function(...args){const r=worker.apply(this,args);this.guideEvent('workerOpen');return r;};
const closePanels=M.closeAllPanels;M.closeAllPanels=function(){closePanels.call(this);if($('tutorial-chapters34'))$('tutorial-chapters34').hidden=true;};
const create=M.create;M.create=function(){create.call(this);
 $('guide-skip').addEventListener('click',e=>{e.stopImmediatePropagation();if(this.guideSteps()[this.s.tutorialStep]?.event)this.nextTutorial(true);else this.finishTutorial();},true);
 const close=document.createElement('button');close.className='guide-close34';close.textContent='×';close.setAttribute('aria-label','Прервать обучение');close.onclick=()=>this.finishTutorial();$('live-guide').prepend(close);
 const replay=document.createElement('button');replay.textContent='Повторить реплику';replay.className='guide-replay34';replay.onclick=()=>this.playNarration(this.guideSteps()[this.s.tutorialStep]?.id);$('live-guide').append(replay);replay.hidden=!Object.keys(OasisNarrationFiles).length;
 const back=$('buildings-back'),cross=$('buildings-close');back.textContent='×';back.setAttribute('aria-label','Закрыть постройки');back.addEventListener('click',e=>{e.stopImmediatePropagation();$('buildings').hidden=true;},true);cross.hidden=true;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stopNarration();});
 const enabled=this.audio.setEnabled.bind(this.audio);this.audio.setEnabled=v=>{enabled(v);if(!v)this.stopNarration();};
 this.render();
};
})();
