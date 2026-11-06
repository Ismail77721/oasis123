/* ОАЗИС v1.7 — voluntary help, 3/4-game-day requests and persistent community projects.
 * Pure gameplay model: no DOM/Phaser dependency. Barakat stays strictly internal.
 */
(function(){'use strict';
 const DAY_MS=()=>Math.max(1,(OASIS_CONFIG.dayMinutes+OASIS_CONFIG.nightMinutes))*60000;
 const round=n=>Math.round(n*100)/100;
 const REQUESTS=[
  {id:'water',title:'Помощь семье с водой',description:'Семье из соседнего селения нужна чистая вода.',coins:15,points:15},
  {id:'seed',title:'Семена для соседнего хозяйства',description:'Земледельцы просят помощи с покупкой семян.',coins:28,points:28},
  {id:'bread',title:'Продукты для нуждающихся',description:'На общей кухне готовят еду для семей.',goods:'wheat',amount:3,points:42},
  {id:'honey',title:'Поделиться мёдом',description:'Нуждающейся семье пригодится мёд.',goods:'honey',amount:1,points:40},
  {id:'grain',title:'Зерно для соседей',description:'Семье нужна поддержка до следующего урожая.',goods:'barley',amount:4,points:43},
  {id:'care',title:'Восстановление дома',description:'Соседи собирают помощь на материалы для ремонта.',coins:65,points:70},
  {id:'clothing',title:'Одежда для семьи',description:'Семье нужна тёплая одежда и ткань.',goods:'cloth',amount:2,points:50},
  {id:'treatment',title:'Помощь в лечении',description:'Собирают средства на лечение нуждающегося.',coins:55,points:55},
  {id:'flour',title:'Мука для общественной кухни',description:'На кухне требуется мука для приготовления пищи.',goods:'flour',amount:2,points:45},
  {id:'dates',title:'Финики для семей',description:'Нескольким семьям нужны продукты питания.',goods:'dates',amount:4,points:46},
  {id:'roof',title:'Ремонт кровли',description:'Необходимо помочь семье отремонтировать крышу.',coins:90,points:80},
  {id:'supplies',title:'Школьные принадлежности',description:'Семьи собирают средства на учебные материалы.',coins:45,points:48},
  {id:'milk',title:'Молоко для семьи',description:'Семье пригодятся продукты для детей.',goods:'camelMilk',amount:2,points:45}
 ];
 const PROJECTS=[
  {id:'mosque',title:'Строительство мечети',description:'Помоги собрать средства на общественную мечеть и место для молитвы.',goal:10000,icon:'🕌'},
  {id:'school',title:'Строительство школы',description:'Нужны средства на классы, учебные материалы и оборудование.',goal:7000,icon:'📚'},
  {id:'hospital',title:'Строительство больницы',description:'Сбор на медицинские помещения и оснащение.',goal:12000,icon:'🏥'},
  {id:'well',title:'Общественный колодец',description:'Чистая вода для соседнего поселения.',goal:2500,icon:'💧'},
  {id:'housing',title:'Жильё для нуждающихся',description:'Поддержка строительства нескольких домов.',goal:4800,icon:'🏠'}
 ];
 const BLESSINGS=[
  {text:'Пусть Аллах примет твою помощь!',reply:'Амин'},
  {text:'Да воздаст тебе Аллах благом!',reply:'И вам того же'},
  {text:'Пусть Аллах благословит твоё имущество!',reply:'Амин'},
  {text:'Да наградит тебя Аллах за твою доброту!',reply:'Амин'}
 ];
 function hash(id){let n=0;for(const c of String(id))n=(n*31+c.charCodeAt(0))>>>0;return n;}
 function blessing(id){return {...BLESSINGS[hash(id)%BLESSINGS.length]};}
 function localDay(now=Date.now()){const d=new Date(now);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
 function gameDay(s,now=Date.now()){
  const origin=Number.isFinite(s?.createdAt)&&s.createdAt>0?s.createdAt:now;
  return Math.max(0,Math.floor((now-origin)/DAY_MS()));
 }
 function freshRequest(template,day,wave){return {...template,introducedDay:day,wave,done:false};}
 function ensure(s,now=Date.now()){
  if(!s||typeof s!=='object')throw Error('Invalid save data');
  const day=gameDay(s,now);
  if(!s.charity||s.charity.version!==1||!Array.isArray(s.charity.requests)){
   // For an existing save, start the new cycle now; never replay months of old requests.
   const initial=REQUESTS.slice(0,6).map(t=>freshRequest(t,day,0));
   const legacy=Array.isArray(s.donationHistory)?s.donationHistory:[];
   for(const r of initial)if(legacy.includes(localDay(now)+':'+r.id))r.done=true;
   s.charity={version:1,wave:0,nextRefreshDay:day+3,requests:initial,campaigns:{}};
  }
  const data=s.charity;
  if(!data.campaigns||typeof data.campaigns!=='object')data.campaigns={};
  for(const p of PROJECTS){
   const current=data.campaigns[p.id];
   data.campaigns[p.id]={raised:Math.max(0,Math.min(p.goal,Math.floor(Number(current?.raised)||0)))};
  }
  // New requests after alternating 3 and 4 game-days (day = 2 real hours).
  let updates=0;
  while(day>=data.nextRefreshDay&&updates<12){
   data.wave++;const wave=data.wave;
   const pool=REQUESTS.slice(6);
   const arrivals=pool.slice(((wave-1)*3)%pool.length).concat(pool.slice(0,((wave-1)*3)%pool.length)).slice(0,3);
   for(const [i,t] of arrivals.entries())data.requests.push(freshRequest({...t,id:t.id+'-w'+wave},data.nextRefreshDay,wave));
   // Keep recent fulfilled requests for a short period, and at most 12 open requests.
   data.requests=data.requests.filter(r=>!r.done||wave-(r.wave||0)<1);
   const open=data.requests.filter(r=>!r.done);
   if(open.length>12){const remove=new Set(open.slice(0,open.length-12));data.requests=data.requests.filter(r=>!remove.has(r));}
   data.nextRefreshDay+=(wave%2===1?4:3);
   updates++;
  }
  if(updates===12&&day>=data.nextRefreshDay)data.nextRefreshDay=day+3;
  return data;
 }
 function list(s,now=Date.now()){
  return ensure(s,now).requests.map(r=>({...r,blessing:blessing(r.id)}));
 }
 function projects(s,now=Date.now()){
  const c=ensure(s,now);
  return PROJECTS.map(p=>({...p,raised:c.campaigns[p.id].raised,remaining:p.goal-c.campaigns[p.id].raised,completed:c.campaigns[p.id].raised>=p.goal}));
 }
 function grantHiddenBenefit(s,points){
  s.barakatPoints=Math.max(0,(Number(s.barakatPoints)||0))+points;
  s.barakatLevel=Math.min(20,Math.floor(s.barakatPoints/35));
 }
 function donate(s,id,now=Date.now()){
  const c=ensure(s,now),r=c.requests.find(q=>q.id===id);
  if(!r)return {ok:false,reason:'Просьба больше не активна'};
  if(r.done)return {ok:false,reason:'Помощь уже оказана'};
  if(r.coins&&(s.coins||0)<r.coins)return {ok:false,reason:'Недостаточно монет для помощи'};
  if(r.goods&&(s.inventory?.[r.goods]||0)<r.amount)return {ok:false,reason:'Недостаточно продуктов для помощи'};
  if(r.coins)s.coins=round(s.coins-r.coins);
  if(r.goods)s.inventory[r.goods]-=r.amount;
  r.done=true;
  s.totalDonated=round((Number(s.totalDonated)||0)+(r.coins||0));
  grantHiddenBenefit(s,r.points||15);
  if(!Array.isArray(s.donationHistory))s.donationHistory=[];
  s.donationHistory.push(localDay(now)+':'+r.id);s.donationHistory=s.donationHistory.slice(-120);
  return {ok:true,blessing:blessing(r.id)};
 }
 function contribute(s,id,amount,now=Date.now()){
  const c=ensure(s,now),project=PROJECTS.find(p=>p.id===id);
  if(!project)return {ok:false,reason:'Проект не найден'};
  amount=Number(amount);
  if(!Number.isSafeInteger(amount)||amount<=0)return {ok:false,reason:'Укажи целое положительное число монет'};
  const progress=c.campaigns[id],remaining=project.goal-progress.raised;
  if(remaining<=0)return {ok:false,reason:'Сбор уже завершён'};
  if(amount>remaining)return {ok:false,reason:'Для завершения сбора осталось '+remaining+' монет'};
  if((s.coins||0)<amount)return {ok:false,reason:'Недостаточно монет для пожертвования'};
  s.coins=round(s.coins-amount);progress.raised+=amount;
  s.totalDonated=round((Number(s.totalDonated)||0)+amount);
  grantHiddenBenefit(s,Math.max(1,Math.floor(amount/8)));
  return {ok:true,amount,raised:progress.raised,goal:project.goal,completed:progress.raised>=project.goal,blessing:blessing(id+':'+progress.raised)};
 }
 window.OasisSadaka={list,donate,projects,contribute,ensure,gameDay,localDay,blessing,BLESSINGS,PROJECTS};
})();
