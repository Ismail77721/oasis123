/* Oasis economy: independent of Phaser and of any future hosting platform. */
(function () {
 'use strict';
 const crops = () => OASIS_CONFIG.crops;
 const round = value => Math.round(value * 100) / 100;
 const level = s => OasisProgression.level(s);
 const ok = extra => Object.assign({ok:true},extra||{});
 const fail = reason => ({ok:false,reason});
 const isPerennial = id => crops()[id]?.type === 'perennial';
 const available = s => Object.entries(crops()).filter(([id,c])=> c.unlock <= level(s)).map(([id])=>id);
 function buySeed(s,id,quantity=1){
  const crop=crops()[id];if(!crop)return fail('Неизвестная культура');
  if(crop.unlock>level(s))return fail('Культура откроется на уровне '+crop.unlock);
  quantity=Number(quantity);
  if(!Number.isInteger(quantity)||quantity<1||quantity>100)return fail('Недопустимое количество');
  const price=crop.seedCost*quantity;
  if(s.coins<price)return fail('Недостаточно монет');
  s.coins=round(s.coins-price);s.seedBank[id]=(s.seedBank[id]||0)+quantity;
  return ok({quantity,cost:price});
 }
 function plant(s,i,id,now=Date.now()){
  const crop=crops()[id],t=s.tiles[i];
  if(!crop||!t)return fail('Невозможно посадить');
  if(i===OASIS_CONFIG.wellIndex||t.crop||t.building||t.canal||window.OasisMapLayout?.objectAt(s,i))return fail('Клетка занята');
  if(crop.unlock>level(s))return fail('Культура ещё не открыта');
  if((s.seedBank[id]||0)<1)return fail('Нет семян. Посети семенную лавку на базаре');
  s.seedBank[id]--;t.crop=id;t.plantedAt=now;t.watered=false;t.perennialEstablished=false;
  s.selectedCrop=id;s.stats.planted=(s.stats.planted||0)+1;
  return ok({id});
 }
 function harvest(s,i,now=Date.now()){
  const t=s.tiles[i],crop=t&&crops()[t.crop];
  if(!crop)return fail('На грядке нет урожая');
  if(now-t.plantedAt<crop.growSeconds*1000)return fail('Урожай ещё растёт');
  const id=t.crop,base=crop.yield+OasisProgression.cropBonus(s);
  const rate=Math.min(.3,Math.max(0,s.blessingGrowth?.points||0)*.002);
  s.blessingRemainders ||= {};
  const accumulated=(s.blessingRemainders[id]||0)+base*rate;
  const extra=Math.floor(accumulated+1e-9),amount=base+extra;
  s.blessingRemainders[id]=accumulated-extra;
  s.inventory[id]=(s.inventory[id]||0)+amount;
  s.stats.harvested=(s.stats.harvested||0)+amount;
  if(isPerennial(id)){
   s.seedBank[id]=(s.seedBank[id]||0)+1; // seed / cutting recovered from the fruiting plant
   t.plantedAt=now;t.watered=false;t.perennialEstablished=true;
   return ok({id,amount,seedReturned:1,perennial:true});
  }
  s.seedBank[id]=(s.seedBank[id]||0)+1;
  t.crop=null;t.plantedAt=0;t.watered=false;t.perennialEstablished=false;
  return ok({id,amount,seedReturned:1,perennial:false});
 }
 function receiveIncome(s,gross){
  if(!Number.isFinite(gross)||gross<=0)return fail('Неверная сумма');
  gross=round(gross);
  // Full price is received; no automatic sadaqa or hidden sales bonus.
  s.coins=round(s.coins+gross);s.totalSold=round((s.totalSold||0)+gross);
  return ok({gross,net:gross,barakatBonus:0});
 }
 function sell(s,id,quantity){
  const crop=crops()[id];const b=Object.values(OASIS_BUILDINGS).find(v=>v.product===id);
  const unit=crop?crop.sellPrice:b?.price;
  if(!unit)return fail('Товар нельзя продать');
  if(quantity==null)quantity=s.inventory[id]||0;
  if(!Number.isInteger(quantity)||quantity<1||(s.inventory[id]||0)<quantity)return fail('Не хватает товара');
  s.inventory[id]-=quantity;
  return Object.assign(receiveIncome(s,quantity*unit),{id,quantity});
 }
 function orderPool(s){const cropItems=available(s).map(id=>({id,price:crops()[id].sellPrice,title:crops()[id].title}));
  const buildingItems=Object.values(OASIS_BUILDINGS).filter(b=>s.tiles.some(t=>t.building&&OASIS_BUILDINGS[t.building]?.product===b.product)).map(b=>({id:b.product,price:b.price,title:b.title}));
  return [...cropItems,...buildingItems];
 }
 function nextOrder(s,slot){
  const pool=orderPool(s),seq=(s.ordersCompleted||0)+slot*7;
  const item=pool[seq%pool.length]||{id:'clover',price:2};
  const type=seq%4,quantity=type===0?2:type===1?4:type===2?6:9;
  const premium=[1.1,1.15,1.2,1.3][type];
  const reward=Math.max(8,Math.ceil(quantity*item.price*premium));
  return {id:item.id,quantity,reward,kind:['Обычный','Срочный','Оптовый','Особый'][type]};
 }
 function ensureOrders(s){
  if(!Array.isArray(s.orders))s.orders=[];
  for(let i=0;i<6;i++){
   const o=s.orders[i],valid=crops()[o?.id]||Object.values(OASIS_BUILDINGS).some(b=>b.product===o?.id);
   if(!o||!valid||!Number.isInteger(o.quantity)||o.quantity<1||!Number.isFinite(o.reward)||o.reward<1)s.orders[i]=nextOrder(s,i);
  }
  s.orders.length=6;return s.orders;
 }
 function completeOrder(s,slot){
  ensureOrders(s);if(!Number.isInteger(slot)||slot<0||slot>=6)return fail('Заказ не найден');
  const o=s.orders[slot];if((s.inventory[o.id]||0)<o.quantity)return fail('Не хватает товара для заказа');
  s.inventory[o.id]-=o.quantity;
  const income=receiveIncome(s,o.reward);
  s.ordersCompleted=(s.ordersCompleted||0)+1;
  s.orders[slot]=nextOrder(s,slot);
  return Object.assign(income,{slot});
 }
 function recoverySeed(s,now=Date.now()){
  const annual=Object.keys(crops()).filter(id=>!isPerennial(id));
  if(annual.some(id=>(s.seedBank[id]||0)>0)||s.tiles.some(t=>t.crop&&annual.includes(t.crop)))return fail('Семена или растения уже есть');
  if(now-(s.lastRecoveryAt||0)<24*60*60*1000)return fail('Новый набор доступен завтра');
  s.seedBank.clover=(s.seedBank.clover||0)+1;s.lastRecoveryAt=now;
  return ok({id:'clover',quantity:1});
 }
 window.OasisEconomy={buySeed,plant,harvest,sell,receiveIncome,level,ensureOrders,completeOrder,recoverySeed,isPerennial};
})();
