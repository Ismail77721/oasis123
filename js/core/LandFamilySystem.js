/* ОАЗИС 1.6: persistent land, 4x4 household, combined orders. No dependency on Phaser. */
(function(){
 'use strict';
 const C=window.OASIS_CONFIG,B=window.OASIS_BUILDINGS,E=window.OasisEconomy,G=window.OasisGameState;
 const SIDES=[16,20,24], COSTS={16:600,20:1800},HOUSE_MAX=5;
 C.dayMinutes=60;C.nightMinutes=60;C.version='1.6.0';
 Object.assign(B,{
  mill:{title:'Мельница',unlock:6,cost:260,feed:'wheat',feedAmount:5,water:0,duration:1200,product:'flour',amount:3,price:58},
  loom:{title:'Ткацкая мастерская',unlock:7,cost:290,feed:'wool',feedAmount:4,water:0,duration:1320,product:'cloth',amount:2,price:88}
 });
 const PRODUCT_NAMES={wool:'Шерсть',camelMilk:'Верблюжье молоко',honey:'Мёд',cuminOil:'Масло тмина',oliveOil:'Оливковое масло',flour:'Мука',cloth:'Ткань'};
 const PRODUCT_ICONS={wool:'🧶',camelMilk:'🥛',honey:'🍯',cuminOil:'🏺',oliveOil:'🫒',flour:'🌾',cloth:'🧵'};
 const round=n=>Math.round(n*100)/100;
 const validSide=n=>SIDES.includes(n)?n:16;
 function setWorld(side){C.worldSize=validSide(side);const offset=(C.worldSize-16)/2;C.wellIndex=(7+offset)*C.worldSize+(7+offset);}
 const oldNew=G.createNew,oldNormalize=G.normalize;
 const houseSide=house=>house ? (house.size===2 ? 2 : 4) : 2;
 function footprint(s,row=s.house?.row,col=s.house?.col){const n=s.worldSize||C.worldSize,ids=[],side=houseSide(s.house);for(let r=0;r<side;r++)for(let c=0;c<side;c++)ids.push((row+r)*n+col+c);return ids;}
 function occupied(s,row,col){const n=s.worldSize||C.worldSize;if(row<0||col<0||row+houseSide(s.house)>n||col+houseSide(s.house)>n)return true;return footprint(s,row,col).some(i=>i===C.wellIndex||s.tiles[i]?.crop||s.tiles[i]?.canal||s.tiles[i]?.building);}
 function placeHouse(s){
  if(s.house&&Number.isInteger(s.house.row)&&Number.isInteger(s.house.col)&&!occupied(s,s.house.row,s.house.col))return;
  const offset=(s.worldSize-16)/2;
  const candidates=[[11+offset,1+offset],[11+offset,2+offset],[10+offset,1+offset],[1+offset,11+offset]];
  for(let row=1;row<=s.worldSize-5;row++)for(let col=1;col<=s.worldSize-5;col++)candidates.push([row,col]);
  const where=candidates.find(([r,c])=>!occupied(s,r,c));
  if(where)s.house={size:houseSide(s.house),row:where[0],col:where[1],level:Math.min(HOUSE_MAX,Math.max(1,s.house?.level||s.houseLevel||1))};
  else s.house={size:houseSide(s.house),row:Math.max(0,11+offset),col:Math.max(0,1+offset),level:1};
 }
 function isHome(s,index){if(!s?.house)return false;return footprint(s).includes(index);}
 function foodNeeds(s){
  const lvl=window.OasisProgression.level(s),tier=Math.min(5,Math.max(1,s.house?.level||1));
  const pool=['watermelon'];
  if(lvl>=3)pool.push('melon');
  if(lvl>=6)pool.push('wheat');
  if(lvl>=9)pool.push('pomegranate');
  if(lvl>=12)pool.push('dates');
  const epoch=Math.floor((s.family?.needSequence||0));
  const id=pool[epoch%pool.length];
  return [{id,amount:Math.max(1,Math.ceil(tier/3))}];
 }
 function ensureFamily(s,now=Date.now()){
  if(!s.family||typeof s.family!=='object')s.family={needSequence:0,nextDueAt:0,met:false,provided:0,happiness:100,lastPenalty:0};
  const f=s.family;
  if(!Number.isFinite(f.nextDueAt))f.nextDueAt=0;
  if(!Number.isFinite(f.needSequence))f.needSequence=0;
  if(!Number.isFinite(f.happiness))f.happiness=100;
  if(now>=f.nextDueAt && f.met){f.met=false;f.needSequence++;f.nextDueAt=0;}
  if(!Array.isArray(f.needs)||!f.needs.length||!f.met&&f.nextDueAt===0)f.needs=foodNeeds(s);
  // Missed feeding is gentle: no auto-deletion of crops, property or inventory.
  return f;
 }
 function ensure(s,now=Date.now()){
  if(!s)return s;
  s.worldSize=C.worldSize;
  const well=s.wellPosition;
  if(well&&Number.isInteger(well.row)&&Number.isInteger(well.col)&&well.row>=0&&well.col>=0&&well.row<s.worldSize&&well.col<s.worldSize){
   C.wellIndex=well.row*s.worldSize+well.col;
  }
  if(!s.inventory)s.inventory={};
  for(const b of Object.values(B))if(!Number.isFinite(s.inventory[b.product]))s.inventory[b.product]=0;
  if(!s.seedBank)s.seedBank={};
  if(!s.house || !Number.isInteger(s.house.row) || !Number.isInteger(s.house.col))placeHouse(s);
  else s.house.level=Math.min(HOUSE_MAX,Math.max(1,Math.floor(s.house.level||1)));
  ensureFamily(s,now);
  return s;
 }
 G.createNew=function(){setWorld(16);return ensure(oldNew());};
 G.normalize=function(s){setWorld(validSide(s?.worldSize));const fresh=oldNormalize(s);
  if(s?.house && s.worldSize && fresh.worldSize!==s.worldSize){const shift=(fresh.worldSize-s.worldSize)/2;fresh.house={...s.house,row:s.house.row+shift,col:s.house.col+shift};}
  const n=fresh.worldSize;
  if(s?.wellPosition&&s.worldSize&&n!==s.worldSize){
   const shift=(n-s.worldSize)/2;
   fresh.wellPosition={row:s.wellPosition.row+shift,col:s.wellPosition.col+shift};
  }
  return ensure(fresh);
 };
 function upgradeHome(s){ensure(s);const lv=s.house.level;if(lv>=HOUSE_MAX)return{ok:false,reason:'Дом полностью улучшен'};
  const price=[0,160,380,800,1500][lv];if(s.coins<price)return{ok:false,reason:'Недостаточно монет'};
  s.coins=round(s.coins-price);s.house.level++;return{ok:true,level:s.house.level,price};
 }
 function feed(s,now=Date.now()){
  ensure(s,now);const f=s.family;
  if(f.met)return{ok:false,reason:'Семья уже обеспечена до следующего приёма пищи'};
  for(const item of f.needs)if((s.inventory[item.id]||0)<item.amount)return{ok:false,reason:'Не хватает продуктов для семьи'};
  for(const item of f.needs)s.inventory[item.id]-=item.amount;
  f.met=true;f.provided++;f.nextDueAt=now+(C.dayMinutes+C.nightMinutes)*60000;f.happiness=Math.min(100,f.happiness+10);
  return{ok:true,nextDueAt:f.nextDueAt};
 }
 function buyFood(s){ensure(s);if(s.family.met)return{ok:false,reason:'Продукты пока не нужны'};
  let cost=0;const missing=[];
  for(const item of s.family.needs){const deficit=Math.max(0,item.amount-(s.inventory[item.id]||0));if(deficit){missing.push({id:item.id,qty:deficit});cost+=Math.ceil((C.crops[item.id]?.sellPrice||8)*1.6)*deficit;}}
  if(!missing.length)return{ok:false,reason:'Вся необходимая еда уже в амбаре'};
  if(s.coins<cost)return{ok:false,reason:'Недостаточно монет'};
  s.coins=round(s.coins-cost);for(const m of missing)s.inventory[m.id]=(s.inventory[m.id]||0)+m.qty;
  return{ok:true,cost};
 }
 function expansionPrice(s){return COSTS[s.worldSize]??null;}
 function expand(s){const price=expansionPrice(s);if(price===null)return{ok:false,reason:'Вся доступная территория открыта'};
  if(s.coins<price)return{ok:false,reason:'Недостаточно монет для расширения'};
  const oldN=s.worldSize,newN=oldN+4;const cells=Array.from({length:newN*newN},G.tile);
  for(let r=0;r<oldN;r++)for(let c=0;c<oldN;c++)cells[(r+2)*newN+c+2]=s.tiles[r*oldN+c];
  s.tiles=cells;s.worldSize=newN;s.coins=round(s.coins-price);
  if(s.house){s.house.row+=2;s.house.col+=2;}
  if(s.wellPosition){s.wellPosition.row+=2;s.wellPosition.col+=2;}
  for(const w of Object.values(s.workers||{})){
   for(const key of ['target','from'])if(w[key]>=0)w[key]=(Math.floor(w[key]/oldN)+2)*newN+w[key]%oldN+2;
  }
  setWorld(newN);ensure(s);return{ok:true,price,newSize:newN};
 }
 const oldPlant=E.plant;
 E.plant=function(s,index,id,now){if(isHome(s,index))return{ok:false,reason:'Участок занят домом семьи'};if(window.OasisMapLayout?.buildingAt(s,index)!=null)return{ok:false,reason:'Участок занят постройкой'};return oldPlant(s,index,id,now);};
 // Make orders with 1-4 different products; never duplicate slot contents and include seeds later.
 function available(s){const lv=window.OasisProgression.level(s),items=[];
  for(const [id,c] of Object.entries(C.crops))if(c.unlock<=lv){items.push({id,category:'raw',price:c.sellPrice});if(lv>=4)items.push({id,category:'seed',price:c.seedCost*.65});}
  for(const b of Object.values(B))if(s.tiles.some(t=>t.building&&B[t.building]?.product===b.product))items.push({id:b.product,category:'product',price:b.price});
  return items.length?items:[{id:'clover',category:'raw',price:2}];
 }
 function makeOrder(s,slot){const pool=available(s),seq=(s.ordersCompleted||0)*11+slot*13;
  const lvl=window.OasisProgression.level(s);
  let n=slot<2?1:Math.min(lvl>=13?4:lvl>=6?3:2,Math.max(1,pool.length));
  const taken=new Set(),items=[];
  let cursor=(seq+slot)%pool.length;
  for(let z=0;z<pool.length*3&&items.length<n;z++){
   const item=pool[(cursor+z*5+Math.floor(z/3))%pool.length],key=item.category+':'+item.id;
   if(taken.has(key))continue;
   taken.add(key);const qty=1+((slot+z+(s.ordersCompleted||0))%4);
   items.push({id:item.id,category:item.category,quantity:qty});
  }
  if(!items.length)items.push({id:'clover',category:'raw',quantity:2});
  const gross=items.reduce((sum,x)=>sum+(x.quantity*(pool.find(p=>p.id===x.id&&p.category===x.category)?.price||2)),0);
  const multi=items.length>1;
  const premium=multi?1.3+(items.length-2)*.05:1.15;
  const reward=Math.ceil(gross*premium);
  return {id:items[0].id,quantity:items[0].quantity,items,reward,kind:multi?'Составной заказ':'Заказ',serial:(s.ordersCompleted||0)*11+slot};
 }
 function signature(order){return (order.items||[{id:order.id,category:'raw',quantity:order.quantity}]).map(x=>x.category+':'+x.id+':'+x.quantity).join('|');}
 E.ensureOrders=function(s){if(!Array.isArray(s.orders))s.orders=[];
  const seen=new Set();for(let i=0;i<6;i++){
   // Migrate legacy orders to varied orders on upgrade; preserve post-v1.6 orders if unique.
   let o=s.orders[i];
   if(!o||!Array.isArray(o.items)||!o.items.length||o.items.some(x=>!(x.category==='seed'?C.crops[x.id]:C.crops[x.id]||Object.values(B).some(b=>b.product===x.id)))||seen.has(signature(o))){
    let tries=0;do{o=makeOrder({...s,ordersCompleted:(s.ordersCompleted||0)+tries},i);tries++;}while(seen.has(signature(o))&&tries<40);
    s.orders[i]=o;
   }
   seen.add(signature(o));
  }
  s.orders.length=6;return s.orders;
 };
 E.completeOrder=function(s,slot){E.ensureOrders(s);if(!Number.isInteger(slot)||slot<0||slot>=6)return{ok:false,reason:'Заказ не найден'};
  const order=s.orders[slot],required=order.items||[{id:order.id,category:'raw',quantity:order.quantity}];
  for(const item of required){const stock=item.category==='seed'?s.seedBank:s.inventory;if((stock[item.id]||0)<item.quantity)return{ok:false,reason:'Не хватает товаров для выполнения заказа'};}
  for(const item of required){const stock=item.category==='seed'?s.seedBank:s.inventory;stock[item.id]-=item.quantity;}
  const income=E.receiveIncome(s,order.reward);s.ordersCompleted=(s.ordersCompleted||0)+1;
  s.orders[slot]=makeOrder(s,slot);E.ensureOrders(s);
  return {...income,slot};
 };
 const labels=id=>PRODUCT_NAMES[id]||C.crops[id]?.title||id;
 const icons=id=>PRODUCT_ICONS[id]||C.crops[id]?.icon||'📦';
 window.OasisFamilyLand={SIDES,ensure,placeHouse,isHome,footprint,upgradeHome,feed,buyFood,expansionPrice,expand,labels,icons,HOUSE_MAX,ensureFamily,houseSide};
})();
