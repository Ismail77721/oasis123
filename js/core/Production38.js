(function(){
 const goods={
  egg:{title:'Яйцо',price:5,amount:2,min:15,inputs:{barley:2}},
  flat:{title:'Лепёшка',price:42,amount:1,min:15,inputs:{flour:1,oliveOil:1}},
  loaf:{title:'Хлеб',price:37,amount:1,min:15,inputs:{flour:2,egg:1}},
  bun:{title:'Медовая булочка',price:70,amount:1,min:25,inputs:{flour:1,camelMilk:1,oliveOil:1,honey:1}}
 };
 Object.assign(OASIS_BUILDINGS,{
  coop:{title:'Курятник',cost:180,unlock:5,feed:'barley',feedAmount:2,water:0,duration:900,product:'egg',amount:2,price:5},
  bakery:{title:'Пекарня',cost:300,unlock:7,feed:'flour',feedAmount:1,water:0,duration:900,product:'flat',amount:1,price:42}
 });
 const owns=id=>id==='coop'||id==='bakery';
 const selected=t=>t.building==='coop'?'egg':['flat','loaf','bun'].includes(t.recipe38)?t.recipe38:'flat';
 const enough=(s,t)=>Object.entries(goods[selected(t)].inputs).every(([id,q])=>(s.inventory[id]||0)>=q);
 function cycle(s,t,action,now){
  const id=selected(t),r=goods[id];
  if(action==='feed'&&!t.productionAt&&enough(s,t)){
   for(const [k,q] of Object.entries(r.inputs))s.inventory[k]-=q;
   t.productionAt=now+Math.round(r.min*60000/(1+.1*((t.buildingLevel||1)-1)));return {ok:true};
  }
  if(action==='collect'&&t.productionAt>0&&now>=t.productionAt){t.productionAt=0;s.inventory[id]=(s.inventory[id]||0)+r.amount;return {ok:true,amount:r.amount};}
  return {ok:false};
 }
 const crops=()=>Object.entries(OASIS_CONFIG.crops).sort((a,b)=>a[1].unlock-b[1].unlock||a[1].title.localeCompare(b[1].title,'ru'));
 window.OasisProduction38={goods,owns,selected,enough,cycle,crops};
})();
