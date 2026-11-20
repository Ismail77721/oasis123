(function(){'use strict';
const C=OASIS_CONFIG,B=OASIS_BUILDINGS,E=OasisEconomy,S=OasisSadaka;
C.version='3.6.1';
const data=[['Запасы для каравана','dates','flour'],['Фрукты для торговца','watermelon','melon'],['Заказ пекарни','flour','oliveOil'],['Пополнение масляной лавки','oliveOil','cuminOil'],['Поставка ткачу','wool'],['Ткань для торговых навесов','cloth'],['Корм для караванной стоянки','clover','barley'],['Запасы зерновой лавки','wheat','barley'],['Сладости к столу','honey','fig'],['Заказ фруктовой лавки','pomegranate','dates'],['Оливки для переработки','olive'],['Поставка на мельницу','wheat'],['Заказ молочной лавки','camelMilk'],['Тмин для маслобойни','cumin'],['Цветы для пасеки','flowers'],['Редкие плоды','sidr','fig'],['Провизия для постоялого двора','flour','camelMilk','dates'],['Большая фруктовая поставка','watermelon','melon','pomegranate'],['Товары для выездной торговли','honey','cuminOil','cloth'],['Заказ соседнего поселения','flour','oliveOil','dates']];
const product=id=>Object.values(B).find(b=>b.product===id),price=id=>C.crops[id]?.sellPrice||product(id)?.price||1;
const unlocked=(s,id)=>C.crops[id]?C.crops[id].unlock<=OasisProgression.level(s):s.tiles.some(t=>B[t.building]?.product===id);
const orders=data.map(([title,...ids],i)=>({key:'order'+i,title,items:ids.map(id=>({id,quantity:C.crops[id]?4:2,category:C.crops[id]?'raw':'product'}))}));
function poolOrders(s){
 const level=OasisProgression.level(s), available=new Set(Object.keys(C.crops).filter(id=>C.crops[id].unlock<=level));
 for(const tile of s.tiles){const output=B[tile.building]?.product;if(output)available.add(output);}
 return orders.map(o=>{const items=o.items.filter(x=>available.has(x.id));return items.length===o.items.length?o:['order1','order6'].includes(o.key)&&items.length?{...o,items}:null;}).filter(Boolean);}
const helpData=[['Молоко для семьи',['camelMilk']],['Мука для общей кухни',['flour']],['Финики для пожилых соседей',['dates']],['Урожай для большой семьи',['watermelon','melon']],['Запасы для путников',['dates','flour']],['Зерно в общий запас',['wheat']],['Корм для хозяйства соседей',['clover']],['Ячмень после засухи',['barley']],['Мёд к семейному столу',['honey']],['Масло для общей кухни',['oliveOil']],['Пополнить семейную кладовую',['flour','cuminOil']],['Одежда к холодам',['cloth']],['Шерсть для тёплых вещей',['wool']],['Семена для нового посева',['watermelon','clover'],'seed'],['Восстановить пшеничное поле',['wheat'],'seed'],['Новый семейный сад',['fig'],'seed'],['Плоды для соседей',['fig','pomegranate']],['Починить общий колодец',[],35],['Крыша для семьи',[],50],['Восстановить общий арык',[],25]];
const requests=helpData.map(([title,ids,type],i)=>({key:'help'+i,title,description:typeof type==='number'?'Помоги соседям приобрести материалы.':type==='seed'?'Передай семена или саженцы соседнему хозяйству.':'Поделись запасами с соседями.',coins:typeof type==='number'?type:0,items:ids.map(id=>({id,quantity:type==='seed'?1:C.crops[id]?3:1,category:type==='seed'?'seed':'raw'}))}));
function history(s){s.rotation35||={};for(const k of ['orders','help'])if(!Array.isArray(s.rotation35[k]))s.rotation35[k]=[];return s.rotation35;}
function rotate(list,pool,seen,d,make){
 // Keep fixed slots while replacing, so an open card never targets a shifted index.
 for(let i=0;i<4;i++){const old=list[i];if(old&&(old.done?d<old.replaceDay:d<old.expiresDay))continue;
 const candidates=pool.filter(t=>!list.some((a,j)=>j!==i&&a?.key===t.key));let t=candidates.find(t=>!seen.includes(t.key));
 if(!t&&candidates.length){seen.length=0;t=candidates.find(t=>t.key!==old?.key)||candidates[0];}
 if(t){seen.push(t.key);list[i]=make(t,d);}else list[i]=null;
 }return list.slice(0,4).filter(Boolean);
}
E.ensureOrders=function(s,now=Date.now()){
 const day=S.gameDay(s,now);
 if(s.orderDay36===day && Array.isArray(s.orders))return s.orders;
 const pool=poolOrders(s),count=Math.min(15,pool.length);
 const carried=s.orderDay36==null?(s.orders||[]).filter(o=>o?.introducedDay===day&&pool.some(t=>t.key===o.key)):[];
 const selected=carried.slice(0,count);
 for(let i=0;i<pool.length&&selected.length<count;i++){
  const template=pool[(day*3+i)%pool.length];
  if(selected.some(o=>o.key===template.key))continue;
  selected.push({...template,items:template.items.map(x=>({...x})),kind:template.title,reward:Math.ceil(template.items.reduce((sum,x)=>sum+price(x.id)*x.quantity,0)*1.15),introducedDay:day,done:false});
 }
 s.orders=selected.sort((a,b)=>a.items.reduce((n,x)=>n+(C.crops[x.id]?1:3),0)-b.items.reduce((n,x)=>n+(C.crops[x.id]?1:3),0));
 s.orderDay36=day;s.ordersVersion35=1;
 return s.orders;
};
E.completeOrder=function(s,slot,now=Date.now(),expectedKey){const o=E.ensureOrders(s,now)[slot];if(!Number.isInteger(slot)||!o||o.done||(expectedKey&&expectedKey!==o.key+':'+o.introducedDay))return{ok:false,reason:'Заказ уже отправлен или обновился. Открой список снова.'};if(o.items.some(x=>(s.inventory[x.id]||0)<x.quantity))return{ok:false,reason:'Не хватает товара для заказа'};for(const x of o.items)s.inventory[x.id]-=x.quantity;const r=E.receiveIncome(s,o.reward);o.done=true;o.replaceDay=S.gameDay(s,now)+1;s.ordersCompleted=(s.ordersCompleted||0)+1;return{...r,slot};};
S.ensure=function(s,now=Date.now()){const d=S.gameDay(s,now);s.charity||={campaigns:{}};const c=s.charity;c.campaigns||={};for(const p of S.PROJECTS){c.campaigns[p.id]||={raised:0};c.campaigns[p.id].raised=Math.max(0,Math.min(p.goal,Number(c.campaigns[p.id].raised)||0));}if(c.version35!==1){c.requestsBefore35=c.requests||[];c.requests=[];c.version35=1;}
 c.requests=rotate(c.requests,requests.filter(t=>t.items.every(x=>unlocked(s,x.id))),history(s).help,d,(t,d)=>({...t,items:t.items.map(x=>({...x})),id:t.key+'-'+d,introducedDay:d,expiresDay:d+2,done:false}));c.nextRefreshDay=Math.min(...c.requests.map(r=>r.done?r.replaceDay:r.expiresDay));c.wave=d;return c;};
S.list=(s,now=Date.now())=>S.ensure(s,now).requests.map(r=>({...r,blessing:S.blessing(r.id)}));
function benefit(s,points,now){const day=Math.floor(now/86400000);s.blessingGrowth||={points:0,day,today:0};const b=s.blessingGrowth;if(day>b.day){b.day=day;b.today=0;}const grant=Math.min(Math.max(0,points)*.01,Math.max(0,1-b.today));b.today+=grant;b.points=Math.min(180,b.points+grant);s.barakatPoints=Math.max(0,Number(s.barakatPoints)||0)+grant;}
S.donate=function(s,id,now=Date.now()){const r=S.ensure(s,now).requests.find(r=>r.id===id);if(!r||r.done)return{ok:false,reason:'Помощь уже оказана или обращение обновилось'};if(s.coins<r.coins||r.items.some(x=>((x.category==='seed'?s.seedBank:s.inventory)[x.id]||0)<x.quantity))return{ok:false,reason:'Недостаточно запасов для помощи'};s.coins-=r.coins;for(const x of r.items)(x.category==='seed'?s.seedBank:s.inventory)[x.id]-=x.quantity;r.done=true;r.replaceDay=S.gameDay(s,now)+1;s.totalDonated=(s.totalDonated||0)+r.coins;benefit(s,30,now);s.donationHistory||=[];s.donationHistory.push(S.localDay(now)+':'+r.id);s.donationHistory=s.donationHistory.slice(-120);return{ok:true,blessing:S.blessing(r.id)};};
S.projects=(s,now=Date.now())=>{const c=S.ensure(s,now);return S.PROJECTS.map(p=>({...p,raised:c.campaigns[p.id].raised,remaining:p.goal-c.campaigns[p.id].raised,completed:c.campaigns[p.id].raised>=p.goal}));};
S.contribute=function(s,id,amount,now=Date.now()){const p=S.PROJECTS.find(p=>p.id===id),c=S.ensure(s,now);amount=Number(amount);if(!p||!Number.isSafeInteger(amount)||amount<=0)return{ok:false,reason:'Укажи целое положительное число монет'};const progress=c.campaigns[id];if(amount>p.goal-progress.raised||amount>s.coins)return{ok:false,reason:'Проверь сумму и доступные монеты'};s.coins-=amount;progress.raised+=amount;s.totalDonated=(s.totalDonated||0)+amount;benefit(s,amount/8,now);return{ok:true,amount,raised:progress.raised,goal:p.goal,completed:progress.raised>=p.goal,blessing:S.blessing(id+':'+progress.raised)};};
window.OasisContent35={orders,requests,unlocked};
})();
